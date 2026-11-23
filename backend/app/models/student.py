
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class StudentProfileCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr

    subjects: list[str] = Field(default_factory=list)
    learning_goals: list[str] = Field(default_factory=list)

    knowledge_level: Literal[
        "beginner", "intermediate", "advanced"
    ] = "beginner"

    learning_preferences: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    weak_topics: list[str] = Field(default_factory=list)
    misconceptions: list[str] = Field(default_factory=list)


class StudentProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    subjects: list[str] | None = None
    learning_goals: list[str] | None = None

    knowledge_level: Literal[
        "beginner", "intermediate", "advanced"
    ] | None = None

    learning_preferences: list[str] | None = None
    strengths: list[str] | None = None
    weak_topics: list[str] | None = None
    misconceptions: list[str] | None = None


class StudentProfileResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    email: EmailStr
    subjects: list[str]
    learning_goals: list[str]
    knowledge_level: str
    learning_preferences: list[str]
    strengths: list[str]
    weak_topics: list[str]
    misconceptions: list[str]
    created_at: datetime
    updated_at: datetime
