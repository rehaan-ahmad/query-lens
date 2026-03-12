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
   [Gemini 1.5 Flash] — NL → SQL (parameterized)
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
| Frontend | Next.js 14, React 18, Tailwind CSS 3, Recharts, Anime.js |
| Backend | Python 3.11+, FastAPI, Uvicorn |
| LLM | Google Gemini 2.5 Flash |
| Database | SQLite 3 (parameterized queries only) |
| Auth | JWT (python-jose + passlib) |
| Security | slowapi rate limiting, bleach sanitization, gitleaks |

---

## Project Structure

```
/querylens
  /frontend         — Next.js app (React 18, Tailwind, Recharts, Anime.js)
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

---

*Ship fast. Ship secure. Ship QueryLens.*
