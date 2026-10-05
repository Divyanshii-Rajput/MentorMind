from sentence_transformers import SentenceTransformer


# Local embedding model.
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


# Load the model once when the service starts.
# Loading it once avoids repeatedly loading the model for every request.
model = SentenceTransformer(MODEL_NAME)


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text chunks.

    Args:
        texts:
            List of document chunks.

    Returns:
        List of embedding vectors.
    """

    if not texts:
        return []

    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        show_progress_bar=False,
    )

    return embeddings.tolist()


def generate_embedding(text: str) -> list[float]:
    """
    Generate an embedding for a single piece of text.

    This will be useful later when embedding a student's
    search query.
    """

    if not text.strip():
        raise ValueError("Text cannot be empty.")

    embedding = model.encode(
        text,
        convert_to_numpy=True,
        show_progress_bar=False,
    )

    return embedding.tolist()