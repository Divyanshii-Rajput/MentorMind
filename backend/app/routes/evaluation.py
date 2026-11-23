from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field, model_validator

from app.models.adaptive import AdaptiveDifficultyResponse
from app.services.adaptive_difficulty import update_student_difficulty
from app.services.response_evaluator import evaluate_student_response

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

    # Provide all three fields to enable automatic difficulty adaptation.
    student_email: EmailStr | None = None
    subject: str | None = Field(default=None, min_length=1, max_length=100)
    topic: str | None = Field(default=None, min_length=1, max_length=150)

    @model_validator(mode="after")
    def validate_adaptive_fields(self):
        supplied = [
            self.student_email is not None,
            self.subject is not None,
            self.topic is not None,
        ]
        if any(supplied) and not all(supplied):
            raise ValueError(
                "student_email, subject, and topic must be provided together."
            )
        return self


class EvaluationResponse(BaseModel):
    evaluation: str
    feedback: str
    missing_concepts: list[str]
    misconceptions: list[Misconception]
    hint: str
    sources: list[dict]
    adaptive_difficulty: AdaptiveDifficultyResponse | None = None


@router.post(
    "/evaluate",
    response_model=EvaluationResponse,
)
async def evaluate_answer(request: EvaluationRequest, http_request: Request):
    question = request.question.strip()
    student_answer = request.student_answer.strip()

    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    if not student_answer:
        raise HTTPException(status_code=400, detail="Student answer cannot be empty.")

    try:
        result = await evaluate_student_response(
            question=question,
            student_answer=student_answer,
            document_id=request.document_id,
            top_k=request.top_k,
            owner_email=http_request.state.current_user["email"],
        )

        adaptive_result = None

        # Do not update adaptive progress when the answer could not be evaluated.
        if (
            request.subject is not None
            and request.topic is not None
            and result.get("evaluation") in {"correct", "partially_correct", "incorrect"}
        ):
            adaptive_result = await update_student_difficulty(
                email=http_request.state.current_user["email"],
                subject=request.subject,
                topic=request.topic,
                evaluation=result["evaluation"],
            )

        return EvaluationResponse(
            **result,
            adaptive_difficulty=adaptive_result,
        )

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    except Exception as exc:
        import logging
        logging.getLogger("mentormind.evaluation").exception("Response evaluation failed")
        raise HTTPException(
            status_code=502,
            detail="Student response evaluation failed.",
        ) from exc
