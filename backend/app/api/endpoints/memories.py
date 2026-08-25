from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.api.deps import get_db, get_current_user
from backend.app.models.user import User
from backend.app.models.memory import Memory
from backend.app.schemas.memory import MemoryCreate, MemoryUpdate, MemoryResponse

router = APIRouter()

@router.get("", response_model=List[MemoryResponse])
async def list_memories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(Memory)
        .where(Memory.user_id == current_user.id)
        .order_by(Memory.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED)
async def create_memory(
    mem_in: MemoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memory = Memory(
        user_id=current_user.id,
        type=mem_in.type,
        content=mem_in.content,
        importance=mem_in.importance,
        expires_at=mem_in.expires_at
    )
    db.add(memory)
    await db.commit()
    await db.refresh(memory)
    return memory

@router.patch("/{memory_id}", response_model=MemoryResponse)
async def update_memory(
    memory_id: str,
    mem_in: MemoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Memory).where(Memory.id == memory_id, Memory.user_id == current_user.id)
    result = await db.execute(stmt)
    memory = result.scalar_one_or_none()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    update_data = mem_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(memory, field, value)

    await db.commit()
    await db.refresh(memory)
    return memory

@router.delete("/{memory_id}", status_code=status.HTTP_200_OK)
async def delete_memory(
    memory_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Memory).where(Memory.id == memory_id, Memory.user_id == current_user.id)
    result = await db.execute(stmt)
    memory = result.scalar_one_or_none()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    await db.delete(memory)
    await db.commit()
    return {"message": "Memory deleted successfully"}
