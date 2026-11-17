
import json
import re

from app.services.embeddings import generate_embedding
from app.services.llm import generate_text
from app.services.rag import build_context
from app.services.vector_store import search_similar_chunks
from app.services.misconception_detector import (
    validate_misconceptions,
)

DEFAULT_TOP_K = 5


async def evaluate_student_response(
    question: str,
    student_answer: str,
    document_id: str | None = None,
    top_k: int = DEFAULT_TOP_K,
) -> dict:

    question = question.strip()
    student_answer = student_answer.strip()

    if not question:
        raise ValueError("Question cannot be empty.")

    if not student_answer:
        raise ValueError("Student answer cannot be empty.")

    # Step 1: Generate question embedding
    query_embedding = generate_embedding(question)

    # Step 2: Retrieve relevant learning material
    retrieved_chunks = search_similar_chunks(
        query_embedding=query_embedding,
        top_k=top_k,
        document_id=document_id,
    )

    if not retrieved_chunks:
        return {
            "evaluation": "not_evaluable",
            "feedback": (
                "I could not find relevant information "
                "in your uploaded study material."
            ),
            "missing_concepts": [],
            "misconceptions": [],
            "hint": (
                "Try answering a question related to "
                "the topics in your uploaded document."
            ),
            "sources": [],
        }

    # Step 3: Build context
    context = build_context(retrieved_chunks)

    # Step 4: Prepare evaluation and misconception prompt
    prompt = f"""
You are MentorMind, an intelligent and patient AI tutor.

Evaluate the student's answer using ONLY the supplied
learning material.

Do not use outside knowledge.

Original guiding question:
{question}

Student's answer:
{student_answer}

Relevant learning material:
---------------------------
{context}
---------------------------

TASK 1: ANSWER EVALUATION

Choose exactly one category:

- correct: The answer correctly explains the main concept.
- partially_correct: The answer shows some understanding
  but misses important information.
- incorrect: The answer is incorrect or does not show
  an understanding of the concept.

TASK 2: IDENTIFY MISSING CONCEPTS

List important concepts from the material that the
student has not adequately explained.

Do not list a concept as missing merely because the
student used different wording.

TASK 3: MISCONCEPTION DETECTION

Identify specific misunderstandings in the student's answer.

Use only these categories:

- concept_confusion
- terminology_confusion
- cause_effect_confusion
- incomplete_understanding
- procedural_misunderstanding
- unsupported_claim

For each misconception provide:

- concept: The concept misunderstood.
- category: One category from the list above.
- explanation: A short explanation of the misunderstanding.

IMPORTANT RULES:

1. Do not invent misconceptions.
2. An incomplete answer is not automatically a misconception.
3. If the student has not expressed a false belief,
   return an empty misconceptions array.
4. Distinguish missing concepts from actual misconceptions.
5. Do not mark a correct alternative explanation as wrong.
6. Do not use information outside the supplied material.
7. Be encouraging and student-friendly.
8. Provide one short hint to help the student improve.
9. Do not reveal a complete model answer.

Return ONLY valid JSON in this exact structure:

{{
    "evaluation": "partially_correct",
    "feedback": "Your feedback here",
    "missing_concepts": [
        "Concept not adequately explained"
    ],
    "misconceptions": [
        {{
            "concept": "Concept misunderstood",
            "category": "concept_confusion",
            "explanation": "Explanation of the misunderstanding"
        }}
    ],
    "hint": "A short helpful hint"
}}
"""

    # Step 5: Generate evaluation and misconceptions
    response = await generate_text(prompt)

    if not response or not response.strip():
        raise RuntimeError("AI returned an empty evaluation.")

    # Step 6: Clean the JSON response
    cleaned_response = response.strip()

    cleaned_response = re.sub(
        r"^```(?:json)?\s*|\s*```$",
        "",
        cleaned_response,
        flags=re.IGNORECASE,
    ).strip()

    # Step 7: Parse JSON
    try:
        result = json.loads(cleaned_response)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "AI returned an invalid evaluation format."
        ) from exc

    if not isinstance(result, dict):
        raise RuntimeError("AI returned an invalid evaluation object.")

    # Step 8: Validate evaluation category
    allowed_categories = {
        "correct",
        "partially_correct",
        "incorrect",
    }

    if result.get("evaluation") not in allowed_categories:
        raise RuntimeError(
            "AI returned an invalid evaluation category."
        )

    # Step 9: Validate missing concepts
    missing_concepts = result.get("missing_concepts", [])

    if not isinstance(missing_concepts, list):
        missing_concepts = []

    missing_concepts = [
        item.strip()
        for item in missing_concepts
        if isinstance(item, str) and item.strip()
    ]

    # Step 10: Validate misconceptions
    misconceptions = validate_misconceptions(
        result.get("misconceptions", [])
    )

    # Step 11: Prepare source references
    sources = [
        {
            "document_id": chunk["metadata"]["document_id"],
            "chunk_index": chunk["metadata"]["chunk_index"],
            "distance": chunk["distance"],
        }
        for chunk in retrieved_chunks
    ]

    # Step 12: Return final evaluation
    return {
        "evaluation": result["evaluation"],
        "feedback": result.get("feedback", ""),
        "missing_concepts": missing_concepts,
        "misconceptions": misconceptions,
        "hint": result.get("hint", ""),
        "sources": sources,
    }
