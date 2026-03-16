"""
FastAPI application entry point.
AthenaGuard §3:
- CORSMiddleware restricted to ALLOWED_ORIGINS from env
- slowapi rate limiter attached as app state
- All protected routes require JWT (enforced in routers via Depends)
- Global exception handler returns generic messages (no stack traces)
AthenaGuard §6: ALLOWED_ORIGINS loaded from env — never hardcoded.
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from db.init_db import init_db
from middleware.rate_limiter import limiter
from models.schemas import HealthResponse, ErrorResponse
from routers import auth, query, upload
from utils.logger import get_logger

# Load environment variables from .env (if present)
load_dotenv()

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Startup / shutdown lifecycle
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run DB initialisation on startup."""
    logger.info("QueryLens backend starting up...")
    try:
        init_db()
        logger.info("Database ready.")
    except Exception as exc:
        logger.error("Failed to initialise database: %s", type(exc).__name__)
        raise
    yield
    logger.info("QueryLens backend shutting down.")


# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------

app = FastAPI(
    title="QueryLens API",
    description="NL → SQL → BI Dashboard backend",
    version="1.0.0",
    docs_url="/docs",         # Swagger UI — disable in production
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Rate limiter (AthenaGuard §3)
# ---------------------------------------------------------------------------

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# CORS (AthenaGuard §3 / §6)
# Load allowed origins from env — fail to a safe default if not set.
# ---------------------------------------------------------------------------

try:
    _raw_origins = os.environ["ALLOWED_ORIGINS"]
except KeyError:
    _raw_origins = "http://localhost:3000"
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

# ---------------------------------------------------------------------------
# Global exception handler (AthenaGuard §3: never expose stack traces)
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Log the full exception internally for debugging
    logger.error(
        "Unhandled exception on %s %s: %s",
        request.method,
        request.url.path,
        type(exc).__name__,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again."},
    )

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth.router)
app.include_router(query.router)
app.include_router(upload.router)

# ---------------------------------------------------------------------------
# Health check (unauthenticated — AthenaGuard §3: only this + /api/auth/token)
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check() -> HealthResponse:
    """Unauthenticated health check for uptime monitoring."""
    return HealthResponse(status="ok")
