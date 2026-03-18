# QueryLens 🔍

> **Natural Language → SQL → Interactive BI Dashboards**

QueryLens lets non-technical users ask plain-English questions about data and instantly see interactive, auto-selected charts powered by a Gemini LLM backend.

---

## Architecture Overview

```
User types NL query
        ↓
   [Frontend — Next.js 14]
        ↓  POST /api/query (JWT)
   [Backend — FastAPI]
        ↓
   [Gemini 2.5 Flash] — NL → SQL (parameterized)
        ↓
   [SQLite — querylens.db] — safe parameterized execution
        ↓
   [Chart Selector] — picks bar/line/pie/scatter/stat_card
        ↓
   [Recharts] — interactive dashboard rendered in browser
```

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, Tailwind CSS (Glassmorphism), `next-themes` (Light/Dark Mode), Recharts, Anime.js |
| Backend | Python 3.11+, FastAPI, Uvicorn |
| LLM | Google Gemini (`google-genai` SDK, `gemini-2.5-flash` model) |
| Database | SQLite 3 (parameterized queries only) |
| Auth | JWT (python-jose + passlib) |
| Security | slowapi rate limiting, bleach sanitization, gitleaks |

---

## Project Structure

```
/querylens
  /frontend         — Next.js app (React 18, Tailwind, next-themes, Recharts, Anime.js)
  /backend          — FastAPI app (Gemini LLM, SQLite, JWT auth)
  /data             — BMW_Vehicle_Inventory.csv + seed script
  /docs             — Problem statement, security guide (reference)
  README.md
  .gitignore
  .pre-commit-config.yaml
```

---

## Setup Instructions

### Prerequisites

- Node.js 20+ LTS
- Python 3.11+
- Git
- Google Gemini API key ([get one here](https://aistudio.google.com))

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in your GEMINI_API_KEY and a random JWT_SECRET_KEY in .env

# Initialize database
python db/init_db.py
python db/seed_db.py

# Run the FastAPI server
uvicorn main:app --reload --port 8000
```

### Frontend

In a new terminal:
```bash
cd frontend
npm install

# Run the Next.js development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Demo Credentials
To login and test the application, use the configured local user:
- **Username:** `admin`
- **Password:** `querylens2024`

---

## Environment Variables

| Variable | Description | Required |
|---|---|:---:|
| `GEMINI_API_KEY` | Google Gemini API key from AI Studio | ✅ |
| `JWT_SECRET_KEY` | Random secret for JWT signing (min 32 chars) | ✅ |
| `DATABASE_PATH` | Path to SQLite DB file | ✅ |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | ✅ |

> ⚠️ **Never commit `.env` — it is gitignored. Use `.env.example` as a template.**

---

## Security

QueryLens implements the **AthenaGuard** security model:

- ✅ Parameterized SQL only — no f-string concatenation
- ✅ SELECT-only enforcement at executor layer
- ✅ JWT authentication on all protected endpoints
- ✅ Rate limiting (slowapi) on auth + query routes
- ✅ Input sanitization (bleach) on all user text
- ✅ API key + secrets never logged or committed
- ✅ gitleaks pre-commit hook for secrets scanning
- ✅ CSV upload: MIME type + magic bytes validation, column name sanitization

---

## Custom CSV Upload

QueryLens supports **data-agnostic** querying. Users can upload any `.csv` file via the **Upload Data** page, and the system will:

1. Parse and sanitize all column names
2. Load the data into a session-scoped SQLite table
3. Automatically build a dynamic schema description
4. Route all subsequent Gemini queries against the uploaded table

No code changes or schema definitions are required — just drag, drop, and ask questions!

---

## Follow-Up Chat

QueryLens supports **multi-turn conversational queries**. Users can ask follow-up questions that reference previous answers:

1. Ask: *"What is the average price by fuel type?"*
2. Follow up: *"Now show me only diesel"* — Gemini resolves "diesel" from context
3. Follow up: *"What about the mileage for those?"* — Gemini knows "those" = diesel

**How it works:** Each query's generated SQL is stored in `query_history`. Before each new query, the backend loads the last 5 Q→SQL turns and injects them into the Gemini prompt as conversation context.

---

## Voice Input

QueryLens supports **hands-free querying** via the browser's built-in Web Speech API.

### How to Use
1. Click the **microphone icon** (left of the query input bar).
2. The button turns red with a pulse animation — speak your question naturally.
3. Your words appear live in the input field as you speak (interim transcription).
4. Click the microphone icon again to **stop recording** — the query auto-submits immediately.

### Browser Requirements
> The Web Speech API is **only available in Chromium-based browsers**.

| Browser | Support |
|---|:---:|
| Google Chrome 25+ | ✅ |
| Microsoft Edge 79+ | ✅ |
| Firefox | ❌ (not supported) |
| Safari | ⚡ Partial (macOS 14.4+ only) |

### Error States
If voice input fails, a descriptive error label appears below the mic button for 4 seconds:

| Error | Label Shown |
|---|---|
| Mic permission denied | *"Microphone access denied"* |
| No speech detected | *"No speech detected — try again"* |
| Network issue | *"Network error — check your connection"* |
| No mic hardware | *"No microphone found"* |

### Production / HTTPS Note
> The Web Speech API **requires a secure context (HTTPS)** in production. It works on `localhost` without HTTPS for development.

---

## Dashboard Features

All nine dashboard features are implemented and production-ready:

| # | Feature | Description |
|---|---|---|
| 1 | **Confidence Badge** | Indicates query certainty (High, Medium, Interpreted) |
| 2 | **Sample Query Chips** | Clickable example queries shown on empty state |
| 3 | **Export Chart as PNG** | Downloads current chart as a PNG file |
| 4 | **SQL Disclosure Toggle** | Reveals the generated SQL behind each answer |
| 5 | **Smart Can't-Answer** | Explains why + suggests a related answerable question |
| 6 | **Chart Title Auto-Gen** | Gemini generates a professional title per chart |
| 7 | **Voice Input** | Hands-free querying via Web Speech API |
| 8 | **Dashboard Pinning** | Pin charts to keep them highlighted in the thread |
| 9 | **Key Insights Card** | Gemini auto-generates 2–3 data insights per result |

---

*Ship fast. Ship secure. Ship QueryLens.*
