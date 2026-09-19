# Serenity 2.0: Emotion-Aware AI Friend & Personal Wellbeing Companion

> **Serenity is not trying to replace human friendship or compete with a general-purpose AI assistant on breadth. It is a persistent, emotion-aware companion that remembers meaningful context, follows up on important moments, and helps the user understand their own wellbeing over time.**

---

## 🌟 Features

* **🗣️ Attuned Voice & Text Companion**: Push-to-talk voice recording with live audio visualizer and natural conversation memory.
* **🎭 Acoustic Affect Analysis**: Non-clinical acoustic emotion classification (Pitch, Energy, Speaking Rate, 13 MFCCs) using Random Forest inference with confidence distribution.
* **🧠 Persistent Long-Term Memory**: Automatic semantic extraction of user facts, goals, preferences, milestones, and important people with transparent CRUD controls (`/memory`).
* **📅 Proactive Follow-up Notification Engine**: Background APScheduler engine that automatically schedules contextual follow-up notifications (e.g., *"How did your placement interview go today?"*) respecting quiet hours and user opt-ins.
* **📈 Longitudinal Wellbeing Dashboard**: 7-day emotional trajectory charts, dominant emotion breakdowns, average stress ratings, and reflection summaries.
* **🧘 Guided Micro-Interventions**: Non-medical grounding tools (4-4-4-4 Box Breathing with animated visualizer, 5-Min Sensory Reset, Nature Walk, Thought Dump Journal) with before/after rating tracking.
* **🛡️ Non-Clinical Guardrails & Privacy**: Self-harm crisis helpline detection (988), transient audio processing (immediate purge), and complete 1-click account and data wipe.

---

## 🏗️ Architecture & Tech Stack

```
Frontend (React + TypeScript + Vite + Glassmorphism UI)
   │ (REST / Multipart Audio)
   ▼
FastAPI Backend API + JWT Auth Middleware
   │
   ├── AI Orchestrator & Safety Rules (Non-diagnostic framing, 988 crisis handler)
   ├── Acoustic Emotion Service (Librosa MFCC/Pitch/RMS + Random Forest Classifier)
   ├── Speech STT Service (Whisper API / Local Whisper fallback)
   ├── LLM Context Service (Groq Llama / GPT-OSS Models)
   ├── Semantic Memory & Event Extractor (LLM Structured JSON)
   ├── Background Scheduler (APScheduler with Quiet Hours filter)
   └── SQLAlchemy Async DB (PostgreSQL via asyncpg)
```

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup
```bash
# In the project root:
pip install -r backend/requirements.txt

# Run the FastAPI server:
python -m uvicorn backend.app.main:app --reload --port 8000
```
Backend API docs available at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend Web App available at: `http://localhost:5173`

---

## 🧪 Running Automated Tests

Run the end-to-end integration test suite verifying user onboarding, JWT auth, conversation persistence, LLM generation, semantic memory extraction, wellbeing insights, and safety crisis fallbacks:

```bash
python backend/test_api_e2e.py
```

---

## 🐳 Docker Deployment

To launch the complete containerized stack:

```bash
docker-compose up --build
```
* Frontend: `http://localhost:3000`
* Backend API: `http://localhost:8000`

---

## 📋 PRD Validation Scenario (Appendix A)

1. **User registers** with preferred name and sets Quiet Hours (`22:00` - `07:00`).
2. **User speaks/types**: *"I have my placement interview Friday at 11:00 AM."*
3. **Serenity replies warmly**, extracts the interview event, and automatically schedules a follow-up notification.
4. **Memory page (`/memory`)** transparently displays the saved context with full edit/delete options.
5. **Scheduled Follow-up** delivers: *"How did your placement interview go today?"*
6. **User replies with voice**, emotion analysis attunes the response, and wellbeing logs reflect the emotional trajectory.
