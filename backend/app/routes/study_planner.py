
from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from pymongo.errors import PyMongoError

from app.models.study_plan import StudyPlan
from app.models.study_task import (
    PlannerTaskCreate,
    PlannerTaskUpdate,
    PlannerTaskResponse,
)

from app.services.study_planner import generate_study_plan

from app.services.study_task_service import (
    create_study_task,
    get_study_tasks,
    update_study_task,
    delete_study_task,
)


router = APIRouter(
    prefix="/api/planner",
    tags=["Personalized Study Planner"],
)


# --------------------------------------------------
# AI-GENERATED STUDY PLAN
# --------------------------------------------------

@router.get(
    "/{student_email}",
    response_model=StudyPlan,
)
async def get_study_plan(
    student_email: str,
    study_days: int = Query(default=7, ge=1, le=30),
    minutes_per_day: int = Query(default=60, ge=15, le=300),
):
    try:
        return await generate_study_plan(
            email=student_email.strip().lower(),
            study_days=study_days,
            minutes_per_day=minutes_per_day,
        )

    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not generate the study plan. Check database connectivity.",
        ) from exc


# --------------------------------------------------
# CREATE A PERSONAL STUDY TASK
# --------------------------------------------------

@router.post(
    "/{student_email}/tasks",
    response_model=PlannerTaskResponse,
    status_code=201,
)
async def create_task(
    student_email: str,
    task: PlannerTaskCreate,
):
    try:
        return await create_study_task(
            email=student_email,
            task_data=task.model_dump(),
        )

    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not save the study task.",
        ) from exc


# --------------------------------------------------
# GET ALL PERSONAL STUDY TASKS
# --------------------------------------------------

@router.get(
    "/{student_email}/tasks",
    response_model=list[PlannerTaskResponse],
)
async def list_tasks(student_email: str):

    try:
        return await get_study_tasks(student_email)

    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve study tasks.",
        ) from exc


# --------------------------------------------------
# UPDATE A STUDY TASK
# --------------------------------------------------

@router.patch(
    "/{student_email}/tasks/{task_id}",
    response_model=PlannerTaskResponse,
)
async def update_task(
    student_email: str,
    task_id: str,
    task: PlannerTaskUpdate,
):
    if not ObjectId.is_valid(task_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid task ID.",
        )

    update_data = task.model_dump(
        exclude_unset=True,
    )

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No task fields provided for update.",
        )

    try:
        updated_task = await update_study_task(
            email=student_email,
            task_id=ObjectId(task_id),
            update_data=update_data,
        )

        if not updated_task:
            raise HTTPException(
                status_code=404,
                detail="Study task not found.",
            )

        return updated_task

    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not update the study task.",
        ) from exc


# --------------------------------------------------
# DELETE A STUDY TASK
# --------------------------------------------------

@router.delete(
    "/{student_email}/tasks/{task_id}",
)
async def remove_task(
    student_email: str,
    task_id: str,
):
    if not ObjectId.is_valid(task_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid task ID.",
        )

    try:
        deleted = await delete_study_task(
            email=student_email,
            task_id=ObjectId(task_id),
        )

        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Study task not found.",
            )

        return {
            "message": "Study task deleted successfully."
        }

    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not delete the study task.",
        ) from exc
