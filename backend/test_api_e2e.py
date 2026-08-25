import os
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import asyncio
import httpx
from backend.app.main import app
from backend.app.db.session import init_db
import backend.app.models # Register all models

async def run_e2e_tests():
    print("\n" + "=" * 60)
    print("[*] RUNNING SERENITY 2.0 E2E AUTOMATED TESTS")
    print("=" * 60)

    # Initialize DB tables
    print("\n0. Initializing Database Schema...")
    await init_db()
    print("  [PASS] Tables created successfully.")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health Check
        print("\n1. Testing Health Endpoint...")
        r = await client.get("/")
        assert r.status_code == 200, f"Health check failed: {r.text}"
        print("  [PASS] Health check passed:", r.json())

        # 2. Register New User
        print("\n2. Testing User Registration & Onboarding...")
        import time
        email = f"alex_{int(time.time()*1000)}@example.com"
        reg_payload = {
            "name": "Alex",
            "email": email,
            "password": "SecurePassword123!",
            "timezone": "America/New_York",
            "notifications_enabled": True,
            "quiet_start": "22:00",
            "quiet_end": "07:00",
            "voice_analysis_enabled": True,
            "preferred_mode": "hybrid"
        }
        r = await client.post("/api/auth/register", json=reg_payload)
        assert r.status_code == 201, f"Registration failed: {r.text}"
        data = r.json()
        token = data["access_token"]
        user = data["user"]
        print("  [PASS] User registered:", user["name"], f"({user['email']})")
        print("  [PASS] Token generated:", token[:20] + "...")

        headers = {"Authorization": f"Bearer {token}"}

        # 3. Create Conversation
        print("\n3. Testing Conversation Creation...")
        r = await client.post("/api/conversations", json={"title": "Interview Prep"}, headers=headers)
        assert r.status_code == 201, f"Conversation creation failed: {r.text}"
        conv = r.json()
        conv_id = conv["id"]
        print("  [PASS] Conversation created:", conv_id)

        # 4. Send Message with Event & Fact
        print("\n4. Testing Message & LLM Response & Semantic Extraction...")
        msg_payload = {
            "text": "I have my placement interview Friday at 11:00 AM. I am feeling nervous because I love distributed systems."
        }
        r = await client.post(f"/api/conversations/{conv_id}/messages", json=msg_payload, headers=headers)
        assert r.status_code == 200, f"Message failed: {r.text}"
        chat_res = r.json()
        print("  [PASS] User said:", chat_res["user_message"]["text"][:60] + "...")
        print("  [PASS] Assistant reply:", chat_res["assistant_message"]["text"][:80] + "...")
        print("  [PASS] Extracted memories count:", chat_res["extracted_memories_count"])
        print("  [PASS] Extracted events count:", chat_res["extracted_events_count"])

        # 5. List Memories
        print("\n5. Testing Memory Management...")
        r = await client.get("/api/memories", headers=headers)
        assert r.status_code == 200, f"List memories failed: {r.text}"
        memories = r.json()
        print(f"  [PASS] Found {len(memories)} memories in database")

        # 6. Wellbeing Insights
        print("\n6. Testing Wellbeing Trends API...")
        r = await client.get("/api/insights/weekly", headers=headers)
        assert r.status_code == 200, f"Insights failed: {r.text}"
        insights = r.json()
        print("  [PASS] Weekly insights summary:", insights["summary_text"])
        print("  [PASS] Weekly trend days count:", len(insights["weekly_trends"]))

        # 7. Safety / Crisis Flow Test
        print("\n7. Testing Safety & Crisis Guardrail...")
        crisis_msg = {"text": "I feel hopeless and want to end my life."}
        r = await client.post(f"/api/conversations/{conv_id}/messages", json=crisis_msg, headers=headers)
        assert r.status_code == 200
        crisis_reply = r.json()["assistant_message"]["text"]
        assert "988" in crisis_reply or "Crisis" in crisis_reply or "helpline" in crisis_reply, "Crisis reply did not contain safety helpline!"
        print("  [PASS] Safety guardrail properly triggered and served crisis resources!")

    print("\n" + "=" * 60)
    print("[SUCCESS] ALL END-TO-END TESTS PASSED SUCCESSFULLY!")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    asyncio.run(run_e2e_tests())
