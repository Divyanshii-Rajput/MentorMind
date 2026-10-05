import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.embeddings import generate_embeddings
from app.services.pdf_extractor import extract_text_from_pdf
from app.services.text_processor import clean_text, chunk_text
from app.services.vector_store import add_chunks


router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"],
)


# Directory where uploaded PDFs are stored during development.
DOCUMENTS_DIR = Path(__file__).resolve().parents[2] / "data" / "documents"

# Maximum allowed PDF size: 10 MB.
MAX_FILE_SIZE = 10 * 1024 * 1024

# Initial chunking configuration.
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a PDF and process it through the initial RAG pipeline.

    Current pipeline:
        PDF
        -> Text Extraction
        -> Cleaning
        -> Chunking
        -> Embeddings
        -> ChromaDB
    """

    # Validate that a file was actually selected.
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file was selected.",
        )

    original_filename = Path(file.filename).name

    # Validate file extension.
    if Path(original_filename).suffix.lower() != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed.",
        )

    # Validate MIME type when provided by the client.
    if file.content_type not in (None, "application/pdf"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a PDF file.",
        )

    # Read the uploaded file.
    file_content = await file.read()

    # Reject empty uploads.
    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded PDF is empty.",
        )

    # Validate file size.
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="PDF file size must not exceed 10 MB.",
        )

    # Make sure the destination directory exists.
    DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)

    # Generate a unique document ID.
    document_id = str(uuid.uuid4())

    stored_filename = f"{document_id}.pdf"

    file_path = DOCUMENTS_DIR / stored_filename

    # Save the uploaded PDF.
    file_path.write_bytes(file_content)

    # Extract text from the PDF.
    try:
        extraction_result = extract_text_from_pdf(file_path)

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail="Uploaded PDF could not be found after saving.",
        ) from exc

    except RuntimeError as exc:
        raise HTTPException(
            status_code=422,
            detail="Unable to extract text from the uploaded PDF.",
        ) from exc

    extracted_text = extraction_result["text"]

    # Check whether the PDF contains extractable text.
    if not extracted_text:
        raise HTTPException(
            status_code=422,
            detail=(
                "The PDF does not contain extractable text. "
                "It may be empty or scanned as images."
            ),
        )

    # Clean the raw extracted text.
    cleaned_text = clean_text(extracted_text)

    if not cleaned_text:
        raise HTTPException(
            status_code=422,
            detail="No usable text remained after cleaning the PDF.",
        )

    # Split cleaned text into overlapping chunks.
    chunks = chunk_text(
        cleaned_text,
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )

    if not chunks:
        raise HTTPException(
            status_code=422,
            detail="Unable to create text chunks from the PDF.",
        )

    # Generate local embeddings for every chunk.
    embeddings = generate_embeddings(chunks)

    if len(embeddings) != len(chunks):
        raise HTTPException(
            status_code=500,
            detail="Embedding generation returned an unexpected result.",
        )

    embedding_dimension = len(embeddings[0]) if embeddings else 0

    # Store chunks, embeddings, and metadata in ChromaDB.
    try:
        stored_chunk_count = add_chunks(
            chunks=chunks,
            embeddings=embeddings,
            document_id=document_id,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        print(f"ChromaDB error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to store document chunks in ChromaDB.",
        ) from exc

    return {
        "message": "PDF processed and stored in ChromaDB successfully.",
        "document_id": document_id,
        "original_filename": original_filename,
        "stored_filename": stored_filename,
        "file_size": len(file_content),
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