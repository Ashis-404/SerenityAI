import os
import shutil
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.api.deps import get_db, get_current_user
from backend.app.core.config import settings
from backend.app.db.session import AsyncSessionLocal
from backend.app.models.user import User
from backend.app.models.conversation import Conversation, Message, EmotionAnalysis
from backend.app.models.memory import Memory
from backend.app.models.event import Event, Notification
from backend.app.models.wellbeing import WellbeingEntry
from backend.app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    ChatResponsePayload
)
from backend.app.services.emotion_service import emotion_service
from backend.app.services.speech_service import speech_service
from backend.app.services.llm_service import llm_service
from backend.app.services.memory_service import memory_service
from backend.app.services.safety_service import safety_service

logger = logging.getLogger(__name__)

async def bg_extract_memories_and_events(user_id: str, message_id: str, text: str):
    """Background task to extract facts and scheduled events without delaying user response."""
    try:
        extracted = await asyncio.to_thread(memory_service.extract_memories_and_events, text)
        memories = extracted.get("memories", [])
        events = extracted.get("events", [])
        if not memories and not events:
            return

        async with AsyncSessionLocal() as bg_db:
            for mem_item in memories:
                new_mem = Memory(
                    user_id=user_id,
                    type=mem_item.get("type", "fact"),
                    content=mem_item.get("content", ""),
                    importance=float(mem_item.get("importance", 1.0)),
                    source_message_id=message_id
                )
                bg_db.add(new_mem)

            for ev_item in events:
                hours_offset = ev_item.get("relative_hours_from_now", 24)
                event_time = datetime.now(timezone.utc) + timedelta(hours=hours_offset)
                new_event = Event(
                    user_id=user_id,
                    title=ev_item.get("title", "Important Event"),
                    event_time=event_time,
                    follow_up_enabled=True,
                    status="confirmed",
                    source_message_id=message_id
                )
                bg_db.add(new_event)
                await bg_db.flush()

                notif_time = event_time + timedelta(hours=2)
                notification = Notification(
                    user_id=user_id,
                    event_id=new_event.id,
                    message=f"How did your {new_event.title} go today?",
                    scheduled_at=notif_time,
                    status="pending"
                )
                bg_db.add(notification)

            await bg_db.commit()
            logger.info(f"Background extraction saved {len(memories)} memories and {len(events)} events for user {user_id}")
    except Exception as e:
        logger.warning(f"Background memory extraction failed: {e}")

router = APIRouter()

@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(Conversation)
        .options(
            selectinload(Conversation.messages).selectinload(Message.emotion_analysis)
        )
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.started_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conv_in: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv = Conversation(
        user_id=current_user.id,
        title=conv_in.title or "New Conversation"
    )
    db.add(conv)
    await db.commit()

    # Re-fetch with eager loaded relationships to satisfy Pydantic response serialization
    stmt = (
        select(Conversation)
        .options(
            selectinload(Conversation.messages).selectinload(Message.emotion_analysis)
        )
        .where(Conversation.id == conv.id)
    )
    loaded_conv = (await db.execute(stmt)).scalar_one()
    return loaded_conv

@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(Conversation)
        .options(
            selectinload(Conversation.messages).selectinload(Message.emotion_analysis)
        )
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    )
    result = await db.execute(stmt)
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.post("/{conversation_id}/messages", response_model=ChatResponsePayload)
async def send_text_message(
    conversation_id: str,
    message_in: MessageCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Conversation).options(
        selectinload(Conversation.messages).selectinload(Message.emotion_analysis)
    ).where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    result = await db.execute(stmt)
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # 1. Save user message
    user_msg = Message(
        conversation_id=conversation_id,
        sender="user",
        text=message_in.text
    )
    db.add(user_msg)
    await db.flush()

    # 2. Check safety / crisis guardrail
    is_crisis, crisis_reply = safety_service.check_crisis(message_in.text)

    # 3. Retrieve user memories for context injection
    mem_stmt = select(Memory).where(Memory.user_id == current_user.id)
    memories_list = (await db.execute(mem_stmt)).scalars().all()
    relevant_memories = memory_service.retrieve_relevant_memories(message_in.text, memories_list)

    # 4. Format recent history
    recent_history = [
        {"sender": m.sender, "text": m.text} for m in conv.messages[-6:]
    ]

    # 5. Generate LLM response in worker thread to prevent event-loop blocking
    if is_crisis:
        ai_reply_text = crisis_reply
    else:
        ai_reply_text = await asyncio.to_thread(
            llm_service.generate_reply,
            user_message=message_in.text,
            detected_emotion=None,
            recent_messages=recent_history,
            memories=relevant_memories,
            user_name=current_user.name
        )

    # 6. Save assistant message
    asst_msg = Message(
        conversation_id=conversation_id,
        sender="assistant",
        text=ai_reply_text
    )
    db.add(asst_msg)
    await db.flush()

    # 7. Extract memories & events in background task (skip on crisis messages)
    if not is_crisis:
        background_tasks.add_task(
            bg_extract_memories_and_events,
            user_id=current_user.id,
            message_id=user_msg.id,
            text=message_in.text
        )

    # Update conversation title if first message
    if len(conv.messages) <= 1:
        conv.title = message_in.text[:35] + ("..." if len(message_in.text) > 35 else "")

    await db.commit()

    # Eagerly load relationships on messages for Pydantic serialization
    user_msg_loaded = (await db.execute(
        select(Message).options(selectinload(Message.emotion_analysis)).where(Message.id == user_msg.id)
    )).scalar_one()

    asst_msg_loaded = (await db.execute(
        select(Message).options(selectinload(Message.emotion_analysis)).where(Message.id == asst_msg.id)
    )).scalar_one()

    return ChatResponsePayload(
        user_message=user_msg_loaded,
        assistant_message=asst_msg_loaded,
        detected_emotion=None,
        extracted_memories_count=0,
        extracted_events_count=0
    )

@router.post("/{conversation_id}/voice", response_model=ChatResponsePayload)
async def send_voice_message(
    conversation_id: str,
    background_tasks: BackgroundTasks,
    audio_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Conversation).options(
        selectinload(Conversation.messages).selectinload(Message.emotion_analysis)
    ).where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    result = await db.execute(stmt)
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    os.makedirs(settings.AUDIO_UPLOAD_DIR, exist_ok=True)
    original_ext = os.path.splitext(audio_file.filename or "")[1].lower()
    if not original_ext or original_ext not in [".webm", ".wav", ".mp4", ".m4a", ".ogg", ".mp3"]:
        original_ext = ".webm"
    temp_filename = f"{settings.AUDIO_UPLOAD_DIR}/voice_{current_user.id}_{int(datetime.now().timestamp() * 1000)}{original_ext}"

    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)

        # Quick validation: fail fast if audio file is empty or too short
        if os.path.getsize(temp_filename) < 1000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The recorded audio was too short or empty. Please speak for at least 1-2 seconds."
            )

        pref_stmt = select(User).options(selectinload(User.preferences)).where(User.id == current_user.id)
        user_with_pref = (await db.execute(pref_stmt)).scalar_one()
        voice_analysis_enabled = user_with_pref.preferences.voice_analysis_enabled if user_with_pref.preferences else True

        # Run transcription and acoustic emotion inference concurrently in worker threads
        transcribe_task = asyncio.to_thread(speech_service.transcribe_audio, temp_filename)
        if voice_analysis_enabled:
            emotion_task = asyncio.to_thread(emotion_service.predict_emotion, temp_filename)
            user_text, (detected_emotion, probabilities) = await asyncio.gather(transcribe_task, emotion_task)
        else:
            user_text = await transcribe_task
            detected_emotion, probabilities = "neutral", {"neutral": 1.0}

        if not user_text or not user_text.strip():
            user_text = "[Voice recording]"

        # 3. Save User Message & Emotion Analysis
        user_msg = Message(
            conversation_id=conversation_id,
            sender="user",
            text=user_text,
            audio_url=temp_filename
        )
        db.add(user_msg)
        await db.flush()

        if voice_analysis_enabled:
            emotion_rec = EmotionAnalysis(
                message_id=user_msg.id,
                emotion=detected_emotion,
                probabilities_json=probabilities,
                model_version=emotion_service.model_version
            )
            db.add(emotion_rec)

            # Record wellbeing entry
            wellbeing = WellbeingEntry(
                user_id=current_user.id,
                mood=detected_emotion,
                stress=8 if detected_emotion in ["fearful", "angry", "sad"] else (2 if detected_emotion in ["happy", "calm"] else 5),
                emotion_summary={detected_emotion: 1},
                source="voice_conversation"
            )
            db.add(wellbeing)

        # 4. Safety / Crisis check
        is_crisis, crisis_reply = safety_service.check_crisis(user_text)

        # 5. Context assembly & Memories retrieval
        mem_stmt = select(Memory).where(Memory.user_id == current_user.id)
        memories_list = (await db.execute(mem_stmt)).scalars().all()
        relevant_memories = memory_service.retrieve_relevant_memories(user_text, memories_list)

        recent_history = [
            {"sender": m.sender, "text": m.text} for m in conv.messages[-6:]
        ]

        # 6. Generate LLM response in worker thread
        if is_crisis:
            ai_reply_text = crisis_reply
        else:
            ai_reply_text = await asyncio.to_thread(
                llm_service.generate_reply,
                user_message=user_text,
                detected_emotion=detected_emotion,
                probabilities=probabilities,
                recent_messages=recent_history,
                memories=relevant_memories,
                user_name=current_user.name
            )

        # 7. Save Assistant message
        asst_msg = Message(
            conversation_id=conversation_id,
            sender="assistant",
            text=ai_reply_text
        )
        db.add(asst_msg)
        await db.flush()

        # 8. Queue background memory & event extraction (non-blocking)
        if not is_crisis and user_text != "[Voice recording]":
            background_tasks.add_task(
                bg_extract_memories_and_events,
                user_id=current_user.id,
                message_id=user_msg.id,
                text=user_text
            )

        if len(conv.messages) <= 1:
            conv.title = user_text[:35] + ("..." if len(user_text) > 35 else "")

        await db.commit()

        # Fetch messages with eager loading for Pydantic serialization
        user_msg_loaded = (await db.execute(
            select(Message).options(selectinload(Message.emotion_analysis)).where(Message.id == user_msg.id)
        )).scalar_one()

        asst_msg_loaded = (await db.execute(
            select(Message).options(selectinload(Message.emotion_analysis)).where(Message.id == asst_msg.id)
        )).scalar_one()

        return ChatResponsePayload(
            user_message=user_msg_loaded,
            assistant_message=asst_msg_loaded,
            detected_emotion=detected_emotion,
            extracted_memories_count=0,
            extracted_events_count=0
        )
    finally:
        # Clean up audio file after processing to protect user privacy
        if os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except Exception:
                pass
