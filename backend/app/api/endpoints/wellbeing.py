from datetime import datetime, timezone, timedelta, date
from typing import List, Dict
from collections import Counter
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.api.deps import get_db, get_current_user
from backend.app.models.user import User
from backend.app.models.wellbeing import WellbeingEntry, Intervention
from backend.app.schemas.wellbeing import (
    WellbeingSummaryResponse,
    WeeklyTrendItem,
    InterventionFeedback,
    InterventionResponse
)

router = APIRouter()

PRESET_INTERVENTIONS = [
    {
        "type": "breathing",
        "title": "4-4-4-4 Box Breathing",
        "description": "Inhale for 4s, hold for 4s, exhale for 4s, hold for 4s. A simple cycle to regulate the nervous system."
    },
    {
        "type": "break",
        "title": "Sensory Reset",
        "description": "Step away from all screens for 5 minutes. Notice 3 things you can see, 2 you can hear, and 1 you can touch."
    },
    {
        "type": "walk",
        "title": "Brisk Outdoor Walk",
        "description": "Take a 10-minute gentle walk outside to get natural light and fresh perspective."
    },
    {
        "type": "journaling",
        "title": "Thought Dump Journal",
        "description": "Write down everything currently on your mind without filtering or judging it for 3 minutes."
    }
]

@router.get("/weekly", response_model=WellbeingSummaryResponse)
async def get_weekly_insights(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now_date = datetime.now(timezone.utc).date()
    seven_days_ago = now_date - timedelta(days=7)

    stmt = (
        select(WellbeingEntry)
        .where(
            WellbeingEntry.user_id == current_user.id,
            WellbeingEntry.date >= seven_days_ago
        )
        .order_by(WellbeingEntry.date.asc())
    )
    result = await db.execute(stmt)
    entries = result.scalars().all()

    # Interventions
    int_stmt = select(Intervention).where(Intervention.user_id == current_user.id).order_by(Intervention.recommended_at.desc())
    int_result = await db.execute(int_stmt)
    interventions = int_result.scalars().all()

    # Build weekly trend items for each day of the past 7 days
    day_entries_map = {}
    for i in range(7):
        d = seven_days_ago + timedelta(days=i + 1)
        day_entries_map[d] = []

    all_emotions = []
    stress_scores = []

    for e in entries:
        if e.mood:
            all_emotions.append(e.mood)
        if e.stress is not None:
            stress_scores.append(e.stress)
        if e.date in day_entries_map:
            day_entries_map[e.date].append(e)

    weekly_trends = []
    for d, day_items in day_entries_map.items():
        day_name = d.strftime("%a")
        if day_items:
            day_emotions = [item.mood for item in day_items if item.mood]
            dominant = Counter(day_emotions).most_common(1)[0][0] if day_emotions else "neutral"
            day_stresses = [item.stress for item in day_items if item.stress is not None]
            avg_stress = int(sum(day_stresses) / len(day_stresses)) if day_stresses else 5
            weekly_trends.append(WeeklyTrendItem(
                day=day_name,
                date=d.isoformat(),
                dominant_emotion=dominant,
                stress_level=avg_stress,
                conversations_count=len(day_items)
            ))
        else:
            weekly_trends.append(WeeklyTrendItem(
                day=day_name,
                date=d.isoformat(),
                dominant_emotion="calm",
                stress_level=3,
                conversations_count=0
            ))

    emotion_counts = dict(Counter(all_emotions))
    avg_stress = float(round(sum(stress_scores) / len(stress_scores), 1)) if stress_scores else None

    # Constructive non-diagnostic summary
    if not entries:
        summary_text = "Not enough conversation signals recorded yet this week. As you chat with Serenity, your longitudinal wellbeing trends will appear here."
    else:
        most_common = Counter(all_emotions).most_common(1)[0][0] if all_emotions else "neutral"
        if most_common in ["stressed", "angry", "fearful", "sad"]:
            summary_text = f"Your recent conversations have reflected higher feelings of {most_common}. Consider trying a gentle grounding activity or taking short pauses today."
        else:
            summary_text = f"Your recent check-ins show a predominately {most_common} and steady baseline. Keep up your positive momentum!"

    return WellbeingSummaryResponse(
        total_conversations=len(entries),
        most_frequent_emotions=emotion_counts,
        average_stress=avg_stress,
        weekly_trends=weekly_trends,
        recent_interventions=interventions[:5],
        summary_text=summary_text
    )

@router.get("/interventions/presets")
async def get_preset_interventions():
    return PRESET_INTERVENTIONS

@router.post("/interventions/start", response_model=InterventionResponse)
async def start_intervention(
    type_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    selected = next((p for p in PRESET_INTERVENTIONS if p["type"] == type_name), PRESET_INTERVENTIONS[0])
    intervention = Intervention(
        user_id=current_user.id,
        type=selected["type"],
        title=selected["title"],
        description=selected["description"]
    )
    db.add(intervention)
    await db.commit()
    await db.refresh(intervention)
    return intervention

@router.post("/interventions/{intervention_id}/feedback", response_model=InterventionResponse)
async def record_intervention_feedback(
    intervention_id: str,
    feedback: InterventionFeedback,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Intervention).where(Intervention.id == intervention_id, Intervention.user_id == current_user.id)
    result = await db.execute(stmt)
    intervention = result.scalar_one_or_none()
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")

    intervention.completed_at = datetime.now(timezone.utc)
    intervention.before_rating = feedback.before_rating
    intervention.after_rating = feedback.after_rating
    intervention.feedback_notes = feedback.feedback_notes

    await db.commit()
    await db.refresh(intervention)
    return intervention
