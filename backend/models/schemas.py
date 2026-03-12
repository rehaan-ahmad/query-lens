"""
Pydantic response models.
AthenaGuard §3: NEVER expose raw DB rows — always use these schemas.
All responses go through these models before reaching the client.
"""

from typing import Any, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


# ---------------------------------------------------------------------------
# Query
# ---------------------------------------------------------------------------

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    session_id: Optional[str] = None


class QueryResponse(BaseModel):
    chart_type: str
    data: list[dict[str, Any]]
    columns: list[str]
    explanation: str
    query_echo: str   # Echoes back the sanitized user query (not the SQL)


class CannotAnswerResponse(BaseModel):
    type: str = "cannot_answer"
    message: str = (
        "I could not find data to answer that question from the available inventory."
    )


class HistoryItem(BaseModel):
    id: int
    session_id: str
    user_query: str
    chart_type: str
    created_at: str


class HistoryResponse(BaseModel):
    items: list[HistoryItem]


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

class UploadResponse(BaseModel):
    table_name: str
    row_count: int
    columns: list[str]
    schema_description: str


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str = "ok"


# ---------------------------------------------------------------------------
# Generic error (never exposes internals)
# ---------------------------------------------------------------------------

class ErrorResponse(BaseModel):
    detail: str
