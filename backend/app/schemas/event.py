from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class EventBase(BaseModel):
    title: str
    event_time: datetime
    follow_up_enabled: bool = True
    status: str = "confirmed"

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    event_time: Optional[datetime] = None
    follow_up_enabled: Optional[bool] = None
    status: Optional[str] = None

class EventResponse(EventBase):
    id: str
    user_id: str
    source_message_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    event_id: Optional[str] = None
    message: str
    scheduled_at: datetime
    sent_at: Optional[datetime] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
