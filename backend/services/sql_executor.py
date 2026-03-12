"""
Safe parameterized SQL executor.
AthenaGuard §2 (SQL Injection Prevention):
- NEVER use f-strings or string concatenation for SQL
- ALWAYS use cursor.execute(sql, params) with ? placeholders
- Enforce SELECT-only: any non-SELECT statement is rejected
- Connection is NOT global — opened and closed per call
- Error details are logged internally but NEVER exposed in responses
"""

import sqlite3
import os
import re
from typing import Any

from utils.logger import get_logger

logger = get_logger(__name__)

# SQL keywords that are unconditionally forbidden (AthenaGuard §3)
FORBIDDEN_KEYWORDS = re.compile(
    r"\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|EXEC|PRAGMA|TRUNCATE|REPLACE|ATTACH|DETACH)\b",
    re.IGNORECASE,
)

MAX_SQL_LENGTH = 2000


def _get_db_path() -> str:
    """Load database path from environment. Fail fast if not set."""
    path = os.environ.get("DATABASE_PATH", "")
    if not path:
        raise RuntimeError("DATABASE_PATH environment variable is not set.")
    return path


def validate_sql(sql: str) -> None:
    """
    Validate SQL before execution.
    AthenaGuard §2 / §3:
    - Reject anything longer than MAX_SQL_LENGTH
    - Reject if first meaningful token is not SELECT
    - Reject if any forbidden keyword appears anywhere
    Raises ValueError with a safe (non-revealing) message on failure.
    """
    if len(sql) > MAX_SQL_LENGTH:
        logger.warning("Rejected SQL: exceeds max length (%d chars)", len(sql))
        raise ValueError("Generated query is too long.")

    # Check first meaningful token
    first_token = sql.strip().split()[0].upper() if sql.strip() else ""
    if first_token != "SELECT":
        logger.warning("Rejected SQL: first token is '%s', not SELECT", first_token)
        raise ValueError("Only SELECT queries are permitted.")

    # Scan for forbidden keywords anywhere in the statement
    match = FORBIDDEN_KEYWORDS.search(sql)
    if match:
        logger.warning(
            "Rejected SQL: forbidden keyword detected (not logged for security)"
        )
        raise ValueError("Query contains disallowed SQL operations.")


def execute_query(sql: str, params: tuple = ()) -> list[dict[str, Any]]:
    """
    Execute a validated, parameterized SELECT query and return rows as dicts.

    Parameters
    ----------
    sql    : The SQL template with `?` placeholders — never build via f-string.
    params : Tuple of parameter values bound by sqlite3 (never interpolated).

    Returns
    -------
    list[dict] — one dict per row, keyed by column name.

    Raises
    ------
    ValueError  — on SQL validation failure (safe message, no SQL details)
    RuntimeError — on unexpected database error (safe message, no SQL details)
    """
    # Validate before touching the DB (AthenaGuard §2)
    validate_sql(sql)

    conn: sqlite3.Connection | None = None
    try:
        db_path = _get_db_path()
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row  # Enable column-name access
        cursor = conn.cursor()

        # ALWAYS parameterized — never string interpolation (AthenaGuard §2)
        cursor.execute(sql, params)
        rows = cursor.fetchall()

        # Convert sqlite3.Row objects to plain dicts
        return [dict(row) for row in rows]

    except ValueError:
        # Re-raise validation errors as-is (already safe messages)
        raise
    except sqlite3.Error as exc:
        # Log the technical details internally, NEVER surface them
        logger.error("Database error during query execution: %s", type(exc).__name__)
        raise RuntimeError("A database error occurred. Please try again.") from exc
    finally:
        if conn:
            conn.close()
