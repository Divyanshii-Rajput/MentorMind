from datetime import datetime, timezone

from app.database.mongodb import get_database

DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"]


def calculate_next_difficulty(
    current_difficulty: str,
    evaluation: str,
    correct_streak: int,
    incorrect_streak: int,
    increase_threshold: int = 2,
    decrease_threshold: int = 2,
) -> dict:
    """Pure difficulty-selection logic; it does not access MongoDB."""

    if current_difficulty not in DIFFICULTY_LEVELS:
        current_difficulty = "beginner"

    if evaluation not in {"correct", "partially_correct", "incorrect"}:
        raise ValueError("Unsupported evaluation category.")

    previous = current_difficulty
    action = "maintain"
    reason = "Continue practising at the current difficulty."

    if evaluation == "correct":
        correct_streak += 1
        incorrect_streak = 0

        if correct_streak >= increase_threshold:
            current_index = DIFFICULTY_LEVELS.index(current_difficulty)

            if current_index < len(DIFFICULTY_LEVELS) - 1:
                current_difficulty = DIFFICULTY_LEVELS[current_index + 1]
                action = "increase"
                reason = (
                    f"You answered {increase_threshold} questions correctly "
                    "in a row, so the next activity will be more challenging."
                )
                correct_streak = 0
            else:
                reason = (
                    "You are already at the highest difficulty. "
                    "Keep practising advanced questions."
                )
                correct_streak = increase_threshold

    elif evaluation == "incorrect":
        incorrect_streak += 1
        correct_streak = 0

        if incorrect_streak >= decrease_threshold:
            current_index = DIFFICULTY_LEVELS.index(current_difficulty)

            if current_index > 0:
                current_difficulty = DIFFICULTY_LEVELS[current_index - 1]
                action = "decrease"
                reason = (
                    f"After {decrease_threshold} incorrect answers in a row, "
                    "the next activity will be easier to strengthen the basics."
                )
                incorrect_streak = 0
            else:
                reason = (
                    "We will stay at beginner difficulty and reinforce "
                    "the fundamentals with additional guidance."
                )
                incorrect_streak = decrease_threshold

    else:
        correct_streak = 0
        incorrect_streak = 0
        reason = (
            "Your answer shows partial understanding. "
            "The difficulty will stay the same while you strengthen the concept."
        )

    return {
        "previous_difficulty": previous,
        "recommended_difficulty": current_difficulty,
        "action": action,
        "reason": reason,
        "correct_streak": correct_streak,
        "incorrect_streak": incorrect_streak,
    }


async def update_student_difficulty(
    email: str,
    subject: str,
    topic: str,
    evaluation: str,
) -> dict:
    """Update topic-specific adaptive progress using profile and memory."""

    db = get_database()
    normalized_email = email.strip()
    normalized_subject = subject.strip()
    normalized_topic = topic.strip()

    student = await db.users.find_one({"email": normalized_email})
    if not student:
        raise ValueError("Student profile not found. Create the profile first.")

    progress_filter = {
        "email": normalized_email,
        "subject": normalized_subject,
        "topic": normalized_topic,
    }
    progress = await db.learning_progress.find_one(progress_filter) or {}

    current_difficulty = progress.get(
        "current_difficulty",
        student.get("knowledge_level", "beginner"),
    )

    # Look for memories related to this subject and topic.
    memory_cursor = db.student_memory.find({
        "email": normalized_email,
        "subject": {"$regex": f"^{_escape_regex(normalized_subject)}$", "$options": "i"},
    }).sort("created_at", -1).limit(50)

    related_memories = []
    async for memory in memory_cursor:
        if memory.get("topic", "").strip().casefold() == normalized_topic.casefold():
            related_memories.append(memory)

    has_topic_weakness = any(
        memory.get("memory_type") in {"weakness", "misconception"}
        for memory in related_memories
    )

    # A topic with a recorded weakness/misconception needs one extra correct
    # answer before difficulty increases. Stored memory therefore affects pacing.
    increase_threshold = 3 if has_topic_weakness else 2

    previous_correct_streak = progress.get("correct_streak", 0)
    previous_incorrect_streak = progress.get("incorrect_streak", 0)

    decision = calculate_next_difficulty(
        current_difficulty=current_difficulty,
        evaluation=evaluation,
        correct_streak=previous_correct_streak,
        incorrect_streak=previous_incorrect_streak,
        increase_threshold=increase_threshold,
        decrease_threshold=2,
    )

    attempts = progress.get("attempts", 0) + 1
    correct_count = progress.get("correct_count", 0) + (evaluation == "correct")
    partial_count = progress.get("partially_correct_count", 0) + (
        evaluation == "partially_correct"
    )
    incorrect_count = progress.get("incorrect_count", 0) + (
        evaluation == "incorrect"
    )

    now = datetime.now(timezone.utc)
    update_document = {
        **progress_filter,
        "current_difficulty": decision["recommended_difficulty"],
        "last_evaluation": evaluation,
        "attempts": attempts,
        "correct_count": correct_count,
        "partially_correct_count": partial_count,
        "incorrect_count": incorrect_count,
        "correct_streak": decision["correct_streak"],
        "incorrect_streak": decision["incorrect_streak"],
        "updated_at": now,
    }

    await db.learning_progress.update_one(
        progress_filter,
        {
            "$set": update_document,
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )

    personalization_notes = []
    if has_topic_weakness:
        personalization_notes.append(
            "A saved weakness or misconception for this topic was found. "
            "MentorMind requires three consecutive correct answers before "
            "increasing difficulty."
        )
    else:
        personalization_notes.append(
            "No saved weakness or misconception was found for this topic. "
            "The standard two-correct-answer threshold applies."
        )

    return {
        "email": normalized_email,
        "subject": normalized_subject,
        "topic": normalized_topic,
        "evaluation": evaluation,
        "previous_difficulty": decision["previous_difficulty"],
        "recommended_difficulty": decision["recommended_difficulty"],
        "action": decision["action"],
        "reason": decision["reason"],
        "attempts": attempts,
        "correct_streak": decision["correct_streak"],
        "incorrect_streak": decision["incorrect_streak"],
        "personalization_notes": personalization_notes,
    }


def _escape_regex(value: str) -> str:
    """Escape user-provided text before using it in a MongoDB regex."""
    import re
    return re.escape(value)


async def get_student_topic_progress(
    email: str,
    subject: str,
    topic: str,
) -> dict | None:
    db = get_database()
    normalized_email = email.strip()

    progress = await db.learning_progress.find_one({
        "email": normalized_email,
        "subject": subject.strip(),
        "topic": topic.strip(),
    })

    if not progress:
        return None

    return {
        "email": progress["email"],
        "subject": progress["subject"],
        "topic": progress["topic"],
        "current_difficulty": progress.get("current_difficulty", "beginner"),
        "attempts": progress.get("attempts", 0),
        "correct_count": progress.get("correct_count", 0),
        "partially_correct_count": progress.get("partially_correct_count", 0),
        "incorrect_count": progress.get("incorrect_count", 0),
        "correct_streak": progress.get("correct_streak", 0),
        "incorrect_streak": progress.get("incorrect_streak", 0),
    }
