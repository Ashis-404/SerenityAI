from datetime import datetime, timezone as dt_timezone
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    event_time = Column(DateTime(timezone=True), nullable=False)
    follow_up_enabled = Column(Boolean, default=True, nullable=False)
    status = Column(String(50), default="confirmed", nullable=False) # pending, confirmed, completed, cancelled
    source_message_id = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(dt_timezone.utc), nullable=False)

    user = relationship("User", back_populates="events")
    notifications = relationship("Notification", back_populates="event", cascade="all, delete-orphan")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    message = Column(Text, nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="pending", nullable=False) # pending, sent, cancelled, failed
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(dt_timezone.utc), nullable=False)

    user = relationship("User", back_populates="notifications")
    event = relationship("Event", back_populates="notifications")
