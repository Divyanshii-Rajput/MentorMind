from app.services.embeddings import generate_embedding
from app.services.llm import generate_text
from app.services.vector_store import search_similar_chunks


DEFAULT_TOP_K = 5


def build_context(chunks: list[dict]) -> str:
    """
    Combine retrieved chunks into a context string
    that can be provided to the LLM.
    """

    if not chunks:
        return ""

    context_parts = []

    for index, chunk in enumerate(chunks, start=1):
        context_parts.append(
            f"[Source {index}]\n{chunk['document']}"
        )

    return "\n\n".join(context_parts)


async def answer_question(
    question: str,
    document_id: str | None = None,
    top_k: int = DEFAULT_TOP_K,
) -> dict:
    """
    Perform basic Retrieval-Augmented Generation.

    Pipeline:
        Question
        -> Question Embedding
        -> Similarity Search
        -> Context Construction
        -> Gemini
        -> Answer
    """

    question = question.strip()

    if not question:
        raise ValueError("Question cannot be empty.")

    # Generate an embedding for the student's question.
    query_embedding = generate_embedding(question)

    # Retrieve the most relevant chunks.
    retrieved_chunks = search_similar_chunks(
        query_embedding=query_embedding,
        top_k=top_k,
        document_id=document_id,
    )

    if not retrieved_chunks:
        return {
            "answer": (
                "I could not find relevant information in "
                "the uploaded learning material."
            ),
            "sources": [],
        }

    # Build context from retrieved chunks.
    context = build_context(retrieved_chunks)

    # Ground the LLM strictly in the retrieved material.
    prompt = f"""
You are MentorMind, an AI tutor that helps students learn
from their own study material.

Answer the student's question using ONLY the provided
learning material.

Do not use outside knowledge.

If the answer cannot be found in the provided material,
clearly say that the information is not available in the
provided material.

Explain the answer clearly and at a student-friendly level.

Learning Material:
------------------
{context}
------------------

Student Question:
{question}

Answer:
"""

    # Generate the answer using Gemini.
    answer = await generate_text(prompt)

    sources = [
        {
            "document_id": chunk["metadata"]["document_id"],
            "chunk_index": chunk["metadata"]["chunk_index"],
            "distance": chunk["distance"],
        }
        for chunk in retrieved_chunks
    ]

    return {
        "answer": answer.strip(),
        "sources": sources,
    }