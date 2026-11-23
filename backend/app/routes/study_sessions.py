
from fastapi import APIRouter, HTTPException, Query
from pymongo.errors import PyMongoError

from app.models.study_session import (
    StartStudySessionRequest,
    CompleteStudySessionRequest,
    StudySessionResponse,
    StudySessionSummary,
)

from app.services.study_session_tracker import (
    start_study_session,
    complete_study_session,
    get_study_session_history,
    get_study_session_summary,
)


router = APIRouter(
    prefix="/api/study-sessions",
    tags=["Study Session Tracking"],
)


@router.post(
    "/{student_email}/start",
    response_model=StudySessionResponse,
)
async def start_session(
    student_email: str,
    request: StartStudySessionRequest,
):
    try:
        return await start_study_session(
            email=student_email,
            subject=request.subject,
            topic=request.topic,
            activity=request.activity,
            planned_minutes=request.planned_minutes,
        )

    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not start the study session.",
        ) from exc


@router.post(
    "/{student_email}/{session_id}/complete",
    response_model=StudySessionResponse,
)
async def complete_session(
    student_email: str,
    session_id: str,
    request: CompleteStudySessionRequest,
):
    try:
        session = await complete_study_session(
            email=student_email,
            session_id=session_id,
            actual_minutes=request.actual_minutes,
            notes=request.notes,
        )

        if session is None:
            raise HTTPException(
                status_code=404,
                detail=(
                    "Session not found, already completed, "
                    "or does not belong to this student."
                ),
            )

        return session

    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not complete the study session.",
        ) from exc


@router.get(
    "/{student_email}/history",
    response_model=list[StudySessionResponse],
)
async def session_history(
    student_email: str,
    limit: int = Query(default=50, ge=1, le=100),
):
    try:
        return await get_study_session_history(
            email=student_email,
            limit=limit,
        )

    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve study session history.",
        ) from exc


@router.get(
    "/{student_email}/summary",
    response_model=StudySessionSummary,
)
async def session_summary(student_email: str):
    try:
        return await get_study_session_summary(
            email=student_email
        )

    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not calculate study session summary.",
        ) from exc
