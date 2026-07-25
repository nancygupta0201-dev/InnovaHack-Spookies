import io
import os
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
import json 

from dotenv import load_dotenv
from pypdf import PdfReader

from google.genai import types
from google.adk.agents.context import Context
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk import Workflow
from google.adk.workflow import node
from google.adk.events import Event, EventActions

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from cv_analysis_agent import (cv_agent, Candidate, CVAnalysisInput)
from analysis_agent import (
    AnswerAnalysisInput, AnswerAnalysisOutput, create_answer_analysis_agent
)
from question_generation_agent import (
    create_question_generator_agent, QuestionGeneratorInput, QuestionGeneratorOutput
)

APP_NAME = "cvScreen"

from pathlib import Path
load_dotenv(Path(__file__).parent / ".env")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
print("DEBUG TAVILY_API_KEY:", repr(TAVILY_API_KEY))

def as_model(value, model):
    if isinstance(value, model):
        return value
    return model.model_validate(value)


# ---------------------------------------------------------------------------
# Nodes — start-of-interview
# ---------------------------------------------------------------------------

@node(rerun_on_resume=True)
async def extract_pdf_node(ctx: Context) -> None:
    pdf_bytes: bytes = ctx.state["pdf_bytes"]

    reader = PdfReader(io.BytesIO(pdf_bytes))
    text = "\n".join(page.extract_text() or "" for page in reader.pages)

    if not text.strip():
        raise ValueError(
            "No extractable text found in the PDF — looks like a scanned/"
            "image-only CV. OCR fallback would be needed here."
        )

    ctx.state["cv_text"] = text
    print(f"[extract_pdf_node] Extracted {len(text)} characters from CV.")


@node(rerun_on_resume=True)
async def cv_analysis_node(ctx: Context) -> Candidate:
    if ctx.state.get("candidate_result"):
        print("[memory] Reusing cached candidate result — skipping LLM call.")
        return Candidate.model_validate(ctx.state["candidate_result"])

    analysis_input = CVAnalysisInput(
        cv_text=ctx.state["cv_text"],
        job_description=ctx.state.get("job_title"),
    )

    result = as_model(
        await ctx.run_node(cv_agent, node_input=analysis_input), Candidate
    )

    ctx.state["candidate_result"] = result.model_dump()
    ctx.state["cv_summary"] = result.summary
    print(f"[cv_analysis_node] {result.name or 'Unknown candidate'} — "
          f"fit_score={result.fit_score}")
    return result


@node(rerun_on_resume=True)
async def greeting_node(ctx: Context) -> str:
    """The greeting IS the first question. Hardcoded — no LLM call."""
    candidate = as_model(ctx.state["candidate_result"], Candidate)
    name = candidate.name or "there"

    hour = datetime.now().hour
    if hour < 12:
        time_of_day = "Good morning"
    elif hour < 17:
        time_of_day = "Good afternoon"
    else:
        time_of_day = "Good evening"

    greeting = f"{time_of_day}, {name}! Welcome, let's get started with your interview."

    ctx.state["question"] = greeting
    print(f"[greeting_node] {greeting}")
    return greeting


start_workflow = Workflow(
    name="start_workflow",
    edges=[
        ("START", extract_pdf_node),
        (extract_pdf_node, cv_analysis_node),
        (cv_analysis_node, greeting_node),
    ],
)


# ---------------------------------------------------------------------------
# Nodes — per-turn (analyze the reply to `question`, generate the next one)
# ---------------------------------------------------------------------------

@node(rerun_on_resume=True)
async def answer_analysis_node(ctx: Context) -> AnswerAnalysisOutput:
    """Analyzes ctx.state['answer'] — the candidate's reply to whatever is
    currently in ctx.state['question']. On turn 1, that question is the
    greeting, so this analyzes how they responded to the greeting."""
    toolset, answer_analysis_agent = await create_answer_analysis_agent(ctx.state["tavely_token"])

    analysis_input = AnswerAnalysisInput(
        cv_summary=ctx.state["cv_summary"],
        question=ctx.state["question"],
        answer=ctx.state["answer"],
        gesture_data=ctx.state.get("gesture_data", {}),
        response_time_seconds=ctx.state["response_time_seconds"],
    )

    result = as_model(
        await ctx.run_node(
            answer_analysis_agent, node_input=analysis_input), AnswerAnalysisOutput)

    ctx.state["answer_analysis_output"] = result.model_dump()

    await toolset.close()
    print(result)
    return result


@node(rerun_on_resume=True)
async def question_generator_node(ctx: Context) -> QuestionGeneratorOutput:
    toolset, question_generator_agent = await create_question_generator_agent(ctx.state["tavely_token"])

    answer_analysis_output = as_model(ctx.state["answer_analysis_output"], AnswerAnalysisOutput)

    question_input = QuestionGeneratorInput(
        cv_summary=ctx.state["cv_summary"],
        previous_question=ctx.state["question"],
        previous_answer=ctx.state["answer"],
        answer_analysis=answer_analysis_output,
    )

    result = as_model(
        await ctx.run_node(
            question_generator_agent, node_input=question_input), QuestionGeneratorOutput)

    ctx.state["question_generator_output"] = result.model_dump()
    ctx.state["question"] = result.follow_up_question

    await toolset.close()
    print(result)
    return result


reply_workflow = Workflow(
    name="reply_workflow",
    edges=[
        ("START", answer_analysis_node),
        (answer_analysis_node, question_generator_node),
    ],
)


# ---------------------------------------------------------------------------
# Session store — created once at module load, shared across every request,
# so state actually survives between /start_interview and /agent_reply calls.
# ---------------------------------------------------------------------------

session_service = InMemorySessionService()
start_runner = Runner(app_name=APP_NAME, agent=start_workflow, session_service=session_service)
reply_runner = Runner(app_name=APP_NAME, agent=reply_workflow, session_service=session_service)

# Maps the session_id we hand back to the frontend -> the ADK (user_id) pair
# needed to look the session back up. Kept separate from ADK's own session.id
# so we're not relying on being able to set that ourselves.
SESSION_REGISTRY: Dict[str, str] = {}  # our session_id -> ADK user_id


# ---------------------------------------------------------------------------
# Entry point — FastAPI endpoints
# ---------------------------------------------------------------------------

app = FastAPI()
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)


@app.post("/start_interview")
async def start_interview(
    file: UploadFile = File(...),
    job_title: str = Form(...),
):
    """Called once, at the very start. Uploads the CV + job title, runs the
    CV analysis, and returns the greeting as the first question."""
    pdf_bytes = await file.read()
    adk_user_id = str(uuid.uuid4())

    adk_session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=adk_user_id,
        state={
            "pdf_bytes": pdf_bytes,
            "job_title": job_title,
            "tavely_token": TAVILY_API_KEY,
        },
    )

    content = types.Content(role="user", parts=[types.Part(text="Start the interview")])
    async for _ in start_runner.run_async(
        session_id=adk_session.id, user_id=adk_user_id, new_message=content
    ):
        pass

    final_session = await session_service.get_session(
        app_name=APP_NAME, user_id=adk_user_id, session_id=adk_session.id
    )

    our_session_id = str(uuid.uuid4())
    SESSION_REGISTRY[our_session_id] = adk_user_id

    return {
        "session_id": our_session_id,
        "question": final_session.state.get("question"),  # the greeting
    }


@app.post("/agent_reply")
async def agent_reply(
    session_id: str = Form(...),
    answer: str = Form(...),
    response_time_seconds: float = Form(...),
    gesture_data: str = Form(default="{}"),  # JSON string from the frontend
):
    adk_user_id = SESSION_REGISTRY.get(session_id)
    if not adk_user_id:
        return {"error": "Unknown or expired session_id."}

    try:
        gesture_data_dict = json.loads(gesture_data)
    except json.JSONDecodeError:
        gesture_data_dict = {}

    sessions = await session_service.list_sessions(app_name=APP_NAME, user_id=adk_user_id)
    adk_session = sessions.sessions[0]

    state_update_event = Event(
        author="system",
        actions=EventActions(
            state_delta={
                "answer": answer,
                "response_time_seconds": response_time_seconds,
                "gesture_data": gesture_data_dict,
            }
        ),
    )
    await session_service.append_event(adk_session, state_update_event)

    content = types.Content(role="user", parts=[types.Part(text=answer)])
    async for _ in reply_runner.run_async(
        session_id=adk_session.id, user_id=adk_user_id, new_message=content
    ):
        pass

    final_session = await session_service.get_session(
        app_name=APP_NAME, user_id=adk_user_id, session_id=adk_session.id
    )

    return {
        "answer_analysis": final_session.state.get("answer_analysis_output"),
        "next_question": final_session.state.get("question"),
    }