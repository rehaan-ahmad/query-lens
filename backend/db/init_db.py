"""
Database initialization script.
Creates the SQLite database and the `vehicles` table if they do not exist.
Safe to re-run (uses IF NOT EXISTS).
Run: python db/init_db.py
"""

import os
import sqlite3
import sys

# Allow running from /backend root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from utils.logger import get_logger

load_dotenv()
logger = get_logger(__name__)


def init_db() -> None:
    try:
        db_path = os.environ["DATABASE_PATH"]
        if not db_path:
            raise KeyError
    except KeyError:
        raise RuntimeError("DATABASE_PATH environment variable is not set or is empty.")

    # Ensure parent directory exists
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

    conn = sqlite3.connect(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vehicles (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                model        TEXT    NOT NULL,
                year         INTEGER NOT NULL,
                price        INTEGER NOT NULL,
                transmission TEXT    NOT NULL,
                mileage      INTEGER NOT NULL,
                fuelType     TEXT    NOT NULL,
                tax          INTEGER,
                mpg          REAL,
                engineSize   REAL
            )
        """)

        # Query history table for session tracking
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS query_history (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id   TEXT    NOT NULL,
                user_query   TEXT    NOT NULL,
                chart_type   TEXT    NOT NULL,
                created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
            )
        """)

        conn.commit()
        logger.info("Database initialised at: %s", db_path)
    finally:
        conn.close()


if __name__ == "__main__":
    init_db()
    print("✅ Database initialised successfully.")
