from typing import Literal
from pydantic import BaseModel, EmailStr, Field


Difficulty = Literal["beginner", "intermediate", "advanced"]
EvaluationCategory = Literal["correct", "partially_correct", "incorrect"]


class AdaptiveDifficultyResponse(BaseModel):
    email: EmailStr
    subject: str
    topic: str
    evaluation: EvaluationCategory
    previous_difficulty: Difficulty
    recommended_difficulty: Difficulty
    action: Literal["increase", "maintain", "decrease"]
    reason: str
    attempts: int
    correct_streak: int
    incorrect_streak: int
    personalization_notes: list[str] = Field(default_factory=list)


class AdaptiveProgressResponse(BaseModel):
    email: EmailStr
    subject: str
    topic: str
    current_difficulty: Difficulty
    attempts: int
    correct_count: int
    partially_correct_count: int
    incorrect_count: int
    correct_streak: int
    incorrect_streak: int
