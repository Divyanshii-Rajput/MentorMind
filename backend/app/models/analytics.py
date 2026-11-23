
from pydantic import BaseModel


class AnalyticsOverview(BaseModel):
    email: str
    subjects_tracked: int
    topics_tracked: int
    total_quiz_attempts: int
    average_quiz_score: float
    total_learning_attempts: int


class TopicInsight(BaseModel):
    subject: str
    topic: str
    current_difficulty: str
    attempts: int
    accuracy_percentage: float
    classification: str


class LearningRecommendation(BaseModel):
    subject: str
    topic: str
    priority: str
    reason: str
    suggested_action: str


class PerformanceTrendItem(BaseModel):
    quiz_id: str
    subject: str
    topic: str
    difficulty: str
    submitted_at: str
    score_percentage: float
