from google import genai

from app.config import GEMINI_API_KEY


# Make sure the API key exists before creating the Gemini client.
if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is not configured in the backend .env file."
    )


# Create the Gemini client.
client = genai.Client(api_key=GEMINI_API_KEY)


# Model used by MentorMind.
MODEL_NAME = "gemini-3.8-flash"


async def generate_text(prompt: str) -> str:
    """
    Send a text prompt to Gemini and return the generated text.
    """

    response = await client.aio.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
    )

    return response.text