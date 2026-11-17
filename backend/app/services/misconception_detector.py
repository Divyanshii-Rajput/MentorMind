
# Categories used to classify student misconceptions.

MISCONCEPTION_CATEGORIES = {
    "concept_confusion",
    "terminology_confusion",
    "cause_effect_confusion",
    "incomplete_understanding",
    "procedural_misunderstanding",
    "unsupported_claim",
}


def validate_misconceptions(misconceptions: list) -> list[dict]:
    """
    Validate and normalize the misconceptions returned by Gemini.

    Each misconception contains:
    - concept: The concept misunderstood by the student.
    - category: The type of misunderstanding.
    - explanation: Why the student's understanding is incorrect.
    """

    if not isinstance(misconceptions, list):
        return []

    validated = []

    for item in misconceptions:

        if not isinstance(item, dict):
            continue

        concept = item.get("concept", "")
        category = item.get("category", "")
        explanation = item.get("explanation", "")

        if not all(
            isinstance(value, str)
            for value in (concept, category, explanation)
        ):
            continue

        concept = concept.strip()
        category = category.strip().lower()
        explanation = explanation.strip()

        if not concept or not explanation:
            continue

        if category not in MISCONCEPTION_CATEGORIES:
            category = "incomplete_understanding"

        validated.append({
            "concept": concept,
            "category": category,
            "explanation": explanation,
        })

    return validated
