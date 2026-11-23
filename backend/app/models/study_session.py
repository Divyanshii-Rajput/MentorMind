
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class StartStudySessionRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=100)
    topic: str = Field(min_length=1, max_length=150)
    activity: str = Field(min_length=1, max_length=250)
    planned_minutes: int = Field(ge=1, le=300)


class CompleteStudySessionRequest(BaseModel):
    actual_minutes: int = Field(ge=1, le=600)
    notes: str | None = Field(default=None, max_length=1000)


class StudySessionResponse(BaseModel):
    session_id: str
    email: str
    subject: str
    topic: str
    activity: str
    planned_minutes: int
    actual_minutes: int | None = None
    status: Literal["in_progress", "completed"]
    started_at: datetime
    completed_at: datetime | None = None
    notes: str | None = None


class StudySessionSummary(BaseModel):
    email: str
    total_sessions: int
    completed_sessions: int
    in_progress_sessions: int
    total_planned_minutes: int
    total_actual_minutes: int
    time_difference_minutes: int
    time_realization_percentage: float
