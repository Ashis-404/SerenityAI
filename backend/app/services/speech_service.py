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
        self.local_model = None

    def transcribe_audio(self, file_path: str) -> str:
        """Transcribes speech from audio file with Groq Whisper or local whisper fallback."""
        # 1. Try Groq Whisper API for ultra-fast response
        if self.groq_client:
            try:
                with open(file_path, "rb") as audio_file:
                    transcription = self.groq_client.audio.transcriptions.create(
                        file=(os.path.basename(file_path), audio_file.read()),
                        model="whisper-large-v3-turbo",
                        language="en",
                        response_format="text"
                    )
                if isinstance(transcription, str):
                    return transcription.strip()
                return getattr(transcription, "text", "").strip()
            except Exception as e:
                logger.warning(f"Groq Whisper transcription failed, falling back: {e}")

        # 2. Local Whisper fallback
        try:
            if self.local_model is None:
                import whisper
                self.local_model = whisper.load_model("base")
            result = self.local_model.transcribe(file_path, language="en")
            return result.get("text", "").strip()
        except Exception as e:
            logger.error(f"Local Whisper transcription failed: {e}")
            return ""

speech_service = SpeechService()
