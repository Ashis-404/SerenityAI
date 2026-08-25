from fastapi import APIRouter
from backend.app.api.endpoints import auth, users, conversations, memories, events, notifications, wellbeing

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users & Preferences"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["Conversations & Voice"])
api_router.include_router(memories.router, prefix="/memories", tags=["Long-Term Memory"])
api_router.include_router(events.router, prefix="/events", tags=["Events & Scheduling"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(wellbeing.router, prefix="/insights", tags=["Wellbeing Insights & Interventions"])
