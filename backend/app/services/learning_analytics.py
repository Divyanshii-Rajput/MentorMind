
from app.database.mongodb import get_database


MIN_ATTEMPTS_FOR_CLASSIFICATION = 3


def calculate_accuracy(correct: int, total: int) -> float:
    if total == 0:
        return 0.0

    return round((correct / total) * 100, 2)


def classify_performance(attempts: int, accuracy: float) -> str:
    if attempts < MIN_ATTEMPTS_FOR_CLASSIFICATION:
        return "insufficient_data"

    if accuracy >= 80:
        return "strong"

    if accuracy < 50:
        return "needs_improvement"

    return "developing"


async def _get_student_data(email: str) -> dict:
    """
    Retrieve the student's learning progress, memories,
    and quiz attempts from existing MongoDB collections.
    """

    db = get_database()

    progress_records = []
    memories = []
    quiz_records = []

    progress_cursor = db.learning_progress.find({
        "email": email
    })

    async for record in progress_cursor:
        progress_records.append(record)

    memory_cursor = db.student_memory.find({
        "email": email
    }).sort("created_at", -1).limit(100)

    async for memory in memory_cursor:
        memories.append(memory)

    quiz_cursor = db.quizzes.find({
        "student_email": email,
        "attempts.0": {"$exists": True},
    })

    async for quiz in quiz_cursor:
        quiz_records.append(quiz)

    return {
        "progress": progress_records,
        "memories": memories,
        "quizzes": quiz_records,
    }


async def get_analytics_overview(email: str) -> dict:
    data = await _get_student_data(email)

    progress_records = data["progress"]

    subjects = {
        record.get("subject")
        for record in progress_records
        if record.get("subject")
    }

    total_learning_attempts = sum(
        record.get("attempts", 0)
        for record in progress_records
    )

    quiz_attempts = []

    for quiz in data["quizzes"]:
        quiz_attempts.extend(quiz.get("attempts", []))

    total_quiz_attempts = len(quiz_attempts)

    total_quiz_score = sum(
        attempt.get("score_percentage", 0)
        for attempt in quiz_attempts
    )

    average_quiz_score = (
        round(total_quiz_score / total_quiz_attempts, 2)
        if total_quiz_attempts else 0.0
    )

    return {
        "email": email,
        "subjects_tracked": len(subjects),
        "topics_tracked": len(progress_records),
        "total_quiz_attempts": total_quiz_attempts,
        "average_quiz_score": average_quiz_score,
        "total_learning_attempts": total_learning_attempts,
    }


async def get_strengths_and_weaknesses(email: str) -> list[dict]:
    data = await _get_student_data(email)

    insights = []

    for record in data["progress"]:
        correct = record.get("correct_count", 0)
        partial = record.get("partially_correct_count", 0)
        incorrect = record.get("incorrect_count", 0)

        evaluated = correct + partial + incorrect

        accuracy = calculate_accuracy(correct, evaluated)

        insights.append({
            "subject": record.get("subject", ""),
            "topic": record.get("topic", ""),
            "current_difficulty": record.get(
                "current_difficulty", "beginner"
            ),
            "attempts": evaluated,
            "accuracy_percentage": accuracy,
            "classification": classify_performance(
                evaluated, accuracy
            ),
        })

    insights.sort(
        key=lambda item: item["accuracy_percentage"]
    )

    return insights


async def get_learning_recommendations(email: str) -> list[dict]:
    data = await _get_student_data(email)

    recommendations = []

    # Identify topics with saved weaknesses or misconceptions.
    weak_memory_topics = {
        (
            (memory.get("subject") or "").strip().casefold(),
            (memory.get("topic") or "").strip().casefold(),
        )
        for memory in data["memories"]
        if memory.get("memory_type") in {"weakness", "misconception"}
    }

    for record in data["progress"]:
        subject = record.get("subject", "")
        topic = record.get("topic", "")

        correct = record.get("correct_count", 0)
        partial = record.get("partially_correct_count", 0)
        incorrect = record.get("incorrect_count", 0)

        evaluated = correct + partial + incorrect

        if evaluated == 0:
            continue

        accuracy = calculate_accuracy(correct, evaluated)

        has_saved_weakness = (
            subject.strip().casefold(),
            topic.strip().casefold(),
        ) in weak_memory_topics

        classification = classify_performance(
            evaluated, accuracy
        )

        if has_saved_weakness:
            recommendations.append({
                "subject": subject,
                "topic": topic,
                "priority": "high",
                "reason": (
                    "A weakness or misconception for this topic "
                    "is recorded in student memory."
                ),
                "suggested_action": (
                    "Review the related learning material and "
                    "practise questions on this concept."
                ),
            })

        elif classification == "needs_improvement":
            recommendations.append({
                "subject": subject,
                "topic": topic,
                "priority": "high",
                "reason": (
                    f"Your current accuracy is {accuracy}%. "
                    "This topic needs more practice."
                ),
                "suggested_action": (
                    "Revise the topic fundamentals and attempt "
                    "a beginner-level quiz."
                ),
            })

        elif classification == "developing":
            recommendations.append({
                "subject": subject,
                "topic": topic,
                "priority": "medium",
                "reason": (
                    f"Your current accuracy is {accuracy}%. "
                    "You are making progress but need more practice."
                ),
                "suggested_action": (
                    "Practise intermediate questions and review "
                    "the concepts you find difficult."
                ),
            })

        elif classification == "strong":
            recommendations.append({
                "subject": subject,
                "topic": topic,
                "priority": "low",
                "reason": (
                    f"Your current accuracy is {accuracy}%. "
                    "You are performing well in this topic."
                ),
                "suggested_action": (
                    "Try more challenging questions to strengthen "
                    "your understanding."
                ),
            })

    priority_order = {
        "high": 0,
        "medium": 1,
        "low": 2,
    }

    recommendations.sort(
        key=lambda item: priority_order[item["priority"]]
    )

    if not recommendations:
        return [{
            "subject": "",
            "topic": "",
            "priority": "medium",
            "reason": "There is not enough learning progress data yet.",
            "suggested_action": (
                "Complete a few learning activities and quizzes "
                "to receive personalized recommendations."
            ),
        }]

    return recommendations


async def get_performance_trend(email: str) -> list[dict]:
    data = await _get_student_data(email)

    trend = []

    for quiz in data["quizzes"]:
        for attempt in quiz.get("attempts", []):
            submitted_at = attempt.get("submitted_at")

            if hasattr(submitted_at, "isoformat"):
                submitted_at = submitted_at.isoformat()
            elif submitted_at is None:
                submitted_at = ""

            trend.append({
                "quiz_id": str(quiz["_id"]),
                "subject": quiz.get("subject", ""),
                "topic": quiz.get("topic", ""),
                "difficulty": quiz.get("difficulty", "beginner"),
                "submitted_at": submitted_at,
                "score_percentage": attempt.get(
                    "score_percentage", 0.0
                ),
            })

    trend.sort(
        key=lambda item: item["submitted_at"]
    )

    # Return the most recent ten attempts.
    return trend[-10:]
