from datetime import datetime, timezone as dt_timezone
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), default="New Conversation", nullable=False)
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(dt_timezone.utc), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(String(20), nullable=False) # 'user' or 'assistant'
    text = Column(Text, nullable=False)
    audio_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(dt_timezone.utc), nullable=False)

    conversation = relationship("Conversation", back_populates="messages")
    emotion_analysis = relationship("EmotionAnalysis", back_populates="message", uselist=False, cascade="all, delete-orphan")

class EmotionAnalysis(Base):
    __tablename__ = "emotion_analyses"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    emotion = Column(String(50), nullable=False)
    probabilities_json = Column(JSON, nullable=False) # map of emotion -> float confidence
    model_version = Column(String(50), default="RandomForest_v1.0", nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(dt_timezone.utc), nullable=False)

    message = relationship("Message", back_populates="emotion_analysis")
