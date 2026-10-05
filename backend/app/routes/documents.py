import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.indexer import index_document


router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"],
)


# Directory where uploaded PDFs are stored during development.
DOCUMENTS_DIR = Path(__file__).resolve().parents[2] / "data" / "documents"

# Maximum allowed PDF size: 10 MB.
MAX_FILE_SIZE = 10 * 1024 * 1024


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a PDF and index it into the MentorMind RAG pipeline.

    Pipeline:
        PDF
        -> Save
        -> Extract
        -> Clean
        -> Chunk
        -> Embed
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

    # Index the document.
    try:
        indexing_result = index_document(
            file_path=file_path,
            document_id=document_id,
        )

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail="Uploaded PDF could not be found after saving.",
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except RuntimeError as exc:
        raise HTTPException(
            status_code=422,
            detail="Unable to extract text from the uploaded PDF.",
        ) from exc

    except Exception as exc:
        print(f"Document indexing error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to index the uploaded PDF.",
        ) from exc

    return {
        "message": "PDF processed and indexed successfully.",
        "document_id": document_id,
        "original_filename": original_filename,
        "stored_filename": stored_filename,
        "file_size": len(file_content),
        **indexing_result,
    }