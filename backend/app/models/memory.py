from datetime import datetime, timezone as dt_timezone
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Memory(Base):
    __tablename__ = "memories"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), default="fact", nullable=False) # preference, goal, person, fact, milestone
    content = Column(Text, nullable=False)
    importance = Column(Float, default=1.0, nullable=False) # 0.0 to 1.0
    source_message_id = Column(String(36), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(dt_timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(dt_timezone.utc), onupdate=lambda: datetime.now(dt_timezone.utc))

    user = relationship("User", back_populates="memories")
