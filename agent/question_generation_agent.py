import os
from typing import List, Optional

from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters
from pydantic import BaseModel, Field

from config import SMART_MODEL
from analysis_agent import AnswerAnalysisOutput


class QuestionGeneratorInput(BaseModel):
    cv_summary: str = Field(description="Summary of the candidate's CV/background")
    previous_question: str = Field(description="The previous interview question asked")
    previous_answer: str = Field(description="The candidate's previous answer")
    answer_analysis: AnswerAnalysisOutput = Field(
        description="Analysis of the previous answer (summary, issues, score, possible_fix, confidence_score, fluency_score)"
    )


class QuestionGeneratorOutput(BaseModel):
    follow_up_question: str = Field(description="The next interview question to ask the candidate")
    topic: str = Field(description="Topic/skill area the follow-up question targets")
    reasoning: str = Field(
        description="Why this question was chosen, tied to what the answer analysis found"
    )


async def create_question_generator_agent(tavely_token: str):
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

    question_generator_agent = LlmAgent(
        model=SMART_MODEL,
        name="question_generator_agent",
        instruction="""
            You are an Interview Question Generator Agent.

            Input contains:
            - cv_summary: the candidate's background
            - previous_question: the question that was just asked
            - previous_answer: the candidate's answer to it
            - answer_analysis: a structured analysis of that answer (summary,
              issues, score, possible_fix, confidence_score, fluency_score)

            Tasks:

            1. Read answer_analysis to see what was weak, vague, unverified, or
               worth digging into further in the previous answer.
            2. Decide whether the follow-up should:
               - Probe deeper into an issue found in the previous answer, OR
               - Ask the candidate to clarify or defend a claim they made, OR
               - Move to a new topic from cv_summary if the previous answer
                 was strong and fully covered its topic.
            3. If the candidate mentioned a specific technology, company,
               methodology, or concept you're not confident about, use the
               Tavily search tool to look it up before writing a question
               about it — so the question is accurate and well-informed.
            4. Write exactly one clear, natural-sounding follow-up question.
            5. State which topic/skill area it targets.
            6. Briefly explain your reasoning, tied to the specific issues or
               strengths found in answer_analysis.

            Rules:
            - Ask only one question at a time.
            - Do not repeat previous_question or ask something already fully
              answered.
            - Keep the question conversational, the way a human interviewer
              would ask it — not a checklist item.
            - Do not fabricate facts about the candidate; base the question
              only on cv_summary, previous_answer, and answer_analysis.

            Return only data matching QuestionGeneratorOutput.
            """,
        input_schema=QuestionGeneratorInput,
        output_schema=QuestionGeneratorOutput,
        tools=[tavely_toolset],
    )

    return tavely_toolset, question_generator_agent