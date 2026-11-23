
from datetime import datetime, timezone

from app.services.learning_analytics import (
    get_strengths_and_weaknesses,
    get_learning_recommendations,
)


PRIORITY_ORDER = {
    "high": 0,
    "medium": 1,
    "low": 2,
}


def divide_study_time(minutes: int, classification: str) -> list[dict]:
    """
    Divide daily study time into three activities.
    """

    if classification == "needs_improvement":
        percentages = (0.25, 0.55)
    elif classification == "strong":
        percentages = (0.15, 0.65)
    elif classification == "insufficient_data":
        percentages = (0.50, 0.35)
    else:
        percentages = (0.20, 0.50)

    first = max(1, round(minutes * percentages[0]))
    second = max(1, round(minutes * percentages[1]))
    third = minutes - first - second

    # Keep all activities within the available daily time.
    if third < 1:
        second = max(1, second - (1 - third))
        third = minutes - first - second

    if classification == "needs_improvement":
        activities = [
            "Revise fundamental concepts",
            "Solve focused practice questions",
            "Review incorrect answers",
        ]
    elif classification == "strong":
        activities = [
            "Quickly revise important concepts",
            "Attempt advanced-level questions",
            "Review your performance",
        ]
    elif classification == "insufficient_data":
        activities = [
            "Learn the basic concepts",
            "Complete guided practice questions",
            "Take a short baseline assessment",
        ]
    else:
        activities = [
            "Revise difficult concepts",
            "Solve intermediate-level questions",
            "Take a short self-assessment",
        ]

    durations = [first, second, third]

    return [
        {
            "activity": activities[index],
            "duration_minutes": durations[index],
        }
        for index in range(3)
        if durations[index] > 0
    ]


async def generate_study_plan(
    email: str,
    study_days: int = 7,
    minutes_per_day: int = 60,
) -> dict:
    """
    Generate a personalized study plan using existing
    Phase 25 learning analytics.
    """

    email = email.strip().lower()

    insights = await get_strengths_and_weaknesses(email)
    recommendations = await get_learning_recommendations(email)

    recommendation_map = {}

    for recommendation in recommendations:
        key = (
            recommendation["subject"].strip().casefold(),
            recommendation["topic"].strip().casefold(),
        )

        if key != ("", ""):
            recommendation_map[key] = recommendation

    topics = []

    for insight in insights:
        subject = insight["subject"]
        topic = insight["topic"]

        key = (
            subject.strip().casefold(),
            topic.strip().casefold(),
        )

        recommendation = recommendation_map.get(key, {})

        priority = recommendation.get("priority", "medium")

        topics.append({
            "subject": subject,
            "topic": topic,
            "classification": insight["classification"],
            "accuracy": insight["accuracy_percentage"],
            "priority": priority,
            "reason": recommendation.get(
                "reason",
                "Continue practising this topic to improve your understanding.",
            ),
        })

    # Study weak and high-priority topics first.
    topics.sort(
        key=lambda item: (
            PRIORITY_ORDER.get(item["priority"], 1),
            item["accuracy"],
        )
    )

    days = []

    for day_number in range(1, study_days + 1):

        if topics:
            selected_topic = topics[(day_number - 1) % len(topics)]

            subject = selected_topic["subject"]
            topic = selected_topic["topic"]
            classification = selected_topic["classification"]
            priority = selected_topic["priority"]
            reason = selected_topic["reason"]

            title = f"Focus on {topic}"

        else:
            # Give students without recorded progress a starting plan.
            subject = "General"
            topic = "Initial learning assessment"
            classification = "insufficient_data"
            priority = "medium"
            reason = (
                "There is not enough recorded progress to identify "
                "your strong and weak topics yet."
            )

            title = "Build your learning baseline"

        activities = divide_study_time(
            minutes_per_day,
            classification,
        )

        tasks = []

        for activity in activities:
            tasks.append({
                "subject": subject,
                "topic": topic,
                "activity": activity["activity"],
                "duration_minutes": activity["duration_minutes"],
                "priority": priority,
                "reason": reason,
            })

        days.append({
            "day_number": day_number,
            "title": title,
            "total_minutes": minutes_per_day,
            "tasks": tasks,
        })

    return {
        "email": email,
        "duration_days": study_days,
        "minutes_per_day": minutes_per_day,
        "total_planned_minutes": study_days * minutes_per_day,
        "summary": (
            "Your plan prioritizes topics that need improvement, "
            "then topics that are developing, followed by strong topics."
            if topics
            else (
                "Complete the initial learning activities and assessments "
                "so MentorMind can personalize your future study plans."
            )
        ),
        "days": days,
    }
