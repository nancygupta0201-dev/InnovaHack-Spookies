# CV Screening & AI Interview Agent

A FastAPI backend that takes a candidate's CV (PDF), analyzes it against a job
title, then conducts a multi-turn AI-driven interview — asking follow-up
questions based on how the candidate answers, factoring in response time and
webcam-derived gesture/emotion signals.

Built on Google ADK (Agent Development Kit) `Workflow`/`node` primitives, with
Gemini-backed `LlmAgent`s for CV analysis, answer analysis, and question
generation.

## How it works

1. **Upload once, at the start.** The candidate (or recruiter) uploads the
   CV as a PDF along with a `job_title`, via `POST /start_interview`.
   - The PDF text is extracted.
   - A CV-analysis agent scores the candidate against the job title and
     returns a structured `cv_analysis` (so the candidate can see any CV
     issues or gaps upfront, before the interview starts).
   - A greeting is generated as the first interview question.
2. **Then it's a conversation.** From there, every subsequent turn is a call
   to `POST /agent_reply`:
   - The frontend sends the candidate's `answer` (transcribed text),
     `response_time_seconds`, and optionally `gesture_data` (webcam-derived
     signals — see [Gesture Capture](#gesture-capture) below).
   - An answer-analysis agent scores the answer (quality, confidence,
     fluency, issues found), using the Tavily search tool to fact-check
     claims and a gesture-to-emotion tool to read confidence/engagement.
   - A question-generation agent reads that analysis and produces the next
     follow-up question — either probing a weak point or moving to a new
     topic from the CV.
   - The response returns `answer_analysis` and `next_question`.
   - Repeat: the frontend shows `next_question`, collects the next answer,
     and calls `/agent_reply` again. There's no fixed number of turns —
     the loop continues until the frontend/interviewer decides to stop.

```
 candidate uploads CV + job_title
              │
              ▼
     POST /start_interview
              │
   ┌──────────┴──────────┐
   │  cv_analysis (shown  │
   │  to candidate)       │
   │  + first question    │
   │  (greeting)          │
   └──────────┬───────────┘
              │
              ▼
   candidate answers ──► POST /agent_reply ──► answer_analysis + next_question
              ▲                                          │
              └──────────────────────────────────────────┘
                        (repeat every turn)
```

## Setup

```bash
pip install -r requirements.txt
```

Create a `.env` file in the same directory as `agent.py`:

```
ANTHROPIC_API_KEY=your_key_here
TAVILY_API_KEY=your_key_here
```

Run the server:

```bash
uvicorn agent:app --reload
```

API docs / Swagger UI: `http://127.0.0.1:8000/docs`

## Endpoints

### `POST /start_interview`

Multipart form data:
| Field | Type | Description |
|---|---|---|
| `file` | file (PDF) | The candidate's CV |
| `job_title` | string | Job title/description to screen against |

Response:
```json
{
  "session_id": "uuid",
  "question": "Good morning, Jane! Welcome, let's get started with your interview.",
  "cv_analysis": { "name": "...", "summary": "...", "fit_score": 0, "...": "..." }
}
```

### `POST /agent_reply`

Multipart form data:
| Field | Type | Description |
|---|---|---|
| `session_id` | string | From `/start_interview` |
| `answer` | string | Candidate's transcribed answer |
| `response_time_seconds` | float | Time taken to respond |
| `gesture_data` | string (JSON) | Optional. Webcam-derived signals — see below |

Response:
```json
{
  "answer_analysis": {
    "summary": "...",
    "issues": ["..."],
    "score": 0,
    "possible_fix": null,
    "confidence_score": 0,
    "fluency_score": 0
  },
  "next_question": "..."
}
```

## Gesture Capture

`gesture_data` is a JSON string with fields matching the `GestureData` model
(`gesture_types.py`):

```json
{"eye_contact_ratio": 0.72, "smile_intensity": 0.35, "fidget_count": 4, "posture_score": 0.81, "blink_rate": 16.5}
```

A working browser-side capture snippet (MediaPipe Face Landmarker, no server
round-trip) is provided in `gesture_capture.html` — start it when a question
is shown, stop it when the answer is submitted, and send the result as the
`gesture_data` form field. If omitted or empty, the answer-analysis agent
still scores the answer, just with a note that confidence is based on
limited signal.

## Project structure

| File | Purpose |
|---|---|
| `agent.py` | FastAPI app, ADK workflow nodes, session handling |
| `cv_analysis_agent.py` | CV → `Candidate` scoring agent |
| `analysis_agent.py` | Answer-quality/confidence/fluency scoring agent |
| `question_generation_agent.py` | Follow-up question generator agent |
| `gesture_types.py` | Shared `GestureData` model |
| `tools/gesture_analysis_agent.py` | Gesture → emotion/engagement tool |
| `gesture_capture.html` | Example frontend webcam capture snippet |

## Known limitations

- Session storage is `InMemorySessionService` — everything resets on
  restart. Fine for a demo/hackathon; swap for a persistent session service
  before any real deployment.
- `SESSION_REGISTRY` (mapping our `session_id` → ADK `user_id`) is also
  in-memory and assumes exactly one active ADK session per user.
- Gesture-derived scores (`eye_contact_ratio`, `posture_score`,
  `fidget_count`) are heuristic approximations from face-landmark movement,
  not clinically validated signals.
- CORS is wide open (`allow_origins=["*"]`) for development — restrict to
  your actual frontend domain before deploying.
