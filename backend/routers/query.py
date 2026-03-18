"""
Query router — /api/query
AthenaGuard §2: All SQL via execute_query() with parameterized placeholders.
AthenaGuard §3: Requires valid JWT; rate-limited; Pydantic response schemas only.
AthenaGuard §4: User input sanitized with bleach before any processing.
"""

import sqlite3
import os
import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status

from middleware.auth_middleware import get_current_user, TokenData
from middleware.rate_limiter import limiter
from models.schemas import (
    QueryRequest,
    QueryResponse,
    CannotAnswerResponse,
    HistoryResponse,
    HistoryItem,
)
from services.gemini import (
    nl_to_sql,
    generate_chart_title,
    generate_key_insights,
    generate_cannot_answer_suggestion,
)
from services.sql_executor import execute_query, validate_sql
from services.chart_selector import select_chart
from services.csv_loader import get_upload_schema
from utils.sanitize import validate_query_length
from utils.logger import get_logger

router = APIRouter(prefix="/api/query", tags=["query"])
logger = get_logger(__name__)


def _record_history(
    session_id: str, user_query: str, chart_type: str,
    generated_sql: str = "", explanation: str = ""
) -> None:
    """Persist a query to the history table (best-effort, never raises)."""
    try:
        try:
            db_path = os.environ["DATABASE_PATH"]
            if not db_path:
                raise KeyError
        except KeyError:
            return
        conn = sqlite3.connect(db_path)
        try:
            conn.execute(
                """
                INSERT INTO query_history
                    (session_id, user_query, chart_type, generated_sql, explanation, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id or "anonymous",
                    user_query[:500],
                    chart_type,
                    generated_sql[:2000],
                    explanation[:500],
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            conn.commit()
        finally:
            conn.close()
    except Exception:
        logger.warning("Failed to record query history (non-critical)")


def _load_conversation_context(session_id: str) -> list[dict]:
    """Load the last 5 conversation turns for a session (for follow-up context)."""
    if not session_id:
        return []
    try:
        db_path = os.environ.get("DATABASE_PATH", "")
        if not db_path:
            return []
        conn = sqlite3.connect(db_path)
        try:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT user_query, generated_sql FROM query_history "
                "WHERE session_id = ? AND generated_sql != '' "
                "ORDER BY created_at DESC LIMIT 5",
                (session_id,),
            )
            rows = cursor.fetchall()
            # Reverse so oldest is first (chronological order)
            return [
                {"question": row["user_query"], "sql": row["generated_sql"]}
                for row in reversed(rows)
            ]
        finally:
            conn.close()
    except Exception:
        logger.warning("Failed to load conversation context (non-critical)")
        return []


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

    # -- 2. NL → SQL via Gemini (use uploaded schema + conversation context) --
    schema_override = get_upload_schema(body.session_id or "")
    conversation_context = _load_conversation_context(body.session_id or "")
    if schema_override:
        logger.info("Using uploaded table schema for session=%s", body.session_id)
    if conversation_context:
        logger.info("Loaded %d conversation turns for follow-up context", len(conversation_context))
    result = nl_to_sql(
        clean_query,
        schema_override=schema_override,
        conversation_history=conversation_context,
    )

    if "error" in result:
        if result["error"] == "cannot_answer":
            _record_history(body.session_id or "", clean_query, "cannot_answer")
            # Feature 5: Smart cannot_answer suggestion
            active_schema = schema_override or ""
            suggestion = generate_cannot_answer_suggestion(clean_query, active_schema)
            return CannotAnswerResponse(suggestion=suggestion)
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
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred. Please try again.",
        )

    if not data:
        return CannotAnswerResponse()

    # -- 5. Select chart type --
    columns = list(data[0].keys()) if data else []
    chart_type = select_chart(sql, data)

    # -- 6. Determine confidence level --
    # "interpreted" only when context was actually used (SQL has WHERE clause
    # hinting a filter derived from a previous turn). "high" otherwise.
    context_was_used = bool(conversation_context) and "where" in sql.lower()
    confidence_level = "interpreted" if context_was_used else "high"

    # -- 7. Run chart title, key insights, and history write CONCURRENTLY --
    # Each Gemini call is ~1-2s; running in parallel cuts total latency significantly.
    # asyncio.get_running_loop() is the correct API inside an async function (3.10+).
    loop = asyncio.get_running_loop()
    chart_title, key_insights, _ = await asyncio.gather(
        loop.run_in_executor(None, generate_chart_title, clean_query, sql),
        loop.run_in_executor(None, generate_key_insights, clean_query, data, sql),
        loop.run_in_executor(None, _record_history, body.session_id or "", clean_query, chart_type, sql, explanation),
    )

    # -- 9. Return Pydantic response (AthenaGuard §3: never raw rows) --
    return QueryResponse(
        chart_type=chart_type,
        data=data,
        columns=columns,
        explanation=explanation,
        query_echo=clean_query,
        generated_sql=sql,
        confidence_level=confidence_level,
        chart_title=chart_title,
        key_insights=key_insights,
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
        try:
            db_path = os.environ["DATABASE_PATH"]
            if not db_path:
                raise KeyError
        except KeyError:
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
