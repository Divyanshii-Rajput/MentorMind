
import os
import logging

from dotenv import load_dotenv
from pymongo import AsyncMongoClient
from pymongo.errors import PyMongoError

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "mentormind")

if not MONGODB_URI:
    raise ValueError("MONGODB_URI is missing from the environment variables")

client = AsyncMongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=5000,
)

database = client[MONGODB_DB_NAME]


async def connect_to_mongodb():
    """Connect to MongoDB and initialize application collections."""
    try:
        await client.admin.command("ping")

        logging.getLogger("mentormind.database").info(
            "MongoDB connected successfully."
        )

        collections = [
            "users",
            "conversations",
            "messages",
            "quizzes",
            "learning_progress",
            "student_memory",
            "study_sessions",
            "study_tasks",
        ]

        existing_collections = await database.list_collection_names()

        for collection_name in collections:
            if collection_name not in existing_collections:
                await database.create_collection(collection_name)

        await database.users.create_index(
            "email",
            unique=True,
        )

        # One adaptive progress record per student, subject, and topic.
        await database.learning_progress.create_index(
            [("email", 1), ("subject", 1), ("topic", 1)],
            unique=True,
        )

        await database.study_sessions.create_index(
            [("email", 1), ("started_at", -1)]
        )

        await database.study_sessions.create_index(
            "session_id",
            unique=True,
        )

        # Efficient retrieval of a student's study tasks.
        await database.study_tasks.create_index(
            [("email", 1), ("created_at", -1)]
        )

        # Efficient sorting and filtering by due date.
        await database.study_tasks.create_index(
            [("email", 1), ("dueDate", 1)]
        )

        logging.getLogger("mentormind.database").info(
            "MongoDB collections and indexes initialized successfully."
        )

    except PyMongoError:
        logging.getLogger("mentormind.database").exception(
            "MongoDB connection failed"
        )
        raise


async def close_mongodb_connection():
    await client.close()

    logging.getLogger("mentormind.database").info(
        "MongoDB connection closed."
    )


def get_database():
    return database
