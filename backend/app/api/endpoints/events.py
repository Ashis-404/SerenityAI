from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.api.deps import get_db, get_current_user
from backend.app.models.user import User
from backend.app.models.event import Event
from backend.app.schemas.event import EventCreate, EventUpdate, EventResponse

router = APIRouter()

@router.get("", response_model=List[EventResponse])
async def list_events(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(Event)
        .where(Event.user_id == current_user.id)
        .order_by(Event.event_time.asc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_in: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = Event(
        user_id=current_user.id,
        title=event_in.title,
        event_time=event_in.event_time,
        follow_up_enabled=event_in.follow_up_enabled,
        status=event_in.status
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event

@router.patch("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    event_in: EventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Event).where(Event.id == event_id, Event.user_id == current_user.id)
    result = await db.execute(stmt)
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = event_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)

    await db.commit()
    await db.refresh(event)
    return event
