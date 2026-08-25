import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

# Project root: E:\91990\Serenity
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Serenity 2.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "serenity_super_secret_jwt_key_2026_change_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database: SQLite async by default for zero-setup local dev, or PostgreSQL when DATABASE_URL is set
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite+aiosqlite:///{BASE_DIR}/serenity.db"
    )

    # Groq API configuration with available models
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    GROQ_FALLBACK_MODEL: str = "openai/gpt-oss-20b"
    GROQ_WHISPER_MODEL: str = "whisper-large-v3-turbo"

    # ML Model paths
    MODEL_PATH: str = str(BASE_DIR / "models" / "emotion_model.pkl")
    ENCODER_PATH: str = str(BASE_DIR / "models" / "label_encoder.pkl")
    AUDIO_UPLOAD_DIR: str = str(BASE_DIR / "uploads")

    # Notification & Quiet Hours defaults
    DEFAULT_QUIET_START: str = "22:00"
    DEFAULT_QUIET_END: str = "07:00"
    MAX_NOTIFICATIONS_PER_DAY: int = 3

    class Config:
        case_sensitive = True

settings = Settings()
