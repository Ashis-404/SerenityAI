from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.api.deps import get_db, get_current_user
from backend.app.models.user import User
from backend.app.models.event import Notification
from backend.app.schemas.event import NotificationResponse

router = APIRouter()

@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.scheduled_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/{notification_id}/dismiss", status_code=status.HTTP_200_OK)
async def dismiss_notification(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id)
    result = await db.execute(stmt)
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.status = "dismissed"
    await db.commit()
    return {"message": "Notification marked as dismissed"}
