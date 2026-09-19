from datetime import datetime, date, timezone as dt_timezone
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Date, Integer, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class WellbeingEntry(Base):
    __tablename__ = "wellbeing_entries"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, default=lambda: datetime.now(dt_timezone.utc).date(), nullable=False)
    mood = Column(String(50), nullable=True) # happy, calm, stressed, sad, anxious, neutral
    stress = Column(Integer, nullable=True) # 1-10 scale
    emotion_summary = Column(JSON, nullable=True) # aggregated dominant emotions {emotion: count}
    source = Column(String(50), default="voice_conversation", nullable=False) # voice_conversation, checkin, self_report
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(dt_timezone.utc), nullable=False)

    user = relationship("User", back_populates="wellbeing_entries")

class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False) # breathing, break, walk, journaling, social_reachout
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    recommended_at = Column(DateTime(timezone=True), default=lambda: datetime.now(dt_timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    before_rating = Column(Integer, nullable=True) # 1-10 stress/mood rating before
    after_rating = Column(Integer, nullable=True) # 1-10 stress/mood rating after
    feedback_notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="interventions")
