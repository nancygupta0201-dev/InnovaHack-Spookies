# agent.py
from pydantic import BaseModel, Field
from google.adk.agents import LlmAgent
#from google.adk.models.lite_llm import LiteLlm

from config import SMART_MODEL
class CVAnalysisInput(BaseModel):
    cv_text: str = Field(description="Raw text extracted from the candidate's CV")
    job_description: str | None = Field(
        default=None, description="Optional JD to score fit against"
    )


class Candidate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    total_years_experience: float | None = None
    skills: list[str] = Field(default_factory=list)
    education: list[str] = Field(default_factory=list)
    work_history: list[str] = Field(default_factory=list)
    summary: str = Field(description="2-3 sentence recruiter-facing summary")
    fit_score: int | None = Field(
        default=None, description="1-10 fit score if a job description was provided"
    )
    red_flags: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------

cv_agent = LlmAgent(
    name="cv_screening_agent",
    model=SMART_MODEL,
    description="Extracts structured candidate data from CV/resume text.",
    instruction=(
        "You are a recruiting assistant. You will receive raw text extracted "
        "from a candidate's CV/resume, and optionally a job description. Parse "
        "the CV carefully and extract the requested fields. If a job "
        "description is provided, score fit_score 1-10 and note any gaps as "
        "red_flags. If a field isn't present in the CV, leave it null or "
        "empty rather than guessing. Do not fabricate details."
    ),
    output_schema=Candidate,
    output_key="candidate_result",
)
