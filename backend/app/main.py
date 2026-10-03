from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.ai import router as ai_router
from app.routes.documents import router as documents_router


app = FastAPI(
    title="MentorMind API",
    description="Backend API for the MentorMind AI tutoring platform.",
    version="0.3.0",
)


# Allow requests from the React development server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API routes.
app.include_router(ai_router)
app.include_router(documents_router)


@app.get("/api/health")
async def health_check():
    """Return the current backend health status."""

    return {
        "status": "healthy",
        "service": "MentorMind API",
    }