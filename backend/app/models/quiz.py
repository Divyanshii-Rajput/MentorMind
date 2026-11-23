
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


DifficultyLevel = Literal["beginner", "intermediate", "advanced"]


class QuizGenerationRequest(BaseModel):
    document_id: str = Field(min_length=1, max_length=200)
    subject: str = Field(min_length=1, max_length=100)
    topic: str = Field(min_length=1, max_length=150)

    difficulty: DifficultyLevel = "beginner"

    num_questions: int = Field(default=5, ge=1, le=10)
    top_k: int = Field(default=5, ge=1, le=10)

    # Optional: provide this to enable Phase 22 adaptive updates.
    student_email: EmailStr | None = None


class QuizOption(BaseModel):
    id: str
    text: str


class QuizQuestion(BaseModel):
    id: str
    question: str
    options: list[QuizOption]


class QuizGenerationResponse(BaseModel):
    quiz_id: str
    subject: str
    topic: str
    difficulty: DifficultyLevel
    num_questions: int
    questions: list[QuizQuestion]
    sources: list[dict]
    created_at: datetime


class QuizAnswer(BaseModel):
    question_id: str = Field(min_length=1)
    selected_option_id: str = Field(min_length=1)


class QuizSubmissionRequest(BaseModel):
    answers: list[QuizAnswer] = Field(min_length=1)


class QuestionFeedback(BaseModel):
    question_id: str
    selected_option_id: str
    correct_option_id: str
    is_correct: bool
    explanation: str


class QuizSubmissionResponse(BaseModel):
    quiz_id: str
    total_questions: int
    attempted_questions: int
    correct_answers: int
    incorrect_answers: int
    score_percentage: float
    feedback: list[QuestionFeedback]
    adaptive_status: str
