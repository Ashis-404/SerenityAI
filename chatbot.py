from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

# Initialize client
client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

def generate_response(user_text, emotion="neutral"):

    prompt = f"""
    The user may sound emotionally {emotion}.

    User said:
    {user_text}

    Respond naturally, supportively, and briefly.
    """

    completion = client.chat.completions.create(

        model="llama-3.1-8b-instant",

        messages=[
            {
                "role": "system",
                "content": (
                    "You are a friendly and emotionally supportive AI assistant. "
                    "Keep responses short, natural, and conversational."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],

        temperature=0.7,
        max_tokens=120
    )

    return completion.choices[0].message.content