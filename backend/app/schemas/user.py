from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class UserPreferenceBase(BaseModel):
    notifications_enabled: bool = True
    quiet_start: str = "22:00"
    quiet_end: str = "07:00"
    voice_analysis_enabled: bool = True
    preferred_mode: str = "hybrid"

class UserPreferenceUpdate(BaseModel):
    notifications_enabled: Optional[bool] = None
    quiet_start: Optional[str] = None
    quiet_end: Optional[str] = None
    voice_analysis_enabled: Optional[bool] = None
    preferred_mode: Optional[str] = None

class UserPreferenceResponse(UserPreferenceBase):
    user_id: str
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    timezone: Optional[str] = "UTC"
    # Onboarding fields
    notifications_enabled: bool = True
    quiet_start: str = "22:00"
    quiet_end: str = "07:00"
    voice_analysis_enabled: bool = True
    preferred_mode: str = "hybrid"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    timezone: str
    created_at: datetime
    preferences: Optional[UserPreferenceResponse] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
