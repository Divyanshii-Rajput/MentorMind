
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


TaskPriority = Literal["High", "Medium", "Low"]


class PlannerTaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    subject: str = Field(min_length=1, max_length=100)
    dueDate: date
    priority: TaskPriority = "Medium"


class PlannerTaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    subject: str | None = Field(default=None, min_length=1, max_length=100)
    dueDate: date | None = None
    priority: TaskPriority | None = None
    completed: bool | None = None


class PlannerTaskResponse(BaseModel):
    id: str
    title: str
    subject: str
    dueDate: date
    priority: TaskPriority
    completed: bool
    created_at: datetime
    updated_at: datetime
