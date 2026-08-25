from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.api.deps import get_db, get_current_user
from backend.app.models.user import User, UserPreference
from backend.app.schemas.user import UserPreferenceUpdate, UserPreferenceResponse

router = APIRouter()

@router.patch("/preferences", response_model=UserPreferenceResponse)
async def update_preferences(
    pref_in: UserPreferenceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(UserPreference).where(UserPreference.user_id == current_user.id)
    result = await db.execute(stmt)
    pref = result.scalar_one_or_none()

    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    update_data = pref_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pref, field, value)

    await db.commit()
    await db.refresh(pref)
    return pref

@router.delete("/data", status_code=status.HTTP_200_OK)
async def delete_user_account_and_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Cascading delete will remove user_preferences, conversations, messages, emotion analyses, memories, events, notifications, wellbeing entries, and interventions
    await db.delete(current_user)
    await db.commit()
    return {"message": "All user data, conversations, and account records have been permanently deleted."}
