import os
import logging
from groq import Groq
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

class SpeechService:
    def __init__(self):
        self.groq_client = None
        if settings.GROQ_API_KEY:
            try:
                self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
            except Exception as e:
                logger.error(f"Failed to initialize Groq client for STT: {e}")

    def transcribe_audio(self, file_path: str) -> str:
        """Transcribes speech from audio file with Groq Whisper fast cloud API."""
        if not os.path.exists(file_path) or os.path.getsize(file_path) < 1000:
            logger.warning("Audio file is empty or too short (<1KB). Skipping transcription.")
            return ""

        if not self.groq_client:
            logger.warning("Groq client not initialized; skipping transcription.")
            return ""

        # Attempt transcription via Groq Whisper Turbo
        for attempt in range(2):
            try:
                with open(file_path, "rb") as audio_file:
                    transcription = self.groq_client.audio.transcriptions.create(
                        file=(os.path.basename(file_path), audio_file.read()),
                        model=getattr(settings, "GROQ_WHISPER_MODEL", "whisper-large-v3-turbo"),
                        language="en",
                        response_format="text"
                    )
                if isinstance(transcription, str):
                    return transcription.strip()
                return getattr(transcription, "text", "").strip()
            except Exception as e:
                logger.warning(f"Groq Whisper attempt {attempt + 1} failed: {e}")
                if attempt == 1:
                    logger.error(f"Groq Whisper transcription permanently failed for {file_path}")
                    return ""
        return ""

speech_service = SpeechService()
