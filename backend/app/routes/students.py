
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, status, Request

from app.database.mongodb import get_database
from app.models.student import (
    StudentProfileCreate,
    StudentProfileUpdate,
    StudentProfileResponse,
)

router = APIRouter(
    prefix="/api/students",
    tags=["Students"],
)


def serialize_student(student: dict) -> dict:
    return {
        "id": str(student["_id"]),
        "name": student["name"],
        "email": student["email"],
        "subjects": student.get("subjects", []),
        "learning_goals": student.get("learning_goals", []),
        "knowledge_level": student.get("knowledge_level", "beginner"),
        "learning_preferences": student.get("learning_preferences", []),
        "strengths": student.get("strengths", []),
        "weak_topics": student.get("weak_topics", []),
        "misconceptions": student.get("misconceptions", []),
        "created_at": student["created_at"],
        "updated_at": student["updated_at"],
    }


@router.post(
    "",
    response_model=StudentProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_student(profile: StudentProfileCreate, http_request: Request):
    db = get_database()
    authenticated_email = http_request.state.current_user["email"].lower()
    if str(profile.email).lower() != authenticated_email:
        raise HTTPException(status_code=403, detail="You can only create your own profile.")

    existing = await db.users.find_one({"email": authenticated_email})

    if existing:
        raise HTTPException(
            status_code=409,
            detail="A student with this email already exists.",
        )

    now = datetime.now(timezone.utc)

    student_data = profile.model_dump()
    student_data["email"] = authenticated_email
    student_data["created_at"] = now
    student_data["updated_at"] = now

    result = await db.users.insert_one(student_data)

    student_data["_id"] = result.inserted_id

    return serialize_student(student_data)


@router.get(
    "/{email}",
    response_model=StudentProfileResponse,
)
async def get_student(email: str):
    db = get_database()

    student = await db.users.find_one({"email": email})

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found.",
        )

    return serialize_student(student)


@router.patch(
    "/{email}",
    response_model=StudentProfileResponse,
)
async def update_student(
    email: str,
    updates: StudentProfileUpdate,
):
    db = get_database()

    update_data = updates.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No profile fields were provided.",
        )

    update_data["updated_at"] = datetime.now(timezone.utc)

    result = await db.users.update_one(
        {"email": email},
        {"$set": update_data},
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found.",
        )

    student = await db.users.find_one({"email": email})

    return serialize_student(student)
