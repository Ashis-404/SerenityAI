from datetime import datetime, timezone as dt_timezone
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    timezone = Column(String(50), default="UTC", nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(dt_timezone.utc), nullable=False)

    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="user", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    wellbeing_entries = relationship("WellbeingEntry", back_populates="user", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="user", cascade="all, delete-orphan")

class UserPreference(Base):
    __tablename__ = "user_preferences"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    notifications_enabled = Column(Boolean, default=True, nullable=False)
    quiet_start = Column(String(10), default="22:00", nullable=False)
    quiet_end = Column(String(10), default="07:00", nullable=False)
    voice_analysis_enabled = Column(Boolean, default=True, nullable=False)
    preferred_mode = Column(String(20), default="hybrid", nullable=False) # text, voice, hybrid
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(dt_timezone.utc), onupdate=lambda: datetime.now(dt_timezone.utc))

    user = relationship("User", back_populates="preferences")
