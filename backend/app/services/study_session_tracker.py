
from datetime import datetime, timezone
from uuid import uuid4

from app.database.mongodb import get_database
from pymongo import ReturnDocument


async def start_study_session(
    email: str,
    subject: str,
    topic: str,
    activity: str,
    planned_minutes: int,
) -> dict:

    db = get_database()

    session = {
        "session_id": str(uuid4()),
        "email": email.strip().lower(),
        "subject": subject.strip(),
        "topic": topic.strip(),
        "activity": activity.strip(),
        "planned_minutes": planned_minutes,
        "actual_minutes": None,
        "status": "in_progress",
        "started_at": datetime.now(timezone.utc),
        "completed_at": None,
        "notes": None,
    }

    await db.study_sessions.insert_one(session)

    return session


async def complete_study_session(
    email: str,
    session_id: str,
    actual_minutes: int,
    notes: str | None = None,
) -> dict | None:

    db = get_database()

    updated_session = await db.study_sessions.find_one_and_update(
        {
            "session_id": session_id,
            "email": email.strip().lower(),
            "status": "in_progress",
        },
        {
            "$set": {
                "actual_minutes": actual_minutes,
                "status": "completed",
                "completed_at": datetime.now(timezone.utc),
                "notes": notes.strip() if notes else None,
            }
        },
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0},
    )

    return updated_session


async def get_study_session_history(
    email: str,
    limit: int = 50,
) -> list[dict]:

    db = get_database()

    cursor = (
        db.study_sessions.find(
            {"email": email.strip().lower()},
            {"_id": 0},
        )
        .sort("started_at", -1)
        .limit(limit)
    )

    sessions = []

    async for session in cursor:
        sessions.append(session)

    return sessions


async def get_study_session_summary(email: str) -> dict:

    db = get_database()

    cursor = db.study_sessions.find(
        {"email": email.strip().lower()},
        {"_id": 0},
    )

    sessions = []

    async for session in cursor:
        sessions.append(session)

    completed = [
        session for session in sessions
        if session.get("status") == "completed"
    ]

    in_progress = [
        session for session in sessions
        if session.get("status") == "in_progress"
    ]

    total_planned = sum(
        session.get("planned_minutes", 0)
        for session in completed
    )

    total_actual = sum(
        session.get("actual_minutes") or 0
        for session in completed
    )

    realization_percentage = (
        round((total_actual / total_planned) * 100, 2)
        if total_planned > 0 else 0.0
    )

    return {
        "email": email.strip().lower(),
        "total_sessions": len(sessions),
        "completed_sessions": len(completed),
        "in_progress_sessions": len(in_progress),
        "total_planned_minutes": total_planned,
        "total_actual_minutes": total_actual,
        "time_difference_minutes": total_actual - total_planned,
        "time_realization_percentage": realization_percentage,
    }
