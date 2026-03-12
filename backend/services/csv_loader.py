"""
CSV ingestion and sanitization service.
AthenaGuard §7 (CSV Upload Security):
- Column names sanitized (alphanumeric + underscore only, max 64 chars)
- Data loaded via parameterized INSERT (not pandas.to_sql)
- Schema description generated WITHOUT including real data values
"""

import csv
import io
import sqlite3
import os
import re

from utils.logger import get_logger
from utils.sanitize import sanitize_column_name

logger = get_logger(__name__)

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def _get_db_path() -> str:
    path = os.environ.get("DATABASE_PATH", "")
    if not path:
        raise RuntimeError("DATABASE_PATH environment variable is not set.")
    return path


def load_csv_to_table(
    file_bytes: bytes,
    session_id: str,
) -> dict:
    """
    Parse a CSV file and load it into a session-scoped SQLite table.

    Parameters
    ----------
    file_bytes  : Raw bytes of the uploaded CSV file.
    session_id  : Unique session identifier — table name will be upload_{session_id}.

    Returns
    -------
    dict with keys: table_name, row_count, columns, schema_description
    """
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise ValueError("File exceeds the 10 MB size limit.")

    # Decode and parse CSV
    text = file_bytes.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))

    if reader.fieldnames is None:
        raise ValueError("CSV file has no headers.")

    # Sanitize column names (AthenaGuard §7)
    raw_columns = list(reader.fieldnames)
    sanitized_columns = [sanitize_column_name(c) for c in raw_columns]

    # Ensure unique column names after sanitization
    seen: dict[str, int] = {}
    unique_columns = []
    for col in sanitized_columns:
        if col in seen:
            seen[col] += 1
            unique_columns.append(f"{col}_{seen[col]}")
        else:
            seen[col] = 0
            unique_columns.append(col)

    # Build safe table name (session_id already validated by endpoint)
    safe_session = re.sub(r"[^a-zA-Z0-9_]", "_", session_id)[:32]
    table_name = f"upload_{safe_session}"

    # Load all rows (memory is acceptable for ≤10 MB files)
    rows = list(reader)
    row_count = len(rows)

    if row_count == 0:
        raise ValueError("CSV file contains no data rows.")

    db_path = _get_db_path()
    conn = sqlite3.connect(db_path)
    try:
        cursor = conn.cursor()

        # Drop existing table for this session (idempotent)
        cursor.execute(f"DROP TABLE IF EXISTS {table_name}")  # noqa: S608 — table name sanitized above

        # Create table with TEXT columns (safe default)
        col_defs = ", ".join(f'"{col}" TEXT' for col in unique_columns)
        cursor.execute(f"CREATE TABLE {table_name} ({col_defs})")  # noqa: S608

        # Insert rows via parameterized INSERT (AthenaGuard §2)
        placeholders = ", ".join("?" for _ in unique_columns)
        insert_sql = f'INSERT INTO {table_name} VALUES ({placeholders})'  # noqa: S608
        for row in rows:
            values = tuple(row.get(raw_col, "") for raw_col in raw_columns)
            cursor.execute(insert_sql, values)

        conn.commit()
        logger.info(
            "CSV loaded: table=%s, rows=%d, cols=%d",
            table_name, row_count, len(unique_columns),
        )
    finally:
        conn.close()

    schema_description = _build_schema_description(table_name, unique_columns)

    return {
        "table_name": table_name,
        "row_count": row_count,
        "columns": unique_columns,
        "schema_description": schema_description,
    }


def _build_schema_description(table_name: str, columns: list[str]) -> str:
    """
    Build a plain-English schema description for the uploaded table.
    AthenaGuard §7: NEVER include real data values — column names only.
    """
    col_list = "\n".join(f"  - {col}  TEXT" for col in columns)
    return (
        f"Table name: {table_name}\n"
        f"Columns ({len(columns)} total):\n{col_list}\n"
    )


def drop_upload_table(session_id: str) -> None:
    """Remove a session-scoped upload table (called on session expiry)."""
    safe_session = re.sub(r"[^a-zA-Z0-9_]", "_", session_id)[:32]
    table_name = f"upload_{safe_session}"
    db_path = _get_db_path()
    conn = sqlite3.connect(db_path)
    try:
        conn.execute(f"DROP TABLE IF EXISTS {table_name}")  # noqa: S608
        conn.commit()
        logger.info("Dropped upload table: %s", table_name)
    finally:
        conn.close()
