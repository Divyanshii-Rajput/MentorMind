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

def search_similar_chunks(
    query_embedding: list[float],
    top_k: int = 5,
    document_id: str | None = None,
) -> list[dict]:
    """
    Search ChromaDB for chunks most similar to the query embedding.

    If document_id is provided, search only within that document.
    """

    if not query_embedding:
        raise ValueError("Query embedding cannot be empty.")

    if top_k <= 0:
        raise ValueError("top_k must be greater than zero.")

    total_chunks = collection.count()

    if total_chunks == 0:
        return []

    # Build an optional document filter.
    where_filter = None

    if document_id:
        where_filter = {
            "document_id": document_id,
        }

    # Do not request more results than are available.
    top_k = min(top_k, total_chunks)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where=where_filter,
        include=[
            "documents",
            "metadatas",
            "distances",
        ],
    )

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]
    ids = results.get("ids", [[]])[0]

    matches = []

    for index in range(len(documents)):
        matches.append(
            {
                "id": ids[index],
                "document": documents[index],
                "metadata": metadatas[index],
                "distance": distances[index],
            }
        )

    return matches

def get_collection_count() -> int:
    """Return the total number of stored chunks."""

    return collection.count()