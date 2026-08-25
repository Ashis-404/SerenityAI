from datetime import datetime, date
from typing import Optional, Dict, List
from pydantic import BaseModel

class WellbeingEntryResponse(BaseModel):
    id: str
    user_id: str
    date: date
    mood: Optional[str] = None
    stress: Optional[int] = None
    emotion_summary: Optional[Dict[str, int]] = None
    source: str
    created_at: datetime

    class Config:
        from_attributes = True

class InterventionCreate(BaseModel):
    type: str # breathing, break, walk, journaling, social_reachout
    title: str
    description: str

class InterventionFeedback(BaseModel):
    completed: bool = True
    before_rating: Optional[int] = None
    after_rating: Optional[int] = None
    feedback_notes: Optional[str] = None

class InterventionResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    description: str
    recommended_at: datetime
    completed_at: Optional[datetime] = None
    before_rating: Optional[int] = None
    after_rating: Optional[int] = None
    feedback_notes: Optional[str] = None

    class Config:
        from_attributes = True

class WeeklyTrendItem(BaseModel):
    day: str # e.g. "Mon", "Tue"
    date: str
    dominant_emotion: str
    stress_level: Optional[int] = None
    conversations_count: int = 0

class WellbeingSummaryResponse(BaseModel):
    total_conversations: int
    most_frequent_emotions: Dict[str, int]
    average_stress: Optional[float] = None
    weekly_trends: List[WeeklyTrendItem]
    recent_interventions: List[InterventionResponse]
    summary_text: str
