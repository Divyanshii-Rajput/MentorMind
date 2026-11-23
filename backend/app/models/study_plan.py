
from pydantic import BaseModel, Field


class StudyTask(BaseModel):
    subject: str
    topic: str
    activity: str
    duration_minutes: int
    priority: str
    reason: str


class StudyDay(BaseModel):
    day_number: int
    title: str
    total_minutes: int
    tasks: list[StudyTask]


class StudyPlan(BaseModel):
    email: str
    duration_days: int
    minutes_per_day: int
    total_planned_minutes: int
    summary: str
    days: list[StudyDay]
