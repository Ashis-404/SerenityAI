import re
from typing import Tuple, Optional

# Keywords and regex patterns for severe distress, self-harm, or crisis
CRISIS_PATTERNS = [
    r"\b(suicid|kill myself|want to die|end my life|harm myself|self harm|hurt myself|no reason to live)\b",
    r"\b(overdose|hang myself|slit my wrist|take all my pills)\b",
]

CRISIS_RESPONSE = (
    "I hear how much pain you're in right now, and I care about your safety. "
    "Because I'm an AI companion and not a mental health professional or emergency service, "
    "please connect with someone who can support you right away:\n\n"
    "• **National Suicide & Crisis Lifeline**: Call or text **988** (Available 24/7, free & confidential in US/Canada)\n"
    "• **Crisis Text Line**: Text **HOME** to **741741**\n"
    "• **International Resources**: [findahelpline.com](https://findahelpline.com)\n\n"
    "You don't have to carry this alone. Please reach out to these trained counselors or someone you trust."
)

class SafetyService:
    @staticmethod
    def check_crisis(text: str) -> Tuple[bool, Optional[str]]:
        """Detects high-risk distress signals and returns crisis response path."""
        text_lower = text.lower()
        for pattern in CRISIS_PATTERNS:
            if re.search(pattern, text_lower):
                return True, CRISIS_RESPONSE
        return False, None

    @staticmethod
    def get_system_disclaimer() -> str:
        return (
            "Serenity is an AI companion designed for emotional reflection and personal organization. "
            "Serenity is not a therapist, clinical tool, or crisis response system. "
            "Acoustic emotion signals are non-diagnostic indicators."
        )

safety_service = SafetyService()
