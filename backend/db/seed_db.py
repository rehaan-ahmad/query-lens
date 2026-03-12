"""
Database seed script — loads BMW_Vehicle_Inventory.csv into the vehicles table.
AthenaGuard §2: Uses parameterized INSERT with csv.DictReader (NOT pandas.to_sql).
Validates each row value before inserting.
Run: python db/seed_db.py
"""

import csv
import os
import sqlite3
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from utils.logger import get_logger

load_dotenv()
logger = get_logger(__name__)

CSV_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data",
    "BMW_Vehicle_Inventory.csv",
)


def _parse_int(value: str, field: str, row_num: int) -> int:
    """Parse an integer field; log and skip row on failure."""
    try:
        return int(str(value).strip().replace(",", ""))
    except (ValueError, TypeError):
        raise ValueError(f"Row {row_num}: invalid integer for {field}='{value}'")


def _parse_float(value: str, field: str, row_num: int) -> float:
    """Parse a float field; log and skip row on failure."""
    try:
        return float(str(value).strip().replace(",", ""))
    except (ValueError, TypeError):
        raise ValueError(f"Row {row_num}: invalid float for {field}='{value}'")


def seed_db() -> None:
    db_path = os.environ.get("DATABASE_PATH", "")
    if not db_path:
        raise RuntimeError("DATABASE_PATH environment variable is not set.")

    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"BMW CSV not found at: {CSV_PATH}")

    conn = sqlite3.connect(db_path)
    inserted = 0
    skipped = 0

    try:
        cursor = conn.cursor()

        # Clear existing data before re-seeding (idempotent)
        cursor.execute("DELETE FROM vehicles")
        logger.info("Cleared existing vehicle records.")

        with open(CSV_PATH, newline="", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)

            for row_num, row in enumerate(reader, start=1):
                try:
                    # Strip whitespace from all values
                    row = {k: (v.strip() if v else "") for k, v in row.items()}

                    model        = str(row.get("model", "")).strip()
                    year         = _parse_int(row.get("year", ""), "year", row_num)
                    price        = _parse_int(row.get("price", ""), "price", row_num)
                    transmission = str(row.get("transmission", "")).strip()
                    mileage      = _parse_int(row.get("mileage", ""), "mileage", row_num)
                    fuel_type    = str(row.get("fuelType", "")).strip()
                    tax_val      = row.get("tax", "0")
                    tax          = _parse_int(tax_val if tax_val else "0", "tax", row_num)
                    mpg_val      = row.get("mpg", "0")
                    mpg          = _parse_float(mpg_val if mpg_val else "0", "mpg", row_num)
                    eng_val      = row.get("engineSize", "0")
                    engine_size  = _parse_float(eng_val if eng_val else "0", "engineSize", row_num)

                    if not model or not transmission or not fuel_type:
                        raise ValueError(f"Row {row_num}: required text field is empty")

                    # Parameterized INSERT — AthenaGuard §2
                    cursor.execute(
                        """
                        INSERT INTO vehicles
                            (model, year, price, transmission, mileage, fuelType, tax, mpg, engineSize)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (model, year, price, transmission, mileage, fuel_type, tax, mpg, engine_size),
                    )
                    inserted += 1

                except ValueError as exc:
                    logger.warning("Skipping row %d: %s", row_num, exc)
                    skipped += 1

        conn.commit()
        logger.info(
            "Seeding complete — inserted: %d, skipped: %d", inserted, skipped
        )

    finally:
        conn.close()


if __name__ == "__main__":
    seed_db()
    print("✅ Seed complete.")
