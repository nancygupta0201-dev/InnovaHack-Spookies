from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow requests from your React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze-pdf")
async def analyze_pdf(file: UploadFile = File(...)):
    # Sample dummy response — replace with real agent logic later
    return {
        "name": "John Doe",
        "experience": "3 years",
        "skills": ["React", "Node.js", "Python", "SQL"],
        "strengths": [
            "Strong frontend experience",
            "Good problem-solving track record",
            "Multiple internship projects",
        ],
        "suggestions": [
            "Add more quantifiable achievements",
            "Expand on leadership experience",
            "Include open source contributions",
        ],
    }