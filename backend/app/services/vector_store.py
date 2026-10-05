from pathlib import Path

import chromadb


BASE_DIR = Path(__file__).resolve().parents[2]
CHROMA_PATH = BASE_DIR / "chroma_db"

COLLECTION_NAME = "mentormind_documents"

client = chromadb.PersistentClient(path=str(CHROMA_PATH))

collection = client.get_or_create_collection(
    name=COLLECTION_NAME
)


def add_chunks(
    chunks: list[str],
    embeddings: list[list[float]],
    document_id: str,
) -> int:
    """Store document chunks and their embeddings in ChromaDB."""

    if not chunks:
        raise ValueError("No chunks provided.")

    if not embeddings:
        raise ValueError("No embeddings provided.")

    if len(chunks) != len(embeddings):
        raise ValueError(
            "Number of chunks must match number of embeddings."
        )

    ids = [
        f"{document_id}_chunk_{index}"
        for index in range(len(chunks))
    ]

    metadatas = [
        {
            "document_id": document_id,
            "chunk_index": index,
        }
        for index in range(len(chunks))
    ]

    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas,
    )

    return len(chunks)


def get_collection_count() -> int:
    """Return the total number of stored chunks."""

    return collection.count()