
import json
import re

from app.services.embeddings import generate_embedding
from app.services.llm import generate_text
from app.services.rag import build_context
from app.services.vector_store import search_similar_chunks


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

    # Step 1: Generate embedding for the original question
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
            "hint": (
                "Try answering a question related to "
                "the topics in your uploaded document."
            ),
            "sources": [],
        }

    # Step 3: Build context from retrieved chunks
    context = build_context(retrieved_chunks)

    # Step 4: Prepare evaluation prompt
    prompt = f"""
You are MentorMind, an intelligent and patient AI tutor.

Your task is to evaluate a student's answer using ONLY
the provided learning material.

Do not use outside knowledge.

Original guiding question:
{question}

Student's answer:
{student_answer}

Relevant learning material:
---------------------------
{context}
---------------------------

Evaluate the student's answer carefully.

Choose exactly one evaluation category:

1. correct
   The answer correctly explains the main concept.

2. partially_correct
   The answer contains some correct understanding
   but misses important information.

3. incorrect
   The answer is incorrect or does not demonstrate
   an understanding of the concept.

Your response must follow these rules:

- Be fair and encouraging.
- Do not expect exact textbook wording.
- Accept answers that express the same meaning.
- Identify important missing concepts.
- Do not invent information absent from the material.
- Give constructive and student-friendly feedback.
- Provide one short hint to help the student improve.
- Do not reveal a complete model answer.

Return ONLY valid JSON in this exact structure:

{{
    "evaluation": "correct",
    "feedback": "Your feedback here",
    "missing_concepts": ["Concept 1"],
    "hint": "Your hint here"
}}
"""

    # Step 5: Generate evaluation using Gemini
    response = await generate_text(prompt)

    if not response or not response.strip():
        raise RuntimeError("AI returned an empty evaluation.")

    # Step 6: Parse Gemini JSON response
    cleaned_response = response.strip()

    cleaned_response = re.sub(
        r"^```(?:json)?\s*|\s*```$",
        "",
        cleaned_response,
        flags=re.IGNORECASE,
    ).strip()

    try:
        result = json.loads(cleaned_response)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "AI returned an invalid evaluation format."
        ) from exc

    # Step 7: Validate evaluation category
    allowed_categories = {
        "correct",
        "partially_correct",
        "incorrect",
    }

    if result.get("evaluation") not in allowed_categories:
        raise RuntimeError("AI returned an invalid evaluation category.")

    # Step 8: Attach source information
    sources = [
        {
            "document_id": chunk["metadata"]["document_id"],
            "chunk_index": chunk["metadata"]["chunk_index"],
            "distance": chunk["distance"],
        }
        for chunk in retrieved_chunks
    ]

    return {
        "evaluation": result["evaluation"],
        "feedback": result.get("feedback", ""),
        "missing_concepts": result.get("missing_concepts", []),
        "hint": result.get("hint", ""),
        "sources": sources,
    }
