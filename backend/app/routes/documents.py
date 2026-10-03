import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile


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
    Upload and save a PDF document.

    This phase only handles:
    - File validation
    - File size validation
    - Local storage

    PDF text extraction will be implemented in Phase 10.
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

    # Validate the MIME type when the client provides it.
    if file.content_type not in (None, "application/pdf"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a PDF file.",
        )

    # Read the uploaded file into memory.
    file_content = await file.read()

    # Reject empty files.
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

    # Generate a unique filename so two uploads cannot overwrite
    # each other even when their original names are identical.
    document_id = str(uuid.uuid4())
    stored_filename = f"{document_id}.pdf"

    file_path = DOCUMENTS_DIR / stored_filename

    # Save the PDF to disk.
    file_path.write_bytes(file_content)

    return {
        "message": "PDF uploaded successfully.",
        "document_id": document_id,
        "original_filename": original_filename,
        "stored_filename": stored_filename,
        "file_size": len(file_content),
    }