"""
Input sanitization helpers.
AthenaGuard §4 (XSS): Sanitize all user-supplied text with bleach before
storing or returning to the frontend.
"""

import re

import bleach
from utils.logger import get_logger

logger = get_logger(__name__)

# Only these tags are allowed in any rich-text field (very restrictive)
ALLOWED_TAGS: list[str] = []  # No HTML allowed — plain text only
ALLOWED_ATTRS: dict = {}

# Maximum character length for a user query
MAX_QUERY_LENGTH = 500


def sanitize_text(text: str) -> str:
    """
    Strip all HTML tags and return plain text.
    AthenaGuard §4: Never trust user input for HTML rendering.
    """
    if not isinstance(text, str):
        return ""
    cleaned = bleach.clean(text, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, strip=True)
    return cleaned.strip()


def sanitize_column_name(name: str) -> str:
    """
    Sanitize a CSV column name for use as a SQLite column.
    - Strip whitespace
    - Replace spaces and special chars with underscores
    - Alphanumeric + underscore only
    - Max 64 characters
    AthenaGuard §7 (CSV Upload Security)
    """
    name = name.strip()
    name = re.sub(r"[^a-zA-Z0-9_]", "_", name)
    name = re.sub(r"_+", "_", name)  # Collapse repeated underscores
    name = name[:64]
    return name or "column"


def validate_query_length(query: str) -> str:
    """
    Raise ValueError if query exceeds MAX_QUERY_LENGTH.
    Returns the sanitized query on success.
    """
    cleaned = sanitize_text(query)
    if len(cleaned) == 0:
        raise ValueError("Query cannot be empty.")
    if len(cleaned) > MAX_QUERY_LENGTH:
        raise ValueError(
            f"Query exceeds maximum length of {MAX_QUERY_LENGTH} characters."
        )
    return cleaned
