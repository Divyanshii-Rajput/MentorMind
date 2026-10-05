from pathlib import Path

from app.services.embeddings import generate_embeddings
from app.services.pdf_extractor import extract_text_from_pdf
from app.services.text_processor import clean_text, chunk_text
from app.services.vector_store import add_chunks


# Initial chunking configuration.
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


def index_document(
    file_path: Path,
    document_id: str,
) -> dict:
    """
    Process a PDF and index its chunks in ChromaDB.

    Pipeline:
        PDF
        -> Text Extraction
        -> Cleaning
        -> Chunking
        -> Embeddings
        -> ChromaDB
    """

    # Extract text from the PDF.
    extraction_result = extract_text_from_pdf(file_path)

    extracted_text = extraction_result["text"]

    if not extracted_text:
        raise ValueError(
            "The PDF does not contain extractable text."
        )

    # Clean extracted text.
    cleaned_text = clean_text(extracted_text)

    if not cleaned_text:
        raise ValueError(
            "No usable text remained after cleaning the PDF."
        )

    # Create overlapping chunks.
    chunks = chunk_text(
        cleaned_text,
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )

    if not chunks:
        raise ValueError(
            "Unable to create text chunks from the PDF."
        )

    # Generate local embeddings.
    embeddings = generate_embeddings(chunks)

    if len(embeddings) != len(chunks):
        raise ValueError(
            "Embedding generation returned an unexpected result."
        )

    embedding_dimension = (
        len(embeddings[0])
        if embeddings
        else 0
    )

    # Store chunks and embeddings in ChromaDB.
    stored_chunk_count = add_chunks(
        chunks=chunks,
        embeddings=embeddings,
        document_id=document_id,
    )

    return {
        "page_count": extraction_result["page_count"],
        "raw_character_count": len(extracted_text),
        "cleaned_character_count": len(cleaned_text),
        "chunk_count": len(chunks),
        "stored_chunk_count": stored_chunk_count,
        "chunk_size": CHUNK_SIZE,
        "chunk_overlap": CHUNK_OVERLAP,
        "embedding_dimension": embedding_dimension,
        "first_chunk_preview": chunks[0][:1000],
    }