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
default_local = [
    "http://localhost:5173", 
    "http://localhost:3000", 
    "http://127.0.0.1:5173", 
    "http://127.0.0.1:3000"
]

if raw_origins and raw_origins != "*":
    # Production: Strictly allow only the configured domain(s) + localhost for local development
    allowed_origins = [o.strip().rstrip("/") for o in raw_origins.split(",") if o.strip()]
    for local_url in default_local:
        if local_url not in allowed_origins:
            allowed_origins.append(local_url)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Development fallback when no specific domain is set in .env
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_origin_regex=r"^https:\/\/serenity-frontend.*\.onrender\.com$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$",
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
