import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.db.session import engine, Base
from backend.app.api.api import api_router
from backend.app.services.scheduler_service import scheduler_service
import backend.app.models # Register all models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if not exist
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        import logging
        logging.getLogger("uvicorn.error").error(f"Database initialization notice: {e}")
    
    # Start APScheduler background worker
    scheduler_service.start()
    
    yield
    
    # Shutdown
    scheduler_service.shutdown()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
    description="Serenity 2.0 Backend: Emotion-Aware AI Companion API"
)

# CORS middleware for frontend integration
raw_origins = getattr(settings, "CORS_ORIGINS", "*")
origins = [o.strip() for o in raw_origins.split(",") if o.strip()] if raw_origins != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "app": "Serenity 2.0 Backend API",
        "version": "2.0.0",
        "docs_url": "/docs"
    }
