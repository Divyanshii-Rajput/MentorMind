from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.llm import generate_text


router = APIRouter(
    prefix="/api/ai",
    tags=["AI"],
)


class AIRequest(BaseModel):
    prompt: str


class AIResponse(BaseModel):
    response: str


@router.post("/test", response_model=AIResponse)
async def test_ai(request: AIRequest):
    """
    Send a test prompt to Gemini and return the generated response.
    """

    prompt = request.prompt.strip()

    # Reject empty prompts.
    if not prompt:
        raise HTTPException(
            status_code=400,
            detail="Prompt cannot be empty.",
        )

    try:
        response = await generate_text(prompt)

        return AIResponse(
            response=response,
        )

    except Exception as exc:
        # Log the actual error on the backend.
        print(f"Gemini API error: {exc}")

        # Do not expose internal API errors to the frontend.
        raise HTTPException(
            status_code=502,
            detail="Gemini API request failed.",
        ) from exc