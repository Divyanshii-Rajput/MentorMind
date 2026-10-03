import re


def clean_text(text: str) -> str:
    """
    Clean raw text extracted from a PDF.

    The cleaning process:
    1. Normalizes line endings.
    2. Removes excessive whitespace.
    3. Removes repeated blank lines.
    4. Fixes words split across lines with a hyphen.
    5. Preserves meaningful paragraph boundaries.
    """

    if not text:
        return ""

    # Normalize Windows and old-style line endings.
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # Fix words that were split across a line break.
    #
    # Example:
    # normal-
    # ization
    #
    # becomes:
    # normalization
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)

    # Replace tabs with spaces.
    text = text.replace("\t", " ")

    # Remove spaces at the beginning/end of every line.
    lines = [line.strip() for line in text.split("\n")]

    # Remove completely empty lines temporarily.
    lines = [line for line in lines if line]

    # Reconstruct the text.
    text = "\n".join(lines)

    # Reduce multiple spaces to a single space.
    text = re.sub(r"[ ]{2,}", " ", text)

    # Reduce excessive blank lines while preserving paragraph separation.
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def chunk_text(
    text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
) -> list[str]:
    """
    Split cleaned text into overlapping chunks.

    Args:
        text:
            Cleaned document text.

        chunk_size:
            Maximum approximate number of characters per chunk.

        chunk_overlap:
            Number of characters shared between neighboring chunks.

    Returns:
        A list of text chunks.
    """

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

        # Stop once the final chunk has been reached.
        if end >= text_length:
            break

        # Move forward while keeping overlap with the previous chunk.
        start = end - chunk_overlap

    return chunks