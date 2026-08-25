from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class MemoryBase(BaseModel):
    type: str = "fact" # preference, goal, person, fact, milestone
    content: str
    importance: float = 1.0
    expires_at: Optional[datetime] = None

class MemoryCreate(MemoryBase):
    pass

class MemoryUpdate(BaseModel):
    type: Optional[str] = None
    content: Optional[str] = None
    importance: Optional[float] = None
    expires_at: Optional[datetime] = None

class MemoryResponse(MemoryBase):
    id: str
    user_id: str
    source_message_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
