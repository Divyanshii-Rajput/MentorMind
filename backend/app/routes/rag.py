from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.rag import answer_question


router = APIRouter(
    prefix="/api/rag",
    tags=["RAG"],
)


class RAGRequest(BaseModel):
    question: str = Field(
        min_length=1,
        max_length=2000,
    )

    document_id: str | None = None

    top_k: int = Field(
        default=5,
        ge=1,
        le=10,
    )


class RAGResponse(BaseModel):
    answer: str
    sources: list[dict]


@router.post("/ask", response_model=RAGResponse)
async def ask_question(request: RAGRequest):
    """
    Ask a question using the RAG pipeline.
    """

    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    try:
        result = await answer_question(
            question=question,
            document_id=request.document_id,
            top_k=request.top_k,
        )

        return RAGResponse(**result)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        print(f"RAG error: {exc}")

        raise HTTPException(
            status_code=502,
            detail="RAG generation failed.",
        ) from exc