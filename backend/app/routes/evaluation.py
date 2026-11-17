
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.response_evaluator import (
    evaluate_student_response,
)

router = APIRouter(
    prefix="/api/evaluation",
    tags=["Student Response Evaluation"],
)


class Misconception(BaseModel):
    concept: str
    category: str
    explanation: str


class EvaluationRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    student_answer: str = Field(min_length=1, max_length=5000)
    document_id: str | None = None
    top_k: int = Field(default=5, ge=1, le=10)


class EvaluationResponse(BaseModel):
    evaluation: str
    feedback: str
    missing_concepts: list[str]
    misconceptions: list[Misconception]
    hint: str
    sources: list[dict]


@router.post(
    "/evaluate",
    response_model=EvaluationResponse,
)
async def evaluate_answer(request: EvaluationRequest):

    question = request.question.strip()
    student_answer = request.student_answer.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    if not student_answer:
        raise HTTPException(
            status_code=400,
            detail="Student answer cannot be empty.",
        )

    try:
        result = await evaluate_student_response(
            question=question,
            student_answer=student_answer,
            document_id=request.document_id,
            top_k=request.top_k,
        )

        return EvaluationResponse(**result)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        print(f"Evaluation error: {exc}")

        raise HTTPException(
            status_code=502,
            detail="Student response evaluation failed.",
        ) from exc
