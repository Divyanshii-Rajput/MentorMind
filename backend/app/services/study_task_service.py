
from datetime import datetime, timezone

from bson import ObjectId
from pymongo import ReturnDocument

from app.database.mongodb import get_database


def serialize_task(task: dict) -> dict:
    """Convert a MongoDB task document into an API-friendly dictionary."""

    return {
        "id": str(task["_id"]),
        "title": task["title"],
        "subject": task["subject"],
        "dueDate": task["dueDate"],
        "priority": task["priority"],
        "completed": task["completed"],
        "created_at": task["created_at"],
        "updated_at": task["updated_at"],
    }


async def create_study_task(email: str, task_data: dict):
    db = get_database()

    now = datetime.now(timezone.utc)

    document = {
        "email": email.strip().lower(),
        "title": task_data["title"].strip(),
        "subject": task_data["subject"].strip(),
        "dueDate": task_data["dueDate"].isoformat(),
        "priority": task_data["priority"],
        "completed": False,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.study_tasks.insert_one(document)

    document["_id"] = result.inserted_id

    return serialize_task(document)


async def get_study_tasks(email: str):
    db = get_database()

    cursor = (
        db.study_tasks
        .find({"email": email.strip().lower()})
        .sort([("dueDate", 1), ("created_at", -1)])
    )

    tasks = await cursor.to_list(length=500)

    return [serialize_task(task) for task in tasks]


async def update_study_task(
    email: str,
    task_id: ObjectId,
    update_data: dict,
):
    db = get_database()

    if "title" in update_data:
        update_data["title"] = update_data["title"].strip()

    if "subject" in update_data:
        update_data["subject"] = update_data["subject"].strip()

    if "dueDate" in update_data:
        update_data["dueDate"] = update_data["dueDate"].isoformat()

    update_data["updated_at"] = datetime.now(timezone.utc)

    task = await db.study_tasks.find_one_and_update(
        {
            "_id": task_id,
            "email": email.strip().lower(),
        },
        {"$set": update_data},
        return_document=ReturnDocument.AFTER,
    )

    if not task:
        return None

    return serialize_task(task)


async def delete_study_task(email: str, task_id: ObjectId):
    db = get_database()

    result = await db.study_tasks.delete_one(
        {
            "_id": task_id,
            "email": email.strip().lower(),
        }
    )

    return result.deleted_count > 0
