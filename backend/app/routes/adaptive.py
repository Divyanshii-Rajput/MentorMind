from fastapi import APIRouter, HTTPException, Query

from app.models.adaptive import AdaptiveProgressResponse
from app.services.adaptive_difficulty import get_student_topic_progress

router = APIRouter(
    prefix="/api/adaptive",
    tags=["Adaptive Difficulty"],
)


@router.get(
    "/progress/{email}",
    response_model=AdaptiveProgressResponse,
)
async def read_topic_progress(
    email: str,
    subject: str = Query(min_length=1, max_length=100),
    topic: str = Query(min_length=1, max_length=150),
):
    progress = await get_student_topic_progress(email, subject, topic)

    if progress is None:
        raise HTTPException(
            status_code=404,
            detail="No adaptive progress found for this student and topic.",
        )

    return progress
