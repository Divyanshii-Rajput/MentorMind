
import asyncio
import logging

from google import genai
from google.genai import types
from groq import AsyncGroq

from app.config import GEMINI_API_KEY, GROQ_API_KEY


logger = logging.getLogger(__name__)

# Provider settings
GEMINI_MODEL = "gemini-3.8-flash"
GROQ_MODEL = "openai/gpt-oss-120b"

GEMINI_TIMEOUT = 15
GROQ_TIMEOUT = 20

# Gemini retry delays
RETRY_DELAYS = [5, 10]

# Initialize Gemini
gemini_client = (
    genai.Client(api_key=GEMINI_API_KEY)
    if GEMINI_API_KEY
    else None
)

# Initialize Groq with its own timeout and no SDK retries
groq_client = (
    AsyncGroq(
        api_key=GROQ_API_KEY,
        timeout=GROQ_TIMEOUT,
        max_retries=0,
    )
    if GROQ_API_KEY
    else None
)


async def generate_with_gemini(prompt: str) -> str:
    """Generate text using Gemini with a per-attempt timeout."""

    response = await asyncio.wait_for(
        gemini_client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(
                    thinking_level="low"
                )
            ),
        ),
        timeout=GEMINI_TIMEOUT,
    )

    if not response.text or not response.text.strip():
        raise ValueError("Gemini returned an empty response.")

    return response.text


async def generate_with_groq(prompt: str) -> str:
    """Generate text using Groq as the backup provider."""

    response = await groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        temperature=0.3,
    )

    result = response.choices[0].message.content

    if not result or not result.strip():
        raise ValueError("Groq returned an empty response.")

    return result


async def generate_text(prompt: str) -> str:
    """
    Primary: Gemini (3 attempts).
    Backup: Groq (1 attempt).
    """

    if not gemini_client and not groq_client:
        raise RuntimeError(
            "Neither Gemini nor Groq API key is configured."
        )

    # Try Gemini first
    if gemini_client:

        for attempt in range(3):
            try:
                logger.info(
                    "Gemini generation attempt %s/3",
                    attempt + 1,
                )

                result = await generate_with_gemini(prompt)

                logger.info("Gemini generation successful.")
                return result

            except Exception as error:
                logger.warning(
                    "Gemini attempt %s failed: %s - %r",
                    attempt + 1,
                    type(error).__name__,
                    error,
                )

                # Do not retry permanent client/authentication errors
                status_code = getattr(error, "code", None)
                if status_code is None:
                    status_code = getattr(error, "status_code", None)

                if status_code is not None:
                    try:
                        status_code = int(status_code)
                    except (TypeError, ValueError):
                        status_code = None

                if status_code is not None and (
                    400 <= status_code < 500
                    and status_code not in (408, 429)
                ):
                    logger.error(
                        "Non-retryable Gemini error: %s",
                        status_code,
                    )
                    break

                # Wait before the next Gemini attempt
                if attempt < len(RETRY_DELAYS):
                    delay = RETRY_DELAYS[attempt]

                    logger.info(
                        "Retrying Gemini in %s seconds.",
                        delay,
                    )

                    await asyncio.sleep(delay)

    # Gemini unavailable or all attempts failed
    if groq_client:
        try:
            logger.warning(
                "Switching to Groq backup provider."
            )

            result = await generate_with_groq(prompt)

            logger.info("Groq generation successful.")
            return result

        except Exception as error:
            logger.exception("Groq generation failed.")

            raise RuntimeError(
                "Both Gemini and Groq failed. "
                "Please try again later."
            ) from error

    raise RuntimeError(
        "Gemini failed and Groq is not configured."
    )
