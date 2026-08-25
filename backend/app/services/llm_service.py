import os
import logging
from typing import List, Dict, Optional, Any
from groq import Groq
from backend.app.core.config import settings
from backend.app.services.safety_service import safety_service

logger = logging.getLogger(__name__)

SERENITY_SYSTEM_PROMPT = """You are Serenity, an empathetic, thoughtful, and grounded AI friend and personal wellbeing companion.

Your core traits:
1. Warm, attentive, and supportive without being overly verbose or artificial.
2. Emotionally attuned: You receive non-clinical cues about the user's emotional tone (e.g. calm, stressed, sad, happy, anxious). Acknowledge feelings naturally without diagnosing or claiming clinical certainty.
3. Attentive to life context: You remember meaningful facts, goals, preferences, and events the user has shared.
4. Grounded & Safe: You are a peer companion, NOT a therapist, doctor, or emergency service. Never offer medical advice or diagnostic conclusions.
5. Natural conversationalist: Keep responses conversational, concise (2-4 sentences usually, unless the user asks for more), and invite natural reflection without bombarding them with questions.
"""

class LLMService:
    def __init__(self):
        self.client = None
        if settings.GROQ_API_KEY:
            try:
                self.client = Groq(api_key=settings.GROQ_API_KEY)
            except Exception as e:
                logger.error(f"Error initializing Groq client: {e}")

    def generate_reply(
        self,
        user_message: str,
        detected_emotion: Optional[str] = None,
        probabilities: Optional[Dict[str, float]] = None,
        recent_messages: Optional[List[Dict[str, str]]] = None,
        memories: Optional[List[str]] = None,
        user_name: Optional[str] = None,
    ) -> str:
        # 1. Safety check
        is_crisis, crisis_reply = safety_service.check_crisis(user_message)
        if is_crisis:
            return crisis_reply

        # 2. Build context system message
        context_parts = [SERENITY_SYSTEM_PROMPT]
        if user_name:
            context_parts.append(f"User's name: {user_name}")

        if detected_emotion and detected_emotion != "unknown":
            emotion_cue = f"Acoustic affect signal: The user's vocal tone suggests they may be feeling '{detected_emotion}'."
            if probabilities and detected_emotion in probabilities:
                confidence = probabilities[detected_emotion]
                emotion_cue += f" (Relative confidence: {int(confidence * 100)}%)"
            context_parts.append(emotion_cue)

        if memories and len(memories) > 0:
            context_parts.append("Relevant memories about the user:\n" + "\n".join(f"- {m}" for m in memories))

        system_instruction = "\n\n".join(context_parts)

        # 3. Format message history
        formatted_messages = [{"role": "system", "content": system_instruction}]
        if recent_messages:
            for msg in recent_messages[-6:]: # Include last 6 turns
                role = "user" if msg.get("sender") == "user" else "assistant"
                formatted_messages.append({"role": role, "content": msg.get("text", "")})
        
        # Ensure latest message is appended
        formatted_messages.append({"role": "user", "content": user_message})

        if not self.client:
            return "I'm here with you. (Groq API key is not configured; running in offline simulation mode)."

        try:
            completion = self.client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=formatted_messages,
                temperature=0.7,
                max_tokens=250,
            )
            return completion.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"Failed with primary model {settings.GROQ_MODEL}: {e}. Retrying fallback...")
            try:
                completion = self.client.chat.completions.create(
                    model=settings.GROQ_FALLBACK_MODEL,
                    messages=formatted_messages,
                    temperature=0.7,
                    max_tokens=250,
                )
                return completion.choices[0].message.content.strip()
            except Exception as e2:
                logger.error(f"LLM generation failed: {e2}")
                return "I hear you, and I'm listening. Thank you for sharing that with me."

llm_service = LLMService()
