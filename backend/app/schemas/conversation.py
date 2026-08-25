from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel

class EmotionAnalysisResponse(BaseModel):
    emotion: str
    probabilities_json: Dict[str, float]
    model_version: str
    created_at: datetime

    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender: str
    text: str
    audio_url: Optional[str] = None
    created_at: datetime
    emotion_analysis: Optional[EmotionAnalysisResponse] = None

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    text: str

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"

class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    messages: Optional[List[MessageResponse]] = []

    class Config:
        from_attributes = True

class ChatResponsePayload(BaseModel):
    user_message: MessageResponse
    assistant_message: MessageResponse
    detected_emotion: Optional[str] = None
    extracted_memories_count: int = 0
    extracted_events_count: int = 0
