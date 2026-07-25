import os
from typing import List, Optional, Dict, Any

from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters
from pydantic import BaseModel, Field

from config import FAST_MODEL, SMART_MODEL
from gesture_types import GestureData
# NOTE: plug in your actual gesture-to-emotion tool here. Following the same
# pattern as your other tool modules (tools/github_agent.py, tools/vercel_agent.py) —
# this assumes it's exposed as an ADK-compatible tool you can drop straight
# into `tools=[...]` below.
from tools.gesture_analysis_agent import gesture_emotion_tool


class AnswerAnalysisInput(BaseModel):
    cv_summary: str = Field(description="Summary of the candidate's CV/background")
    question: str = Field(description="The interview question that was asked")
    answer: str = Field(description="The candidate's transcribed answer")
    gesture_data: GestureData = Field(default_factory=GestureData,
        description="Raw gesture/expression signals captured while the candidate answered"
    )
    response_time_seconds: float = Field(
        description="Time taken by the candidate to respond, in seconds"
    )


class AnswerAnalysisOutput(BaseModel):
    summary: str = Field(description="Overall summary of how the candidate answered")
    issues: List[str] = Field(
        default_factory=list, description="Problems found in the answer (gaps, inaccuracies, vagueness, etc.)"
    )
    score: int = Field(description="Score of the answer's quality, 1-10")
    possible_fix: Optional[str] = Field(
        default=None, description="How the candidate could have improved the answer"
    )
    confidence_score: int = Field(
        description="Candidate's apparent confidence while answering, 1-10, informed by gesture data and response time"
    )
    fluency_score: int = Field(description="Fluency/articulation of the answer, 1-10")


async def create_answer_analysis_agent(tavely_token: str):
    tavely_toolset = McpToolset(
                connection_params=StdioConnectionParams(
                    server_params=StdioServerParameters(
                        command="npx",
                        args=["-y", "tavily-mcp"],
                        env={"TAVILY_API_KEY": tavely_token},
                    ),
                    timeout=60,  # increase from default if npx is slow to install/start
                )
            )

    answer_analysis_agent = LlmAgent(
        model=SMART_MODEL,
        name="answer_analysis_agent",
        instruction="""
            You are an Interview Answer Analysis Agent.

            Input contains:
            - cv_summary: the candidate's background
            - question: the interview question asked
            - answer: the candidate's transcribed answer
            - gesture_data: signals about the candidate's expressions/body language
              while answering (use the gesture-to-emotion tool to interpret these
              into an emotional/confidence read)
            - response_time_seconds: how long the candidate took to respond

            Tasks:

            1. Read the question and answer together with cv_summary to judge
               whether the answer is accurate, relevant, and consistent with the
               candidate's stated background.
            2. Use the Tavily search tool if you need to verify a factual claim
               the candidate made (e.g. a technology, company, or concept they
               referenced) that you're not confident about.
            3. Use the gesture-to-emotion tool on gesture_data to get a read on
               the candidate's emotional state while answering, and factor that
               into confidence_score.
            4. Factor response_time_seconds into confidence_score — very long
               pauses before answering can indicate uncertainty; near-instant
               answers to complex questions can indicate rehearsed or evasive
               responses. Use judgment, not a fixed cutoff.
            5. Identify concrete issues with the answer (vague, incomplete,
               factually wrong, off-topic, contradicts CV, etc.).
            6. Score the answer's quality 1-10.
            7. If issues were found, suggest a possible_fix describing what a
               stronger answer would have included.
            8. Score fluency 1-10 based on clarity and structure of the answer
               text itself.

            Rules:
            - Do not fabricate claims about the candidate beyond what's in
              cv_summary, the answer, and gesture_data.
            - If gesture_data or response_time_seconds is missing or empty,
              still produce best-effort summary/issues/score/possible_fix/fluency,
              and note in issues that confidence_score is based on limited signal.

            Return only data matching AnswerAnalysisOutput.
            """,
        input_schema=AnswerAnalysisInput,
        output_schema=AnswerAnalysisOutput,
        tools=[tavely_toolset, gesture_emotion_tool],
    )

    return tavely_toolset, answer_analysis_agent