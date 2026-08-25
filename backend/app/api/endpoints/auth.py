from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.api.deps import get_db, get_current_user
from backend.app.core.config import settings
from backend.app.core.security import create_access_token, get_password_hash, verify_password
from backend.app.models.user import User, UserPreference
from backend.app.schemas.user import UserRegister, UserLogin, UserResponse, Token

router = APIRouter()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check if user with this email already exists
    stmt = select(User).where(User.email == user_in.email.lower())
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    # Create user
    user = User(
        name=user_in.name,
        email=user_in.email.lower(),
        password_hash=get_password_hash(user_in.password),
        timezone=user_in.timezone or "UTC",
    )
    db.add(user)
    await db.flush() # Flush to populate user.id

    # Create default user preferences with onboarding values
    pref = UserPreference(
        user_id=user.id,
        notifications_enabled=user_in.notifications_enabled,
        quiet_start=user_in.quiet_start,
        quiet_end=user_in.quiet_end,
        voice_analysis_enabled=user_in.voice_analysis_enabled,
        preferred_mode=user_in.preferred_mode,
    )
    db.add(pref)
    await db.commit()

    # Re-fetch user with preferences loaded
    stmt = select(User).options(selectinload(User.preferences)).where(User.id == user.id)
    user_loaded = (await db.execute(stmt)).scalar_one()

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_loaded,
    }

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(User).options(selectinload(User.preferences)).where(User.email == user_in.email.lower())
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
