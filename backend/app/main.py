from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="MentorMind API",
    description="Backend API for the MentorMind AI tutoring platform.",
    version="0.1.0",
)


# Allow the local React development server to communicate with FastAPI.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """Return the current backend health status."""
    return {
        "status": "healthy",
        "service": "MentorMind API",
    }