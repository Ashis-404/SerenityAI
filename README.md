# Serenity 2.0: Emotion-Aware AI Friend & Personal Wellbeing Companion

> **Serenity is not trying to replace human friendship or compete with a general-purpose AI assistant on breadth. It is a persistent, emotion-aware companion that remembers meaningful context, follows up on important moments, and helps users understand their own wellbeing over time.**

---

## 🌟 Key Capabilities & Features

* **🗣️ Attuned Voice & Text Companion**: Real-time push-to-talk voice recording with live acoustic waveform visualization, audio playback, and natural conversational context.
* **🎭 Acoustic Affect Analysis**: Non-clinical acoustic emotion classification extracting 13 MFCCs, pitch (F0), and RMS energy via Librosa, classified through a trained Random Forest model with confidence distributions.
* **🧠 Persistent Long-Term Memory**: Automatic semantic extraction of user facts, goals, preferences, milestones, and important people with transparent CRUD controls on the `/memory` page.
* **📅 Proactive Follow-up Notification Engine**: Background APScheduler engine that automatically schedules contextual follow-up notifications (e.g., *"How did your placement interview go today?"*) while strictly respecting user quiet hours and delivery preferences.
* **📈 Longitudinal Wellbeing Dashboard**: 7-day emotional trajectory charts, dominant emotion distributions, average stress level indicators, and supportive AI reflections on `/insights`.
* **🧘 Guided Micro-Interventions**: Non-medical grounding tools (4-4-4-4 Box Breathing with animated visualizer, 5-Min Sensory Reset, Nature Walk, Thought Dump Journal) with before-and-after mood/stress rating tracking.
* **🛡️ Non-Clinical Guardrails & Privacy**: Self-harm and crisis keyword detection with immediate 988 lifeline intervention cards, transient audio processing with automatic file purge, and complete 1-click user data erasure.

---

## 🏗️ Architecture & Technology Stack

```
Frontend (React 18 + TypeScript + Vite + Glassmorphism UI)
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
   └── SQLAlchemy 2.0 Async Engine (Pure PostgreSQL via asyncpg)
          │
          ▼
   PostgreSQL 16+ Database (TIMESTAMPTZ, Connection Pool)
```

### Core Technologies:
* **Frontend**: React 18, TypeScript, Vite, Framer Motion, Lucide React, Custom Responsive Glassmorphic CSS.
* **Backend**: FastAPI, Pydantic v2, Pydantic-Settings, Uvicorn.
* **Database**: **PostgreSQL** with SQLAlchemy 2.0 Async ORM and `asyncpg` driver (connection pooled).
* **Audio & ML**: Librosa, SoundFile, Scikit-learn, OpenAI Whisper.
* **AI / LLM**: Groq Cloud SDK (`openai/gpt-oss-120b`, `whisper-large-v3-turbo`).
* **Scheduling**: APScheduler (AsyncIOScheduler).
* **Security**: Passlib (Bcrypt), PyJWT (HS256).

---

## 🗄️ Database Schema (PostgreSQL)

Serenity uses **pure PostgreSQL** with timezone-aware timestamps (`TIMESTAMPTZ`) across all entities:

| Table | Purpose | Key Fields |
| :--- | :--- | :--- |
| **`users`** | User account identity & preferences | `id` (UUID), `name`, `email`, `password_hash`, `timezone`, `created_at` |
| **`user_preferences`** | Notification & mode settings | `user_id`, `notifications_enabled`, `quiet_start`, `quiet_end`, `voice_analysis_enabled`, `preferred_mode` |
| **`conversations`** | Multi-turn conversation sessions | `id` (UUID), `user_id`, `title`, `started_at`, `ended_at` |
| **`messages`** | Individual chat & voice messages | `id` (UUID), `conversation_id`, `sender` (user/assistant), `text`, `audio_url`, `created_at` |
| **`emotion_analyses`** | Acoustic emotion inference logs | `id` (UUID), `message_id`, `emotion`, `probabilities_json`, `model_version`, `created_at` |
| **`memories`** | Long-term extracted facts/goals | `id` (UUID), `user_id`, `type` (preference/goal/person/fact/milestone), `content`, `importance`, `expires_at` |
| **`events`** | Extracted deadlines & calendar events | `id` (UUID), `user_id`, `title`, `event_time`, `follow_up_enabled`, `status` |
| **`notifications`** | Scheduled proactive messages | `id` (UUID), `user_id`, `event_id`, `message`, `scheduled_at`, `sent_at`, `status` |
| **`wellbeing_entries`** | Daily mood and stress tracking | `id` (UUID), `user_id`, `date`, `mood`, `stress`, `emotion_summary` (JSON), `source` |
| **`interventions`** | Grounding exercise logs | `id` (UUID), `user_id`, `type`, `title`, `before_rating`, `after_rating`, `feedback_notes` |

---

## 📂 Project Structure

```
Serenity/
├── .env                         # Environment variables (API keys, DB URLs)
├── docker-compose.yml           # Multi-container setup (PostgreSQL, Backend, Frontend)
├── Dockerfile.backend           # Python 3.11 production container for FastAPI
├── Dockerfile.frontend          # Nginx container serving compiled React SPA
├── requirements.txt             # Root Python dependencies
│
├── backend/
│   ├── requirements.txt         # Backend Python dependencies
│   ├── test_api_e2e.py          # Complete 7-step automated E2E integration test suite
│   └── app/
│       ├── main.py              # FastAPI application factory & lifespan handler
│       ├── api/                 # API routes & endpoint controllers
│       │   ├── api.py           # Main API router registration
│       │   ├── deps.py          # Auth dependencies & DB session injection
│       │   └── endpoints/       # auth, companion, memories, wellbeing, settings
│       ├── core/                # Configuration & security settings
│       │   ├── config.py        # Pydantic settings & DATABASE_URL normalizer
│       │   └── security.py      # Password hashing & JWT token generators
│       ├── db/                  # Database engine & session maker
│       │   └── session.py       # Async SQLAlchemy engine with connection pooling
│       ├── models/              # SQLAlchemy ORM models (TIMESTAMPTZ)
│       ├── schemas/             # Pydantic request/response validation schemas
│       └── services/            # Core business logic services
│           ├── acoustic_analyzer.py  # MFCC, pitch, RMS energy feature extraction
│           ├── emotion_service.py    # Random Forest inference pipeline
│           ├── llm_service.py        # Groq LLM conversation attunement
│           ├── memory_service.py     # Structured JSON semantic memory extraction
│           ├── notification_service.py # APScheduler follow-up engine
│           └── safety_service.py     # Crisis keywords & 988 guardrails
│
├── frontend/
│   ├── src/
│   │   ├── pages/               # AuthPage, CompanionPage, InsightsPage, MemoryPage, SettingsPage
│   │   ├── components/          # AcousticWaveform, BreathingExerciseModal, Layout, Nav
│   │   ├── context/             # AuthContext (JWT state & token storage)
│   │   ├── services/            # Axios / Fetch API client
│   │   ├── types.ts             # TypeScript interface definitions
│   │   └── index.css            # Glassmorphism design system & micro-animations
│   └── package.json
│
└── models/                      # Serialized ML artifacts
    ├── emotion_model.pkl        # Trained Random Forest acoustic emotion classifier
    └── label_encoder.pkl        # Emotion class label encoder
```

---

## ⚙️ Environment Configuration (`.env`)

Copy the template `.env.example` to `.env` and provide your credentials:

```bash
cp .env.example .env
```

```env
# Groq API Key (required for LLM conversation & speech-to-text)
GROQ_API_KEY=your_groq_api_key_here

# PostgreSQL Database Connection URL (Standard port: 5432)
# Format: postgresql+asyncpg://<username>:<password>@<host>:<port>/<database>
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/serenity

# JWT Secret Key for token signing
SECRET_KEY=serenity_super_secret_jwt_key_2026_change_in_production

# Optional Model Overrides
GROQ_MODEL=openai/gpt-oss-120b
GROQ_WHISPER_MODEL=whisper-large-v3-turbo
```

> **Security & Port Notes**:
> * `.env` is included in `.gitignore` to prevent leaking production secrets or local database credentials into GitHub.
> * The standard PostgreSQL port is `5432`. If your local PostgreSQL instance is configured on a custom port, specify it in your local `.env`.
> * `config.py` automatically normalizes standard `postgresql://` or `postgres://` connection strings (such as those from Supabase, Neon, or RDS) into SQLAlchemy's required `postgresql+asyncpg://` dialect.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
* **Python 3.11+**
* **Node.js 18+** & **npm**
* **PostgreSQL 14+** running locally (or hosted on Supabase / Neon / Docker)

### 2. Set Up the PostgreSQL Database
Connect to your PostgreSQL server and create the database:
```sql
CREATE DATABASE serenity;
```

### 3. Backend Setup
```bash
# In the project root:
pip install -r backend/requirements.txt

# Run the FastAPI server:
python -m uvicorn backend.app.main:app --reload --port 8000
```
* **API Server**: `http://localhost:8000`
* **Swagger Interactive Docs**: `http://localhost:8000/docs`
* **ReDoc**: `http://localhost:8000/redoc`

Tables are automatically verified and created on server startup via `init_db()`.

### 4. Frontend Setup
```bash
# In another terminal:
cd frontend
npm install
npm run dev
```
* **Web App**: `http://localhost:5173`

---

## 🧪 Running Automated Tests

Serenity includes an end-to-end automated integration test suite that runs without browser dependencies, executing full API calls against the active PostgreSQL database:

```bash
python backend/test_api_e2e.py
```

### Tested Flow:
1. **Database Schema**: Validates all PostgreSQL tables and relations.
2. **Health Check**: Verifies `/` health endpoint response.
3. **User Authentication**: Tests user registration, password hashing, and JWT token issuance.
4. **Conversation Thread**: Initializes conversation session.
5. **Message & LLM Orchestration**: Simulates conversation, emotion attunement, and structured JSON memory/event extraction.
6. **Memory Management**: Queries and validates saved user memories.
7. **Wellbeing Trends**: Aggregates longitudinal emotion data over a 7-day window.
8. **Crisis Guardrail**: Triggers safety rules with simulated distress inputs and verifies the 988 crisis helpline response.

---

## 🐳 Docker Deployment

To launch the complete 3-tier containerized stack (PostgreSQL + FastAPI Backend + React/Nginx Frontend):

```bash
docker-compose up --build
```

### Services Launched:
| Service | Container Image | Port | Description |
| :--- | :--- | :--- | :--- |
| **`db`** | `postgres:16-alpine` | `5432` | PostgreSQL container with persistent volume `postgres_data` and healthcheck |
| **`backend`** | `Dockerfile.backend` | `8000` | FastAPI application waiting for `db` to become healthy |
| **`frontend`** | `Dockerfile.frontend` | `3000` | Production React SPA served via Nginx |

Access the containerized application at:
* Frontend: `http://localhost:3000`
* Backend API: `http://localhost:8000`
* Swagger API Docs: `http://localhost:8000/docs`

---

## 📋 Standard PRD Validation Scenario

1. **User registers** with preferred name, sets Quiet Hours (`22:00` - `07:00`), and signs in.
2. **User speaks/types**: *"I have my placement interview Friday at 11:00 AM. I am feeling really nervous."*
3. **Serenity replies warmly**, attuning to the acoustic anxiety, automatically extracts the interview deadline event, and schedules a follow-up notification.
4. **Memory page (`/memory`)** transparently displays the saved context (*"Placement interview"*) with full user edit/delete controls.
5. **Scheduled Follow-up** delivers at the scheduled time: *"How did your placement interview go today?"*
6. **User replies with voice**, acoustic analysis evaluates tone shifts, and the **Insights dashboard (`/insights`)** reflects the emotional trajectory and recommended grounding exercises.
