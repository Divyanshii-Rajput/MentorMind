
from pydantic import BaseModel


class OverallProgress(BaseModel):
    email: str
    total_attempts: int
    correct_answers: int
    partially_correct_answers: int
    incorrect_answers: int
    accuracy_percentage: float
    topics_tracked: int


class SubjectProgress(BaseModel):
    subject: str
    total_attempts: int
    correct_answers: int
    partially_correct_answers: int
    incorrect_answers: int
    accuracy_percentage: float
    topics_tracked: int


class TopicProgress(BaseModel):
    subject: str
    topic: str
    current_difficulty: str
    total_attempts: int
    correct_answers: int
    partially_correct_answers: int
    incorrect_answers: int
    correct_streak: int
    incorrect_streak: int
    accuracy_percentage: float


class QuizHistoryItem(BaseModel):
    quiz_id: str
    subject: str
    topic: str
    difficulty: str
    submitted_at: str
    total_questions: int
    correct_answers: int
    incorrect_answers: int
    score_percentage: float
