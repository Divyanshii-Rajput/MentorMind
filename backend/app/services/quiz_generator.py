
import json

from app.services.llm import generate_text


async def generate_quiz_questions(
    context: str,
    subject: str,
    topic: str,
    difficulty: str,
    num_questions: int,
) -> list[dict]:
    """
    Generate MCQs using only the retrieved learning material.
    """

    prompt = f"""
You are MentorMind, an educational quiz generator.

Generate exactly {num_questions} multiple-choice questions
using ONLY the learning material provided below.

Subject: {subject}
Topic: {topic}
Difficulty: {difficulty}

Difficulty guidelines:
- beginner: test basic understanding and definitions.
- intermediate: test understanding and application.
- advanced: test deeper reasoning and connections.

Requirements:
1. Each question must have exactly four options.
2. Each option must have a unique ID: A, B, C, or D.
3. Only one option must be correct.
4. Include a clear explanation of the correct answer.
5. Do not use information outside the provided material.
6. Avoid duplicate or nearly identical questions.
7. Make incorrect options plausible but unambiguously incorrect.
8. Return valid JSON only. Do not include Markdown or code fences.

Use this exact JSON structure:

{{
    "questions": [
        {{
            "question": "Question text",
            "options": [
                {{"id": "A", "text": "Option A"}},
                {{"id": "B", "text": "Option B"}},
                {{"id": "C", "text": "Option C"}},
                {{"id": "D", "text": "Option D"}}
            ],
            "correct_option_id": "A",
            "explanation": "Explanation based on the learning material."
        }}
    ]
}}

Learning Material:
------------------
{context}
------------------

Generate the quiz now.
"""

    response_text = await generate_text(prompt)

    if not response_text or not response_text.strip():
        raise ValueError("Gemini returned an empty quiz response.")

    # Remove Markdown code fences if Gemini includes them.
    cleaned_response = response_text.strip()

    if cleaned_response.startswith("```"):
        cleaned_response = cleaned_response.replace("```json", "", 1)
        cleaned_response = cleaned_response.replace("```", "")
        cleaned_response = cleaned_response.strip()

    # Extract the JSON object if extra text is present.
    start = cleaned_response.find("{")
    end = cleaned_response.rfind("}")

    if start == -1 or end == -1 or end < start:
        raise ValueError("Gemini did not return valid JSON.")

    try:
        data = json.loads(cleaned_response[start:end + 1])
    except json.JSONDecodeError as exc:
        raise ValueError("Could not parse the generated quiz.") from exc

    questions = data.get("questions")

    if not isinstance(questions, list):
        raise ValueError("Generated quiz does not contain a questions list.")

    if len(questions) != num_questions:
        raise ValueError(
            f"Expected {num_questions} questions, "
            f"but Gemini generated {len(questions)}."
        )

    validated_questions = []

    for index, question in enumerate(questions, start=1):
        if not isinstance(question, dict):
            raise ValueError(f"Question {index} has an invalid format.")

        question_text = question.get("question")
        options = question.get("options")
        correct_option_id = question.get("correct_option_id")
        explanation = question.get("explanation")

        if not isinstance(question_text, str) or not question_text.strip():
            raise ValueError(f"Question {index} has no question text.")

        if not isinstance(options, list) or len(options) != 4:
            raise ValueError(f"Question {index} must have four options.")

        option_ids = []
        validated_options = []

        for option in options:
            if not isinstance(option, dict):
                raise ValueError(f"Question {index} has an invalid option.")

            option_id = option.get("id")
            option_text = option.get("text")

            if not isinstance(option_id, str) or not option_id.strip():
                raise ValueError(f"Question {index} has an invalid option ID.")

            if not isinstance(option_text, str) or not option_text.strip():
                raise ValueError(f"Question {index} has an empty option.")

            option_ids.append(option_id)
            validated_options.append({
                "id": option_id,
                "text": option_text.strip(),
            })

        if len(set(option_ids)) != 4:
            raise ValueError(f"Question {index} has duplicate option IDs.")

        if correct_option_id not in option_ids:
            raise ValueError(
                f"Question {index} has an invalid correct option."
            )

        if not isinstance(explanation, str) or not explanation.strip():
            raise ValueError(f"Question {index} has no explanation.")

        validated_questions.append({
            "id": f"q{index}",
            "question": question_text.strip(),
            "options": validated_options,
            "correct_option_id": correct_option_id,
            "explanation": explanation.strip(),
        })

    return validated_questions
