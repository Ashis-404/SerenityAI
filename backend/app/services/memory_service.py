import json
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional, Any, Tuple
from groq import Groq
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

EXTRACTION_SYSTEM_PROMPT = """You are a semantic memory and event extraction engine for an AI companion.
Analyze the user's message and determine if it contains:
1. Long-Term Facts/Preferences/Goals/Milestones/Important People about the user (e.g. "I love reading sci-fi", "My sister Sarah is visiting", "I am preparing for an interview").
2. Future Events or Deadlines with dates/times (e.g. "I have my placement interview Friday at 11 AM", "Doctor appointment tomorrow at 3pm").

You MUST return ONLY a JSON object with this exact structure:
{
  "memories": [
    {
      "type": "fact",
      "content": "Description of the memory",
      "importance": 0.8
    }
  ],
  "events": [
    {
      "title": "Placement interview",
      "approximate_date_str": "Friday at 11:00 AM",
      "relative_hours_from_now": 48
    }
  ]
}

If nothing meaningful is present, return:
{"memories": [], "events": []}
"""

class MemoryService:
    def __init__(self):
        self.client = None
        if settings.GROQ_API_KEY:
            try:
                self.client = Groq(api_key=settings.GROQ_API_KEY)
            except Exception as e:
                logger.error(f"Error initializing Groq client for MemoryService: {e}")

    def extract_memories_and_events(self, user_message: str) -> Dict[str, Any]:
        """Extracts structured memories and events from user text using LLM."""
        if not self.client or len(user_message.strip().split()) < 3:
            return {"memories": [], "events": []}

        try:
            completion = self.client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                    {"role": "user", "content": f"User message: {user_message}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=600
            )
            raw_json = completion.choices[0].message.content.strip()
            data = json.loads(raw_json)
            return {
                "memories": data.get("memories", []),
                "events": data.get("events", [])
            }
        except Exception as e:
            logger.warning(f"Memory/Event extraction error: {e}")
            return {"memories": [], "events": []}

    def retrieve_relevant_memories(self, user_message: str, user_memories: List[Any], top_k: int = 5) -> List[str]:
        """Simple keyword and importance-weighted memory retriever."""
        if not user_memories:
            return []

        user_words = set(user_message.lower().split())
        scored_memories = []

        for mem in user_memories:
            content = mem.content
            content_words = set(content.lower().split())
            overlap = len(user_words.intersection(content_words))
            score = (overlap * 2.0) + (getattr(mem, "importance", 1.0) * 1.5)
            scored_memories.append((score, content))

        # Sort by score descending
        scored_memories.sort(key=lambda x: x[0], reverse=True)
        return [content for _, content in scored_memories[:top_k]]

memory_service = MemoryService()
