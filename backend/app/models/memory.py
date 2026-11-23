
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class StudentMemoryCreate(BaseModel):
    email: EmailStr

    memory_type: Literal[
        "strength",
        "weakness",
        "misconception",
        "preference",
        "achievement",
        "learning_note",
    ]

    subject: str = Field(min_length=1, max_length=100)
    topic: str = Field(min_length=1, max_length=150)
    content: str = Field(min_length=3, max_length=2000)

    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class StudentMemoryResponse(BaseModel):
    id: str
    email: EmailStr
    memory_type: str
    subject: str
    topic: str
    content: str
    confidence: float
    created_at: datetime
