
import logging

from app.services.embeddings import generate_embedding
from app.services.llm import generate_text
from app.services.vector_store import search_similar_chunks


logger = logging.getLogger("mentormind.rag")

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
    owner_email: str | None = None,
) -> dict:

    print("\n" + "=" * 65)
    print("             MENTORMIND - RAG PIPELINE")
    print("=" * 65)

    question = question.strip()

    if not question:
        raise ValueError("Question cannot be empty.")

    # STEP 1: Receive question
    print("\n[STEP 1] STUDENT QUESTION")
    print("-" * 45)
    print(f"Question: {question}")
    print(f"Top K: {top_k}")

    # STEP 2: Generate question embedding
    print("\n[STEP 2] GENERATING QUESTION EMBEDDING")
    print("-" * 45)

    query_embedding = generate_embedding(question)

    print("Embedding generated successfully.")
    print(f"Vector dimensions: {len(query_embedding)}")

    # STEP 3: Retrieve relevant chunks
    print("\n[STEP 3] SEARCHING VECTOR DATABASE")
    print("-" * 45)
    print("Database: ChromaDB")
    print("Performing semantic similarity search...")

    retrieved_chunks = search_similar_chunks(
        query_embedding=query_embedding,
        top_k=top_k,
        document_id=document_id,
        owner_email=owner_email,
    )

    print(f"\nRequested chunks: {top_k}")
    print(f"Retrieved chunks: {len(retrieved_chunks)}")

    if not retrieved_chunks:
        print("\nNo relevant chunks found.")
        print("=" * 65)

        return {
            "answer": (
                "I could not find relevant information in "
                "the uploaded learning material."
            ),
            "sources": [],
        }

    # Display retrieved chunks
    print("\nRETRIEVED CHUNKS")
    print("-" * 45)

    for index, chunk in enumerate(retrieved_chunks, start=1):

        metadata = chunk.get("metadata", {})
        preview = chunk.get("document", "")[:250]

        print(f"\nChunk {index}")
        print(f"Document ID: {metadata.get('document_id')}")
        print(f"Chunk Index: {metadata.get('chunk_index')}")
        print(f"Distance: {chunk.get('distance')}")
        print(f"Text Preview: {preview}...")

    # STEP 4: Construct context
    print("\n[STEP 4] BUILDING RETRIEVED CONTEXT")
    print("-" * 45)

    context = build_context(retrieved_chunks)

    print("Context constructed successfully.")
    print(f"Total context characters: {len(context)}")

    # STEP 5: Build grounded prompt
    print("\n[STEP 5] PREPARING LLM PROMPT")
    print("-" * 45)

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

    print("Prompt prepared using retrieved context.")
    print("Sending context and question to the LLM...")

    # STEP 6: Generate answer
    print("\n[STEP 6] GENERATING ANSWER")
    print("-" * 45)

    answer = await generate_text(prompt)

    print("LLM response received successfully.")

    # STEP 7: Prepare source references
    sources = [
        {
            "document_id": chunk["metadata"]["document_id"],
            "chunk_index": chunk["metadata"]["chunk_index"],
            "distance": chunk["distance"],
        }
        for chunk in retrieved_chunks
    ]

    print("\n[STEP 7] SOURCE REFERENCES")
    print("-" * 45)

    for index, source in enumerate(sources, start=1):
        print(f"Source {index}:")
        print(f"  Document ID: {source['document_id']}")
        print(f"  Chunk Index: {source['chunk_index']}")
        print(f"  Distance: {source['distance']}")

    print("\n[STEP 8] FINAL ANSWER")
    print("-" * 45)
    print(answer.strip())

    print("\n" + "=" * 65)
    print("           RAG PIPELINE COMPLETED")
    print("=" * 65 + "\n")

    return {
        "answer": answer.strip(),
        "sources": sources,
    }
