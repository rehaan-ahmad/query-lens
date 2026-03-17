# How to Run QueryLens Locally

This guide provides the exact terminal commands required to run the QueryLens backend and frontend on your local development environment.

## 1. Backend Setup (FastAPI)

Open a terminal, navigate to the **backend** folder, and follow these steps:

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create a virtual environment
python3 -m venv venv

# 3. Activate the virtual environment
# On Linux / macOS:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Environment Variables
# Create a .env file locally (based on .env.example if available)
# Ensure the following keys are set:
# GEMINI_API_KEY="your-gemini-key"
# JWT_SECRET_KEY="your-secret-key"
# DATABASE_PATH="db/querylens.db"

# 6. Initialize the database (Creates the schema)
python db/init_db.py

# 7. Seed the database with the CSV inventory data
python db/seed_db.py

# 8. Start the FastAPI development server
uvicorn main:app --reload --port 8000
```
The backend will now be running at `http://localhost:8000` (API documentation at `/docs`).

---

## 2. Frontend Setup (Next.js)

Open a **new, separate terminal tab**, navigate to the **frontend** folder, and run:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install Node modules
npm install

# 3. Environment Variables
# Create a .env.local file. Ensure it contains:
# NEXT_PUBLIC_API_URL="http://localhost:8000"

# 4. Start the Next.js development server
npm run dev
```
The frontend will now be running at `http://localhost:3000`.

### Verifying Successful Setup
1. Navigate to `http://localhost:3000` in your web browser.
2. Sign in with the default credentials (`admin` / `querylens2024`).
3. Try querying: "What is the average price of a BMW?" to ensure the frontend securely communicates with the backend and the Gemini API.
4. Try toggling the **Light/Dark Mode** switch in the top right header to see the new glassmorphism theme!
