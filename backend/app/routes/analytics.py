
from fastapi import APIRouter, HTTPException
from pymongo.errors import PyMongoError

from app.models.analytics import (
    AnalyticsOverview,
    TopicInsight,
    LearningRecommendation,
    PerformanceTrendItem,
)

from app.services.learning_analytics import (
    get_analytics_overview,
    get_strengths_and_weaknesses,
    get_learning_recommendations,
    get_performance_trend,
)


router = APIRouter(
    prefix="/api/analytics",
    tags=["Learning Analytics"],
)


@router.get(
    "/{student_email}/overview",
    response_model=AnalyticsOverview,
)
async def analytics_overview(student_email: str):

    try:
        return await get_analytics_overview(
            student_email.strip().lower()
        )

    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve learning analytics.",
        ) from exc


@router.get(
    "/{student_email}/strengths-weaknesses",
    response_model=list[TopicInsight],
)
async def strengths_weaknesses(student_email: str):

    try:
        return await get_strengths_and_weaknesses(
            student_email.strip().lower()
        )

    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve topic performance.",
        ) from exc


@router.get(
    "/{student_email}/recommendations",
    response_model=list[LearningRecommendation],
)
async def learning_recommendations(student_email: str):

    try:
        return await get_learning_recommendations(
            student_email.strip().lower()
        )

    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not generate learning recommendations.",
        ) from exc


@router.get(
    "/{student_email}/performance-trend",
    response_model=list[PerformanceTrendItem],
)
async def performance_trend(student_email: str):

    try:
        return await get_performance_trend(
            student_email.strip().lower()
        )

    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve performance history.",
        ) from exc
