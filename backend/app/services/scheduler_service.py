import logging
from datetime import datetime, timezone, time
from typing import Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.db.session import AsyncSessionLocal
from backend.app.models.user import User, UserPreference
from backend.app.models.event import Notification, Event

logger = logging.getLogger(__name__)

def is_in_quiet_hours(quiet_start_str: str, quiet_end_str: str, current_time: Optional[time] = None) -> bool:
    """Checks if current time falls within user's configured quiet window (e.g. 22:00 to 07:00)."""
    if not current_time:
        current_time = datetime.now().time()

    try:
        start_parts = [int(p) for p in quiet_start_str.split(":")]
        end_parts = [int(p) for p in quiet_end_str.split(":")]
        start_time = time(start_parts[0], start_parts[1])
        end_time = time(end_parts[0], end_parts[1])

        if start_time < end_time:
            return start_time <= current_time <= end_time
        else: # Crosses midnight (e.g. 22:00 to 07:00)
            return current_time >= start_time or current_time <= end_time
    except Exception as e:
        logger.warning(f"Error parsing quiet hours: {e}")
        return False

class NotificationSchedulerService:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()

    def start(self):
        if not self.scheduler.running:
            # Poll for due notifications every 30 seconds
            self.scheduler.add_job(self.process_due_notifications, "interval", seconds=30, id="process_notifications")
            self.scheduler.start()
            logger.info("Notification scheduler started.")

    def shutdown(self):
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)
            logger.info("Notification scheduler stopped.")

    async def process_due_notifications(self):
        """Finds pending notifications due now, checks quiet hours and delivery rules, and delivers them."""
        now_utc = datetime.now(timezone.utc)
        async with AsyncSessionLocal() as session:
            try:
                stmt = select(Notification).where(
                    Notification.status == "pending",
                    Notification.scheduled_at <= now_utc
                ).options(selectinload(Notification.user).selectinload(User.preferences))
                
                result = await session.execute(stmt)
                due_notifications = result.scalars().all()

                for notif in due_notifications:
                    user = notif.user
                    if not user:
                        notif.status = "failed"
                        continue

                    pref: Optional[UserPreference] = user.preferences
                    if pref and not pref.notifications_enabled:
                        notif.status = "cancelled" # User opted out
                        continue

                    quiet_start = pref.quiet_start if pref else "22:00"
                    quiet_end = pref.quiet_end if pref else "07:00"

                    if is_in_quiet_hours(quiet_start, quiet_end):
                        # Postpone to after quiet window rather than dropping
                        continue

                    # Deliver notification (marks as sent)
                    notif.status = "sent"
                    notif.sent_at = datetime.now(timezone.utc)
                    logger.info(f"Delivered personalized follow-up notification to User {user.name}: {notif.message}")

                await session.commit()
            except Exception as e:
                logger.error(f"Error in process_due_notifications: {e}")

scheduler_service = NotificationSchedulerService()
