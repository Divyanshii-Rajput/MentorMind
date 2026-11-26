
from pathlib import Path

from app.services.embeddings import (
    MODEL_NAME,
    generate_embeddings,
)
from app.services.pdf_extractor import extract_text_from_pdf
from app.services.text_processor import clean_text, chunk_text
from app.services.vector_store import add_chunks, COLLECTION_NAME


CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


def index_document(
    file_path: Path,
    document_id: str,
    owner_email: str,
) -> dict:

    print("\n" + "=" * 65, flush=True)
    print("       MENTORMIND - DOCUMENT INGESTION PIPELINE", flush=True)
    print("=" * 65, flush=True)

    try:
        # STEP 1: Extract PDF text.
        print("\n[STEP 1] EXTRACTING PDF TEXT", flush=True)
        print(f"File: {file_path.name}", flush=True)

        extraction_result = extract_text_from_pdf(file_path)

        extracted_text = extraction_result["text"]

        if not extracted_text:
            raise ValueError(
                "The PDF does not contain extractable text."
            )

        print(
            f"Pages extracted: {extraction_result['page_count']}",
            flush=True,
        )
        print(
            f"Raw characters: {len(extracted_text)}",
            flush=True,
        )

        # STEP 2: Clean extracted text.
        print("\n[STEP 2] CLEANING EXTRACTED TEXT", flush=True)

        cleaned_text = clean_text(extracted_text)

        if not cleaned_text:
            raise ValueError(
                "No usable text remained after cleaning the PDF."
            )

        print("Text cleaning completed.", flush=True)
        print(
            f"Cleaned characters: {len(cleaned_text)}",
            flush=True,
        )

        # STEP 3: Create chunks.
        print("\n[STEP 3] CREATING TEXT CHUNKS", flush=True)
        print(f"Chunk size: {CHUNK_SIZE}", flush=True)
        print(f"Chunk overlap: {CHUNK_OVERLAP}", flush=True)

        chunks = chunk_text(
            cleaned_text,
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
        )

        if not chunks:
            raise ValueError(
                "Unable to create text chunks from the PDF."
            )

        print(f"Total chunks created: {len(chunks)}", flush=True)

        # STEP 4: Generate embeddings.
        print("\n[STEP 4] GENERATING EMBEDDINGS", flush=True)
        print(f"Model: {MODEL_NAME}", flush=True)

        embeddings = generate_embeddings(chunks)

        if len(embeddings) != len(chunks):
            raise ValueError(
                "Embedding generation returned an unexpected result."
            )

        embedding_dimension = len(embeddings[0])

        print("Embeddings generated successfully.", flush=True)
        print(f"Total embeddings: {len(embeddings)}", flush=True)
        print(f"Vector dimensions: {embedding_dimension}", flush=True)

        # STEP 5: Store in ChromaDB.
        print("\n[STEP 5] STORING VECTORS IN CHROMADB", flush=True)
        print(f"Collection: {COLLECTION_NAME}", flush=True)

        stored_chunk_count = add_chunks(
            chunks=chunks,
            embeddings=embeddings,
            document_id=document_id,
            owner_email=owner_email,
        )

        print("Storage completed successfully.", flush=True)
        print(
            f"Chunks stored: {stored_chunk_count}",
            flush=True,
        )

        # STEP 6: Completed.
        print("\n[STEP 6] DOCUMENT INDEXING COMPLETED", flush=True)
        print(f"Document ID: {document_id}", flush=True)
        print(f"Total chunks indexed: {stored_chunk_count}", flush=True)
        print("=" * 65 + "\n", flush=True)

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

    except Exception as exc:
        print(
            f"\n[INGESTION ERROR] {type(exc).__name__}: {exc}",
            flush=True,
        )
        print("=" * 65 + "\n", flush=True)
        raise
