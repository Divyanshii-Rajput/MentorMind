
from app.database.mongodb import get_database


def calculate_accuracy(correct: int, total: int) -> float:
    if total == 0:
        return 0.0

    return round((correct / total) * 100, 2)


async def get_overall_progress(email: str) -> dict:
    db = get_database()

    cursor = db.learning_progress.find({"email": email})

    total_attempts = 0
    correct = 0
    partially_correct = 0
    incorrect = 0
    topics = 0

    async for progress in cursor:
        topics += 1
        total_attempts += progress.get("attempts", 0)
        correct += progress.get("correct_count", 0)
        partially_correct += progress.get(
            "partially_correct_count", 0
        )
        incorrect += progress.get("incorrect_count", 0)

    evaluated_answers = correct + partially_correct + incorrect

    return {
        "email": email,
        "total_attempts": total_attempts,
        "correct_answers": correct,
        "partially_correct_answers": partially_correct,
        "incorrect_answers": incorrect,
        "accuracy_percentage": calculate_accuracy(
            correct, evaluated_answers
        ),
        "topics_tracked": topics,
    }


async def get_subject_progress(email: str) -> list[dict]:
    db = get_database()

    cursor = db.learning_progress.find({"email": email})

    subjects = {}

    async for progress in cursor:
        subject = progress.get("subject", "Unknown")

        if subject not in subjects:
            subjects[subject] = {
                "subject": subject,
                "total_attempts": 0,
                "correct_answers": 0,
                "partially_correct_answers": 0,
                "incorrect_answers": 0,
                "topics_tracked": 0,
            }

        record = subjects[subject]

        record["total_attempts"] += progress.get("attempts", 0)
        record["correct_answers"] += progress.get("correct_count", 0)
        record["partially_correct_answers"] += progress.get(
            "partially_correct_count", 0
        )
        record["incorrect_answers"] += progress.get("incorrect_count", 0)
        record["topics_tracked"] += 1

    results = []

    for record in subjects.values():
        evaluated = (
            record["correct_answers"]
            + record["partially_correct_answers"]
            + record["incorrect_answers"]
        )

        record["accuracy_percentage"] = calculate_accuracy(
            record["correct_answers"], evaluated
        )

        results.append(record)

    return results


async def get_topic_progress(email: str) -> list[dict]:
    db = get_database()

    cursor = db.learning_progress.find({"email": email})

    results = []

    async for progress in cursor:
        correct = progress.get("correct_count", 0)
        partial = progress.get("partially_correct_count", 0)
        incorrect = progress.get("incorrect_count", 0)

        evaluated = correct + partial + incorrect

        results.append({
            "subject": progress.get("subject", ""),
            "topic": progress.get("topic", ""),
            "current_difficulty": progress.get(
                "current_difficulty", "beginner"
            ),
            "total_attempts": progress.get("attempts", 0),
            "correct_answers": correct,
            "partially_correct_answers": partial,
            "incorrect_answers": incorrect,
            "correct_streak": progress.get("correct_streak", 0),
            "incorrect_streak": progress.get("incorrect_streak", 0),
            "accuracy_percentage": calculate_accuracy(
                correct, evaluated
            ),
        })

    return results


async def get_quiz_history(email: str) -> list[dict]:
    db = get_database()

    cursor = db.quizzes.find(
        {
            "student_email": email,
            "attempts.0": {"$exists": True},
        }
    ).sort("created_at", -1)

    results = []

    async for quiz in cursor:
        for attempt in quiz.get("attempts", []):
            results.append({
                "quiz_id": str(quiz["_id"]),
                "subject": quiz.get("subject", ""),
                "topic": quiz.get("topic", ""),
                "difficulty": quiz.get("difficulty", "beginner"),
                "submitted_at": attempt["submitted_at"].isoformat(),
                "total_questions": attempt.get("total_questions", 0),
                "correct_answers": attempt.get("correct_answers", 0),
                "incorrect_answers": attempt.get("incorrect_answers", 0),
                "score_percentage": attempt.get("score_percentage", 0.0),
            })

    results.sort(
        key=lambda item: item["submitted_at"],
        reverse=True,
    )

    return results
