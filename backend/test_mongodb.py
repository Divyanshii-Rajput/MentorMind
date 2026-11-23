
import asyncio
from datetime import datetime, timezone

from app.database.mongodb import (
    connect_to_mongodb,
    close_mongodb_connection,
    get_database
)


async def test_mongodb():

    test_collection = None
    inserted_id = None

    try:
        # Step 1: Connect to MongoDB
        await connect_to_mongodb()

        db = get_database()
        test_collection = db["phase20_connection_tests"]

        print("\n--- MongoDB CRUD Testing ---")

        # Step 2: CREATE - Insert a document
        student = {
            "name": "Test Student",
            "email": "test@mentormind.com",
            "created_at": datetime.now(timezone.utc)
        }

        result = await test_collection.insert_one(student)
        inserted_id = result.inserted_id

        print("CREATE: Document inserted successfully")

        # Step 3: READ - Retrieve the document
        saved_student = await test_collection.find_one(
            {"_id": inserted_id}
        )

        print("READ:", saved_student["name"])

        # Step 4: UPDATE - Modify the document
        await test_collection.update_one(
            {"_id": inserted_id},
            {"$set": {"name": "Updated Student"}}
        )

        updated_student = await test_collection.find_one(
            {"_id": inserted_id}
        )

        print("UPDATE:", updated_student["name"])

        # Step 5: DELETE - Remove the document
        await test_collection.delete_one(
            {"_id": inserted_id}
        )

        print("DELETE: Document deleted successfully")

        print("\nAll CRUD operations passed!")

    except Exception as error:
        print("MongoDB test failed:", error)
        raise

    finally:
        if test_collection is not None and inserted_id is not None:
            await test_collection.delete_one({"_id": inserted_id})

        await close_mongodb_connection()


if __name__ == "__main__":
    asyncio.run(test_mongodb())
