from typing import Dict, Any, Optional,List

from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from pydantic import BaseModel, Field

from config import FAST_MODEL

from gesture_types import GestureData

class GestureEmotionInput(BaseModel):
    gesture_data: GestureData = Field(
        description="Gesture/expression signals captured while the candidate answered"
    )


class EmotionScore(BaseModel):
    emotion: str = Field(description="Emotion category, e.g. confident, nervous, neutral, distracted, defensive")
    score: float = Field(description="Confidence score 0-1 for this emotion")


class GestureEmotionOutput(BaseModel):
    dominant_emotion: str = Field(
        description="Primary emotional read, e.g. confident, nervous, neutral, distracted, defensive"
    )
    emotion_breakdown: List[EmotionScore] = Field(
        default_factory=list,
        description="Confidence score (0-1) per emotion category considered",
    )
    engagement_level: str = Field(
        description="Overall engagement read: low, moderate, or high"
    )
    notes: Optional[str] = Field(
        default=None, description="Any notable gesture patterns worth flagging (e.g. avoided eye contact, fidgeting)"
    )

def create_gesture_emotion_agent() -> LlmAgent:
    gesture_emotion_agent = LlmAgent(
        model=FAST_MODEL,
        name="gesture_emotion_agent",
        instruction="""
            You are a Gesture-to-Emotion Analysis Agent.

            Input contains gesture_data: raw gesture/expression signals captured
            while a candidate was answering an interview question.

            Tasks:

            1. Interpret the gesture_data fields to determine the candidate's
               most likely emotional state while answering.
            2. Produce a breakdown of confidence scores (0-1) across relevant
               emotion categories present in the signals (e.g. confident,
               nervous, neutral, distracted, defensive) — only include
               categories you have signal for.
            3. Assess overall engagement level (low, moderate, high) based on
               things like eye contact, posture, and responsiveness in the data.
            4. Note any specific patterns worth flagging to a human reviewer
               (e.g. sustained lack of eye contact, excessive fidgeting,
               closed-off posture).

            Rules:
            - Base your read strictly on the fields present in gesture_data.
              Do not invent signals that aren't there.
            - If gesture_data is empty or missing key fields, set
              dominant_emotion to "unknown", leave emotion_breakdown empty,
              set engagement_level to "unknown", and explain the gap in notes.
            - Do not make claims about the candidate's competence or answer
              quality — that's handled by a separate agent. Stick to emotion
              and engagement only.

            Return only data matching GestureEmotionOutput.
            """,
        input_schema=GestureEmotionInput,
        output_schema=GestureEmotionOutput,
    )
    return gesture_emotion_agent


# Exposed as a ready-to-use tool, matching the import used in
# answer_analysis_agent.py: `from tools.gesture_emotion_agent import gesture_emotion_tool`
gesture_emotion_tool = AgentTool(agent=create_gesture_emotion_agent())