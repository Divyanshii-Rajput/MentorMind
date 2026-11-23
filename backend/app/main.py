from contextlib import asynccontextmanager

import logging
import os

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import PyMongoError

from app.routes.auth import router as auth_router
from app.security import enforce_resource_owner

from app.routes.ai import router as ai_router
from app.routes.documents import router as documents_router
from app.routes.rag import router as rag_router
from app.routes.socratic import router as socratic_router
from app.routes.evaluation import router as evaluation_router
from app.routes.students import router as students_router
from app.routes.memory import router as memory_router
from app.routes.adaptive import router as adaptive_router
from app.routes.quizzes import router as quizzes_router
from app.routes.progress import router as progress_router
from app.routes.analytics import router as analytics_router
from app.routes.study_planner import router as study_planner_router
from app.routes.study_sessions import router as study_sessions_router

from app.database.mongodb import (
    connect_to_mongodb,
    close_mongodb_connection,
    client,
)



@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await connect_to_mongodb()
    except PyMongoError as error:
        logging.getLogger("mentormind").warning("MongoDB unavailable during startup (%s).", type(error).__name__)

    try:
        yield
    finally:
        await close_mongodb_connection()


app = FastAPI(
    title="MentorMind API",
    description="Backend API for the MentorMind AI tutoring platform.",
    version="0.4.0",
    lifespan=lifespan,
)

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Authentication endpoints remain public. All application endpoints require a valid
# bearer token and enforce ownership for student-specific URL resources.
app.include_router(auth_router)

protected_routers = [
    ai_router, documents_router, rag_router, socratic_router,
    evaluation_router, students_router, memory_router, adaptive_router,
    quizzes_router, progress_router, analytics_router,
    study_planner_router, study_sessions_router,
]
for protected_router in protected_routers:
    app.include_router(
        protected_router,
        dependencies=[Depends(enforce_resource_owner)],
    )

logger = logging.getLogger("mentormind.api")


@app.exception_handler(PyMongoError)
async def database_exception_handler(request: Request, exc: PyMongoError):
    logger.exception("Database operation failed on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=503,
        content={"detail": "The database service is temporarily unavailable."},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled API error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred."},
    )


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    # Do not echo submitted values (which may contain passwords or other private data).
    errors = [
        {
            "location": list(error.get("loc", ())),
            "message": error.get("msg", "Invalid value."),
            "type": error.get("type", "value_error"),
        }
        for error in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"detail": errors})


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "MentorMind API"}


@app.get("/health/database")
async def database_health():
    try:
        await client.admin.command("ping")
        return {
            "status": "success",
            "database": "MongoDB",
            "message": "Database connection is working",
        }
    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="MongoDB connection unavailable",
        )
