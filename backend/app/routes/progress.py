
from fastapi import APIRouter, HTTPException
from pymongo.errors import PyMongoError

from app.models.progress import (
    OverallProgress,
    SubjectProgress,
    TopicProgress,
    QuizHistoryItem,
)

from app.services.progress_tracker import (
    get_overall_progress,
    get_subject_progress,
    get_topic_progress,
    get_quiz_history,
)


router = APIRouter(
    prefix="/api/progress",
    tags=["Student Progress Tracking"],
)


@router.get("/{student_email}", response_model=OverallProgress)
async def overall_progress(student_email: str):

    try:
        return await get_overall_progress(student_email.strip().lower())

    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve student progress.",
        ) from exc


@router.get("/{student_email}/subjects", response_model=list[SubjectProgress])
async def subject_progress(student_email: str):

    try:
        return await get_subject_progress(student_email.strip().lower())

    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve subject progress.",
        ) from exc


@router.get("/{student_email}/topics", response_model=list[TopicProgress])
async def topic_progress(student_email: str):

    try:
        return await get_topic_progress(student_email.strip().lower())

    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve topic progress.",
        ) from exc


@router.get(
    "/{student_email}/quiz-history",
    response_model=list[QuizHistoryItem],
)
async def quiz_history(student_email: str):

    try:
        return await get_quiz_history(student_email.strip().lower())

    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve quiz history.",
        ) from exc
