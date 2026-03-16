# QueryLens — Master Project TODO List
### NL-to-BI Dashboard · Sequential Implementation Guide

> **How to use:** Work through phases in order. Each task is a checkbox. Sub-items are implementation notes — not separate tasks. Do NOT skip a phase. Security tasks in Phase 7 must be applied during development, not retrofitted at the end.

---

## Tech Stack Reference

| Category | Technology / Package |
|---|---|
| Frontend Framework | `Next.js 14` (React 18, App Router) |
| Styling | `Tailwind CSS 3.x` + custom CSS variables |
| Charts | `Recharts 2.x` |
| Animations | `Anime.js 4.x` (npm in app) |
| Typography | Playfair Display, Source Sans 3, IBM Plex Mono (Google Fonts) |
| Backend | `Python 3.11+` · `FastAPI` |
| ASGI Server | `Uvicorn` |
| Database | `SQLite 3` (via Python sqlite3 stdlib) |
| ORM / Query Safety | No ORM — raw parameterized queries with sqlite3 |
| LLM | `Google Gemini 1.5 Flash` (google-generativeai SDK) |
| Auth | JWT (`python-jose` + `passlib[bcrypt]`) |
| Rate Limiting | `slowapi` (FastAPI middleware) |
| CORS | `fastapi.middleware.cors.CORSMiddleware` |
| Env Management | `python-dotenv` · `.env` file (never committed) |
| File Upload | `python-multipart` (FastAPI form/file) |
| Secrets Scanning | `gitleaks` (pre-commit hook) |
| CSV Parsing (FE) | `PapaParse 5.x` (browser-side CSV preview) |
| CSV Parsing (BE) | Python `csv` stdlib or `pandas 2.x` |
| Input Sanitization | `bleach 6.x` (Python) · `DOMPurify` (React, if HTML render needed) |
| Package Manager (FE) | `npm` or `pnpm` |
| Package Manager (BE) | `pip` + `requirements.txt` |
| Version Control | Git + `.gitignore` (env, secrets, `__pycache__`, `.next`, `node_modules`) |
| Linting (FE) | `ESLint` + `Prettier` |
| Linting (BE) | `ruff` or `flake8` |

---

## Phase 0 · Environment & Repository Setup

### 0.1 System Prerequisites

- [ ] Install Node.js 20 LTS — verify: `node -v`
- [ ] Install Python 3.11+ — verify: `python3 --version`
- [ ] Install Git — verify: `git --version`
- [ ] Install `gitleaks` for secrets scanning
  - `brew install gitleaks` OR download from github.com/gitleaks/gitleaks/releases
- [ ] Obtain Google Gemini API key from Google AI Studio (aistudio.google.com)
  - Keep it secret — DO NOT paste into any file that will be committed

### 0.2 Repository Initialisation

- [ ] Create a new GitHub repository (name: `querylens`) and clone it locally
- [ ] Create top-level project structure:
  ```
  /querylens
    /frontend         — Next.js app
    /backend          — FastAPI app
    /data             — BMW_Vehicle_Inventory.csv + seed script
    /docs             — problem statement, security guide (reference only)
    README.md
    .gitignore
  ```
- [ ] Write `.gitignore` — include ALL of the following:
  ```
  .env   .env.local   .env.production
  __pycache__/   *.pyc   *.pyo
  .next/   node_modules/   dist/   build/
  *.sqlite   *.db
  .DS_Store   Thumbs.db
  ```
- [ ] Set up gitleaks pre-commit hook to block accidental secret commits
  - Create `.pre-commit-config.yaml` at repo root
  - Run: `pre-commit install`
- [ ] Create `.env` file in `/backend` with placeholder structure (DO NOT fill real values yet):
  ```
  GEMINI_API_KEY=
  JWT_SECRET_KEY=
  DATABASE_PATH=./data/querylens.db
  ALLOWED_ORIGINS=http://localhost:3000
  ```
- [ ] Create `.env.example` — same keys, no real values — commit this file

---

## Phase 1 · Backend Project Setup (FastAPI)

### 1.1 Python Environment

- [x] Create virtual environment inside `/backend`:
  ```bash
  cd backend && python3 -m venv venv
  source venv/bin/activate   # Mac/Linux
  venv\Scripts\activate      # Windows
  ```
- [x] Install all backend dependencies:
  ```bash
  pip install fastapi uvicorn[standard] python-dotenv
  pip install google-generativeai
  pip install python-jose[cryptography] passlib[bcrypt]
  pip install slowapi python-multipart
  pip install pandas bleach
  pip install ruff
  ```
- [x] Freeze requirements:
  ```bash
  pip freeze > requirements.txt
  ```

### 1.2 Backend Directory Structure

- [x] Create the following file structure inside `/backend`:
  ```
  /backend
    main.py                — FastAPI app entry point
    /routers
      query.py             — /api/query endpoint
      upload.py            — /api/upload endpoint
      auth.py              — /api/auth endpoints
    /services
      gemini.py            — Gemini API wrapper
      sql_executor.py      — safe parameterized query runner
      chart_selector.py    — logic to choose chart type
      csv_loader.py        — CSV ingestion + sanitization
    /models
      schemas.py           — Pydantic response models (never expose raw DB rows)
    /db
      init_db.py           — creates SQLite DB + tables
      seed_db.py           — loads BMW CSV into DB
    /middleware
      auth_middleware.py   — JWT verification dependency
      rate_limiter.py      — slowapi config
    /utils
      sanitize.py          — input cleaning helpers
      logger.py            — structured logging (no secrets ever logged)
    .env                   — secrets (gitignored)
    .env.example           — template (committed)
    requirements.txt
  ```

---

## Phase 2 · Data Layer (SQLite + BMW Dataset)

### 2.1 Database Initialisation

- [x] Copy `BMW_Vehicle_Inventory.csv` into `/data` folder
- [x] Write `/db/init_db.py` — creates `querylens.db` and the `vehicles` table:
  - Columns: `id` (PK), `model`, `year`, `price`, `transmission`, `mileage`, `fuelType`, `tax`, `mpg`, `engineSize`
  - Always use `IF NOT EXISTS` so reruns are safe
- [x] Write `/db/seed_db.py` — reads CSV and inserts rows using parameterized `INSERT`:
  - Use `csv.DictReader` — NOT `pandas.read_csv().to_sql()` which bypasses parameterization
  - Strip and validate each value before inserting (`year` must be int, `price` must be int, etc.)
  - Log row count on completion
- [x] Run init + seed, verify with sqlite3 CLI:
  ```bash
  python db/init_db.py && python db/seed_db.py
  sqlite3 data/querylens.db "SELECT COUNT(*) FROM vehicles;"
  ```

### 2.2 Schema Description for Gemini

- [x] Write a `SCHEMA_DESCRIPTION` string (used in Gemini system prompt) that describes the table in plain English — include every column name, data type, and sample values
  - **NEVER** include real data rows in the Gemini prompt — schema description only
  - This string lives in `/services/gemini.py` as a constant

### 2.3 Safe Query Executor

- [x] Write `/services/sql_executor.py` with a single function: `execute_query(sql: str, params: tuple) -> list[dict]`
  - Opens connection with `sqlite3.connect()` — connection object is NOT global
  - ALWAYS uses `cursor.execute(sql, params)` — never string formatting or f-strings in SQL
  - Enforces SELECT-only: parse first token; raise `ValueError` if not `SELECT`
  - Returns list of dicts via `cursor.fetchall()` + `cursor.description`
  - Wraps in `try/except`; logs error without exposing SQL structure in the response
  - Closes connection in `finally` block

> **⚠️ SECURITY — AthenaGuard §2:** All LLM-generated SQL MUST be passed through `execute_query()` with parameterized placeholders. The LLM generates the SQL template; user-derived values must never be interpolated directly. Enforce SELECT-only at this layer.

---

## Phase 3 · Gemini LLM Integration

### 3.1 Gemini Service Setup

- [x] Write `/services/gemini.py` — initialise the Gemini client:
  - Load API key via: `os.environ["GEMINI_API_KEY"]` (fail fast if missing)
  - Use model: `gemini-1.5-flash`
  - Never log the API key
- [x] Write the `SYSTEM_PROMPT` constant — this is the most critical prompt engineering task:
  - Tell the model: it is a BI SQL assistant for a BMW vehicle inventory database
  - Include the full `SCHEMA_DESCRIPTION` string
  - Instruct: return ONLY valid SQLite SELECT SQL — no markdown, no explanation
  - Instruct: if the question cannot be answered from the schema, return exactly: `CANNOT_ANSWER`
  - Instruct: NEVER use `DROP`, `DELETE`, `INSERT`, `UPDATE`, `CREATE` — SELECT only
  - Instruct: parameterize user-supplied filter values using `?` placeholders, return params list
  - Include 3 few-shot examples of query → SQL mappings covering the BMW dataset
- [x] Write function: `nl_to_sql(user_query: str) -> dict` with keys: `sql`, `params`, `explanation`
  - Call Gemini with `system_prompt` + `user_query`
  - Parse response: if `CANNOT_ANSWER` → return `{"error": "cannot_answer"}`
  - Validate SQL starts with `SELECT` before returning
  - Catch and handle Gemini API errors gracefully

### 3.2 Chart Type Selector

- [x] Write `/services/chart_selector.py` — function: `select_chart(sql: str, result_data: list[dict]) -> str`
  - Logic rules (in priority order):
    - If query has time/year grouping → `"line"`
    - If query has a single categorical breakdown with counts/sums → `"bar"`
    - If query returns percentage / parts-of-whole → `"pie"`
    - If query returns 2 continuous numeric columns → `"scatter"`
    - If query returns single aggregate → `"stat_card"` (KPI card, not a chart)
    - Fallback → `"bar"`
  - Return chart type string to frontend

### 3.3 Hallucination & Error Handling

- [x] Implement hallucination guard — when Gemini returns `CANNOT_ANSWER`:
  - Backend returns HTTP 200 with JSON: `{ "type": "cannot_answer", "message": "I could not find data to answer that question from the available inventory." }`
  - Frontend renders a friendly "no data" state — never a blank screen
- [x] Implement SQL validation layer before execution:
  - Reject any SQL containing: `DROP`, `DELETE`, `INSERT`, `UPDATE`, `ALTER`, `CREATE`, `EXEC`, `PRAGMA`
  - Reject SQL longer than 2000 characters
  - Log rejected queries with reason (not the full SQL — security)

---

## Phase 4 · Backend API Endpoints (FastAPI)

### 4.1 main.py — App Bootstrap

- [x] Initialise FastAPI app in `main.py`:
  - Add `CORSMiddleware` — allow only `ALLOWED_ORIGINS` from `.env`
  - Add `slowapi` Limiter as app state
  - Include routers: `query`, `upload`, `auth`
  - Add startup event: run `init_db()` if DB does not exist
  - Add global exception handler that returns generic error messages (never stack traces)

### 4.2 Auth Router (/api/auth)

- [x] `POST /api/auth/token` — login endpoint:
  - Accepts: `username` + `password` (form data)
  - Hash check with `passlib` argon2 (never plain text comparison)
  - Rate limit: 5 attempts per 15 min per IP via slowapi
  - Return identical error message for "user not found" and "wrong password"
  - On success: generate JWT with `python-jose`, expiry 1 hour, secret from env
  - Log attempt with IP + timestamp + success/failure (never log passwords)

> **⚠️ SECURITY — AthenaGuard §5:** JWT secret must come from `JWT_SECRET_KEY` env var — never hardcoded. Token must include `exp` claim. Use HS256. Validate signature on every protected request.

### 4.3 Query Router (/api/query)

- [x] `POST /api/query` — the core endpoint:
  - Requires valid JWT (use `Depends(get_current_user)` from `auth_middleware.py`)
  - Rate limit: 30 requests per minute per user
  - Request body (Pydantic model): `{ "query": str, "session_id": str (optional) }`
  - Validate query length: max 500 characters; strip and bleach-sanitize input
  - Call `nl_to_sql()` → get sql + params
  - Call `execute_query(sql, params)`
  - Call `select_chart()` to determine chart type
  - Return Pydantic response schema: `{ chart_type, data, columns, explanation, query_echo }`
  - **NEVER return raw DB rows** — always use response schema (AthenaGuard §3)
- [x] `GET /api/query/history` — returns past queries for session:
  - Requires JWT
  - Returns last 20 queries for the `session_id`

### 4.4 Upload Router (/api/upload)

- [x] `POST /api/upload` — CSV upload endpoint (Bonus Feature):
  - Requires JWT
  - Rate limit: 5 uploads per hour per user
  - Validate: file must be `.csv` (check Content-Type AND file extension — not just one)
  - Validate: max file size 10MB
  - Sanitize column names: strip whitespace, replace spaces with underscores, alphanumeric only
  - Load CSV into a new SQLite table scoped to `session_id` (table name: `upload_{session_id}`)
  - Generate and return schema description for the uploaded data
  - Delete uploaded table on session expiry or explicit user action

### 4.5 Health Check

- [x] `GET /health` — unauthenticated, returns `{ "status": "ok" }` — for uptime monitoring

---

## Phase 5 · Frontend Project Setup (Next.js)

### 5.1 Next.js Initialisation

- [x] Scaffold Next.js 14 app inside `/frontend`:
  ```bash
  npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
  ```
- [x] Install frontend dependencies:
  ```bash
  npm install recharts animejs @types/animejs
  npm install axios
  npm install papaparse @types/papaparse
  npm install dompurify @types/dompurify
  npm install lucide-react
  ```
- [x] Add Google Fonts to `/src/app/layout.tsx`:
  - Playfair Display (weights: 400, 700)
  - Source Sans 3 (weights: 300, 400, 600)
  - IBM Plex Mono (weights: 400, 500)
- [x] Configure Tailwind with custom color palette in `tailwind.config.ts`:
  ```
  bg-cream:      #f2eee3
  bg-surface:    #ffffff
  text-ink:      #3b3c36
  accent-olive:  #778667
  accent-navy:   #3e4260
  text-muted:    #b2b49c
  ```
- [x] Create `/src/styles/globals.css` with CSS custom properties for all colors and font assignments
- [x] Create `/src/lib/api.ts` — centralised API client:
  - Base URL from `NEXT_PUBLIC_API_URL` env var
  - Attach JWT token from `localStorage` to `Authorization` header
  - Handle 401 by redirecting to login

### 5.2 Frontend Directory Structure

- [x] Create the following structure inside `/frontend/src`:
  ```
  /app
    /                  — Landing page (page.tsx)
    /dashboard         — Core query dashboard (page.tsx)
    /upload            — CSV upload page (page.tsx)
    /history           — Session history (page.tsx)
    /login             — Login page (page.tsx)
    layout.tsx         — Root layout with fonts
  /components
    /ui                — Reusable primitives
      Button.tsx, Input.tsx, Card.tsx, Badge.tsx, Spinner.tsx
    /layout
      Sidebar.tsx, QueryBar.tsx, Navbar.tsx
    /charts
      BarChart.tsx, LineChart.tsx, PieChart.tsx
      ScatterChart.tsx, StatCard.tsx, ChartRouter.tsx
    /animation
      Connector.tsx       — animated squares connector
      ParticleField.tsx   — particle burst in response panel
      PageTransition.tsx  — route change animation
    /query
      QueryInput.tsx      — bottom query bar
      QueryHistory.tsx    — left sidebar history list
      ResponsePanel.tsx   — right panel with 3-act animation
    /upload
      DropZone.tsx, CSVPreview.tsx
  /hooks
    useQuery.ts         — query submission + polling state
    useAuth.ts          — JWT storage + validation
    useHistory.ts       — session history management
  /lib
    api.ts              — API client
    chartUtils.ts       — data transformation helpers for Recharts
  ```

---

## Phase 6 · Frontend Pages & Components

### 6.1 Dashboard Page (Build First)

- [x] Build `/dashboard/page.tsx` — three-column layout:
  - Left sidebar (260px): query history list + data source indicator
  - Center (flex-1): chart display area with `ChartRouter`
  - Right panel (340px fixed): AI response + animation zone
  - Bottom (fixed): `QueryBar` always visible
- [x] Build `QueryBar.tsx` — persistent bottom input:
  - Text input with placeholder: "Ask anything about the BMW inventory..."
  - Submit on Enter or click
  - Show character count (max 500)
  - Disable during loading state
- [x] Build `ResponsePanel.tsx` — houses the 3-act animation:
  - **ACT 1 (Querying):** Show `Connector` animation + cycling status messages + `ParticleField`
    - Cycling messages: "Analysing your question...", "Generating SQL...", "Querying inventory...", "Preparing visualisation..."
  - **ACT 2 (Delivering):** 130ms pause → spread-squares animation → 160ms pause → color shift
  - **ACT 3 (Ready):** Squares fade out → AI explanation text fades in → confidence indicator
- [x] Build `Connector.tsx` — animated squares using Anime.js:
  - 3 squares in a horizontal row between database icon and response panel
  - Implement bouncing squares animation (ACT 1 — querying state)
  - Implement spread squares animation (ACT 2 — delivery signal)
  - Square colors: navy `#3e4260` at rest, olive `#778667` on delivery
  - Expose `phase` prop: `"idle" | "querying" | "delivering" | "ready"`
- [x] Build `ParticleField.tsx` — ambient particles in response panel during ACT 1:
  - 20–30 small circles, random position offsets, random opacity, loop animation
  - Colors: mix of olive and navy at 0.3–0.6 opacity
  - Particles stop and fade out on entering ACT 3
- [x] Build `ChartRouter.tsx` — renders correct chart from `chart_type` prop:
  - Accepts: `{ chart_type: string, data: any[], columns: string[] }`
  - Routes to: `BarChart`, `LineChart`, `PieChart`, `ScatterChart`, `StatCard`
  - Handles `"cannot_answer"` type → renders `CannotAnswerCard`
  - Handles loading and error states

### 6.2 Chart Components

- [x] Build `BarChart.tsx` using Recharts:
  - Uses: `BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ResponsiveContainer`
  - Primary bar color: `#4e79a7`, secondary: `#f28e2b`
  - Custom Tooltip with cream background and charcoal text
  - Animate bars on mount (`isAnimationActive` + `animationDuration=800`)
  - Include `Brush` component for panning on large datasets
- [x] Build `LineChart.tsx` using Recharts:
  - Uses: `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ReferenceLine`
  - Smooth curve: `type="monotone"` on `Line`
  - Primary line: `#4e79a7`
- [x] Build `PieChart.tsx` using Recharts:
  - Uses: `PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend`
  - Color array: `["#4e79a7","#f28e2b","#59a14f","#e15759","#76b7b2","#edc948","#b07aa1"]`
  - Show percentage labels on slices
  - Donut variant (`innerRadius=60`) as default for cleaner CXO look
- [x] Build `ScatterChart.tsx` using Recharts:
  - Uses: `ScatterChart`, `Scatter`, `XAxis`, `YAxis`, `ZAxis`, `Tooltip`
- [x] Build `StatCard.tsx` — single KPI display (no chart):
  - Large number in navy, label in muted sage, unit if applicable
  - Animate number counting up on mount

### 6.3 Landing Page

- [x] Build `/` (landing) `page.tsx`:
  - Hero: "Ask your data anything." headline + subtext
  - CTA: "Start Querying" button → `/dashboard`
  - 3 demo query cards showing sample BMW inventory questions with preview thumbnails
  - Subtle background texture using CSS (dot grid pattern on cream)
  - Apply `PageTransition` animation on route change

### 6.4 CSV Upload Page (Bonus)

- [x] Build `/upload/page.tsx`:
  - `DropZone.tsx`: drag-and-drop area, dashed olive border, accepts `.csv` only
  - Client-side validation: file extension + MIME type
  - `CSVPreview.tsx`: show first 5 rows of CSV using PapaParse (client-side preview before upload)
  - "Start Querying" button → `POST` to `/api/upload` → redirect to `/dashboard`
- [x] Show upload progress and sanitized column names after successful upload

### 6.5 History Page

- [x] Build `/history/page.tsx`:
  - Timeline list of past queries in current session
  - Each item: query text, timestamp, chart type badge, chart thumbnail
  - Click to re-load a past result into the dashboard
  - Follow-up chat thread view for any query with chat history

### 6.6 Follow-up Chat (Bonus)

- [x] Add follow-up chat to `ResponsePanel.tsx` and history page:
  - After initial result: show text input "Refine this query..."
  - Append user message to chat thread, re-submit with context window of last 3 exchanges
  - Maintain `session_id` across follow-up calls
  - Backend must include chat history in Gemini prompt as prior context

---

## Phase 7 · Security Hardening (AthenaGuard)

> **⚠️ CRITICAL:** Every item in this phase maps directly to the AthenaGuard Security Guide. These are not optional polish — they are evaluation criteria and fundamental protections for a system that executes AI-generated SQL.

### 7.1 SQL Injection Prevention (AthenaGuard §2)

- [x] Audit every SQL call in the codebase — verify zero instances of f-string or `+` concatenation in SQL
- [x] Add a test: pass `"1 OR 1=1; DROP TABLE vehicles; --"` as user input → confirm safe rejection
- [x] Ensure `execute_query()` rejects any SQL not starting with `SELECT`

### 7.2 API Security (AthenaGuard §3)

- [x] Confirm every endpoint except `/health` and `/api/auth/token` requires a valid JWT
- [x] Verify `slowapi` rate limits are active on all routes
- [x] Verify all responses use Pydantic schemas — no raw dict dumps
- [x] Confirm error messages never reveal internal details (no stack traces, no SQL in errors)

### 7.3 XSS Prevention (AthenaGuard §4)

- [x] Audit all React components — confirm no `dangerouslySetInnerHTML` without `DOMPurify`
- [x] Sanitize AI-generated explanation text with `bleach` on the backend before sending to frontend
- [x] Add Content-Security-Policy header in Next.js `next.config.mjs`:
  ```
  default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;
  ```

### 7.4 Authentication (AthenaGuard §5)

- [x] Confirm JWT token includes `exp` claim (1 hour)
- [x] Confirm JWT secret is loaded from env — never hardcoded
- [x] Confirm login endpoint returns identical error for wrong user and wrong password
- [x] Confirm login is rate-limited at IP level

### 7.5 Secrets Management (AthenaGuard §6)

- [x] Run gitleaks scan against full commit history:
  ```bash
  gitleaks detect --source . --verbose
  ```
- [x] Confirm `.env` is in `.gitignore` and was never committed:
  ```bash
  git log --all --full-history -- .env
  ```
- [x] Confirm all env vars loaded via `os.environ["KEY"]` (raises error if missing) — not `os.environ.get()`

### 7.6 CSV Upload Security

- [x] Validate file type server-side (Content-Type header + magic bytes check) — not filename alone
- [x] Enforce 10MB file size limit
- [x] Sanitize all column names: strip whitespace, replace special chars, length limit 64 chars
- [x] Never send raw uploaded data to Gemini — schema description only

### 7.7 AI-Specific Risks (AthenaGuard §7)

- [x] Verify all packages installed are from official registries — cross-check PyPI/npm for each
- [x] Verify no credentials or real data are included in Gemini system prompt
- [x] Add hallucination handling — `CANNOT_ANSWER` response renders graceful UI state

---

## Phase 8 · Integration, Testing & Polish

### 8.1 End-to-End Integration

- [x] Start backend: `uvicorn main:app --reload --port 8000`
- [x] Start frontend: `npm run dev` (port 3000)
- [x] Test the full pipeline with these 3 progressively complex queries (required by problem statement):
  - **Query 1 (Simple):** "What is the average price of all BMW vehicles?"
    - Expected: `StatCard` with a single number
  - **Query 2 (Medium):** "Show me the average price by fuel type as a bar chart"
    - Expected: `BarChart` with `fuelType` on X axis, avg price on Y axis
  - **Query 3 (Complex):** "What is the trend of average mileage over the years for diesel automatic vehicles?"
    - Expected: `LineChart` with year on X axis, avg mileage on Y
- [x] Test ambiguous/vague query handling:
  - "Just show me something interesting" → should return `cannot_answer` or ask for clarification
  - "DELETE everything" → should be blocked at SQL validation layer

### 8.2 Accuracy Checklist (40-point criterion)

- [x] Verify correct SQL is generated for each of the 3 demo queries (check query logs)
- [x] Verify chart type selection matches the query intent for each demo
- [x] Verify hallucination guard triggers for out-of-scope questions

### 8.3 UX Polish (30-point criterion)

- [x] Add loading skeleton on chart area while querying (not just a spinner)
- [x] Ensure Recharts tooltips show formatted numbers (commas, currency symbols where relevant)
- [x] Test all chart components at mobile viewport (min 375px wide)
- [x] Verify 3-act animation flow works smoothly end-to-end at normal network speed
- [x] Add empty-state illustration for dashboard before first query is made
- [x] Add keyboard shortcut: `Cmd+K` / `Ctrl+K` focuses query bar from anywhere

### 8.4 Presentation Preparation (10-minute demo)

- [x] Prepare the 3 demo queries (above) to run live — have backup screenshots in case of network issues
- [x] Prepare a 4th query demonstrating follow-up chat: refine a previous result
- [x] Prepare a 5th query for CSV upload demo: upload a custom CSV and query it
- [x] Write a one-paragraph architecture overview explaining the text → LLM → SQL → chart pipeline
- [x] Be ready to show the Gemini system prompt live — explain your few-shot examples

### 8.5 GitHub Repository Cleanup

- [x] Write `README.md` with: project description, setup instructions, env var list, architecture diagram (text-based is fine)
- [x] Run final gitleaks scan before making repo public
- [x] Ensure `.env.example` is committed and `.env` is NOT in any commit
- [x] Tag final submission commit: `git tag v1.0.0-submission`

---

## Final Submission Checklist

| Done | Requirement | Points |
|---|---|:---:|
| [ ] | Working, deployable web app prototype | — |
| [ ] | Public GitHub repository link | — |
| [ ] | 3 demo queries answered correctly in live demo | 40 |
| [ ] | Correct chart types selected per query intent | 40 |
| [ ] | Graceful handling of vague/ambiguous queries | 40 |
| [ ] | Visually appealing, clean, modern dashboard | 30 |
| [ ] | Interactive charts with tooltips, hover states | 30 |
| [ ] | Intuitive text input flow + loading state | 30 |
| [ ] | Robust NL → LLM → DB → Frontend pipeline | 30 |
| [ ] | Clever system prompts / few-shot prompt engineering | 30 |
| [ ] | Hallucination handling — honest "cannot answer" | 30 |
| [ ] | **BONUS:** Follow-up chat / chat with dashboard | +10 |
| [ ] | **BONUS:** CSV upload and instant querying | +20 |

---

*Ship fast. Ship secure. Ship QueryLens.*
