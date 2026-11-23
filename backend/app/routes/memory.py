
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query

from app.database.mongodb import get_database
from app.models.memory import (
    StudentMemoryCreate,
    StudentMemoryResponse,
)

router = APIRouter(
    prefix="/api/students",
    tags=["Student Memory"],
)


@router.post("/{email}/memory", response_model=StudentMemoryResponse)
async def add_student_memory(
    email: str,
    memory: StudentMemoryCreate,
):
    db = get_database()

    student = await db.users.find_one({"email": email})

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found.",
        )

    if str(memory.email) != email:
        raise HTTPException(
            status_code=400,
            detail="Email in the URL and request body must match.",
        )

    memory_data = memory.model_dump()
    memory_data["email"] = email
    memory_data["created_at"] = datetime.now(timezone.utc)

    result = await db.student_memory.insert_one(memory_data)
    memory_data["_id"] = result.inserted_id

    return {
        "id": str(memory_data["_id"]),
        **{
            key: value
            for key, value in memory_data.items()
            if key != "_id"
        },
    }


@router.get("/{email}/memory", response_model=list[StudentMemoryResponse])
async def get_student_memories(
    email: str,
    subject: str | None = Query(default=None),
):
    db = get_database()

    student = await db.users.find_one({"email": email})

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found.",
        )

    query = {"email": email}

    if subject:
        query["subject"] = subject

    cursor = db.student_memory.find(query).sort("created_at", -1)

    memories = []

    async for memory in cursor:
        memories.append({
            "id": str(memory["_id"]),
            "email": memory["email"],
            "memory_type": memory["memory_type"],
            "subject": memory["subject"],
            "topic": memory["topic"],
            "content": memory["content"],
            "confidence": memory["confidence"],
            "created_at": memory["created_at"],
        })

    return memories
