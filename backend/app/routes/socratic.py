
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.services.socratic import start_socratic_session

router = APIRouter(
    prefix="/api/socratic",
    tags=["Socratic Tutor"],
)

class SocraticRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    document_id: str | None = None
    top_k: int = Field(default=5, ge=1, le=10)

class SocraticResponse(BaseModel):
    guiding_question: str
    sources: list[dict]

@router.post("/start", response_model=SocraticResponse)
async def start_session(request: SocraticRequest, http_request: Request):

    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    try:
        result = await start_socratic_session(
            question=question,
            document_id=request.document_id,
            top_k=request.top_k,
            owner_email=http_request.state.current_user["email"],
        )

        return SocraticResponse(**result)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        import logging
        logging.getLogger("mentormind.socratic").exception("Socratic tutor failed")

        raise HTTPException(
            status_code=502,
            detail="Socratic tutor generation failed.",
        ) from exc