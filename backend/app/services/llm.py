from google import genai
from google.genai import types

from app.config import GEMINI_API_KEY


if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is not configured in the backend .env file."
    )


client = genai.Client(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-3.8-flash"


async def generate_text(prompt: str) -> str:
    """
    Send a text prompt to Gemini and return the generated text.
    """

    response = await client.aio.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(
                thinking_level="low"
            )
        ),
    )

    return response.text