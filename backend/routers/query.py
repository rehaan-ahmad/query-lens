"""
Query router — /api/query
AthenaGuard §2: All SQL via execute_query() with parameterized placeholders.
AthenaGuard §3: Requires valid JWT; rate-limited; Pydantic response schemas only.
AthenaGuard §4: User input sanitized with bleach before any processing.
"""

import sqlite3
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi.errors import RateLimitExceeded

from middleware.auth_middleware import get_current_user, TokenData
from middleware.rate_limiter import limiter
from models.schemas import (
    QueryRequest,
    QueryResponse,
    CannotAnswerResponse,
    HistoryResponse,
    HistoryItem,
)
from services.gemini import nl_to_sql
from services.sql_executor import execute_query, validate_sql
from services.chart_selector import select_chart
from utils.sanitize import validate_query_length
from utils.logger import get_logger

router = APIRouter(prefix="/api/query", tags=["query"])
logger = get_logger(__name__)


def _record_history(session_id: str, user_query: str, chart_type: str) -> None:
    """Persist a query to the history table (best-effort, never raises)."""
    try:
        db_path = os.environ.get("DATABASE_PATH", "")
        if not db_path:
            return
        conn = sqlite3.connect(db_path)
        try:
            conn.execute(
                """
                INSERT INTO query_history (session_id, user_query, chart_type, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (
                    session_id or "anonymous",
                    user_query[:500],
                    chart_type,
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            conn.commit()
        finally:
            conn.close()
    except Exception:
        logger.warning("Failed to record query history (non-critical)")


@router.post(
    "/",
    response_model=QueryResponse | CannotAnswerResponse,
    status_code=status.HTTP_200_OK,
)
@limiter.limit("30/minute")  # AthenaGuard §3: 30 req/min per user
async def submit_query(
    request: Request,
    body: QueryRequest,
    current_user: TokenData = Depends(get_current_user),  # AthenaGuard §3: JWT required
) -> QueryResponse | CannotAnswerResponse:
    """
    Core endpoint: NL query → Gemini SQL → SQLite → chart type → response.
    AthenaGuard §3: Returns Pydantic schema only — never raw DB rows.
    """
    # -- 1. Sanitize and validate input (AthenaGuard §4) --
    try:
        clean_query = validate_query_length(body.query)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    logger.info(
        "QUERY | user=%s | session=%s | length=%d",
        current_user.username,
        body.session_id or "none",
        len(clean_query),
    )

    # -- 2. NL → SQL via Gemini --
    result = nl_to_sql(clean_query)

    if "error" in result:
        if result["error"] == "cannot_answer":
            _record_history(body.session_id or "", clean_query, "cannot_answer")
            return CannotAnswerResponse()
        # api_error or other
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=result.get("message", "AI service temporarily unavailable."),
        )

    sql: str = result["sql"]
    params: tuple = result["params"]
    explanation: str = result.get("explanation", "")

    # -- 3. Additional SQL validation before execution (AthenaGuard §2/§3) --
    try:
        validate_sql(sql)
    except ValueError as exc:
        logger.warning("SQL validation failed after Gemini response: %s", exc)
        return CannotAnswerResponse()

    # -- 4. Execute query --
    try:
        data = execute_query(sql, params)
    except ValueError:
        return CannotAnswerResponse()
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred. Please try again.",
        )

    if not data:
        return CannotAnswerResponse()

    # -- 5. Select chart type --
    columns = list(data[0].keys()) if data else []
    chart_type = select_chart(sql, data)

    # -- 6. Record to history --
    _record_history(body.session_id or "", clean_query, chart_type)

    # -- 7. Return Pydantic response (AthenaGuard §3: never raw rows) --
    return QueryResponse(
        chart_type=chart_type,
        data=data,
        columns=columns,
        explanation=explanation,
        query_echo=clean_query,  # Echoes sanitized user query, not SQL
    )


@router.get("/history", response_model=HistoryResponse)
@limiter.limit("60/minute")
async def get_history(
    request: Request,
    session_id: str = "",
    current_user: TokenData = Depends(get_current_user),  # AthenaGuard §3
) -> HistoryResponse:
    """Return the last 20 queries for a given session."""
    if not session_id:
        return HistoryResponse(items=[])

    try:
        db_path = os.environ.get("DATABASE_PATH", "")
        if not db_path:
            return HistoryResponse(items=[])

        # Parameterized query (AthenaGuard §2)
        rows = execute_query(
            "SELECT id, session_id, user_query, chart_type, created_at "
            "FROM query_history WHERE session_id = ? "
            "ORDER BY created_at DESC LIMIT 20",
            (session_id,),
        )

        items = [
            HistoryItem(
                id=row["id"],
                session_id=row["session_id"],
                user_query=row["user_query"],
                chart_type=row["chart_type"],
                created_at=row["created_at"],
            )
            for row in rows
        ]
        return HistoryResponse(items=items)

    except Exception:
        logger.warning("Failed to retrieve query history")
        return HistoryResponse(items=[])
