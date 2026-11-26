
import re


def clean_text(text: str) -> str:
    """Clean and normalize extracted PDF text."""

    if not text:
        return ""

    # Normalize line endings.
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # Fix words split across lines by hyphens.
    text = re.sub(
        r"(\w)-\n[ \t]*(\w)",
        r"\1\2",
        text
    )

    # Replace tabs with spaces.
    text = text.replace("\t", " ")

    # Trim each line while preserving paragraph boundaries.
    lines = [line.strip() for line in text.split("\n")]
    text = "\n".join(lines)

    # Normalize excessive spaces.
    text = re.sub(r"[ ]{2,}", " ", text)

    # Reduce excessive blank lines.
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def chunk_text(
    text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
) -> list[str]:

    if not text:
        return []

    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than zero.")

    if chunk_overlap < 0:
        raise ValueError("chunk_overlap cannot be negative.")

    if chunk_overlap >= chunk_size:
        raise ValueError(
            "chunk_overlap must be smaller than chunk_size."
        )

    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = min(start + chunk_size, text_length)

        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= text_length:
            break

        start = end - chunk_overlap

    return chunks
