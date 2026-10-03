from pathlib import Path

import fitz


def extract_text_from_pdf(file_path: Path) -> dict:
    """
    Extract text from every page of a PDF.

    Returns:
        {
            "page_count": int,
            "text": str,
        }
    """

    if not file_path.exists():
        raise FileNotFoundError(
            f"PDF file not found: {file_path}"
        )

    try:
        document = fitz.open(file_path)

        page_texts = []

        for page in document:
            text = page.get_text("text")

            if text:
                page_texts.append(text)

        page_count = len(document)

        document.close()

        extracted_text = "\n\n".join(page_texts).strip()

        return {
            "page_count": page_count,
            "text": extracted_text,
        }

    except Exception as exc:
        raise RuntimeError(
            f"Failed to extract text from PDF: {exc}"
        ) from exc