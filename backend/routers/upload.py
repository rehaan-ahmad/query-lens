"""
Upload router — /api/upload
AthenaGuard §7 (CSV Upload Security):
- Validates Content-Type AND file extension (not just one)
- 10 MB file size limit
- Column name sanitization (alphanumeric + underscore, max 64 chars)
- Session-scoped table: upload_{session_id}
- Never sends raw uploaded data to Gemini — schema description only
"""

import magic  # python-magic for MIME type sniffing (magic bytes)
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status

from middleware.auth_middleware import get_current_user, TokenData
from middleware.rate_limiter import limiter
from models.schemas import UploadResponse
from services.csv_loader import load_csv_to_table
from utils.logger import get_logger

router = APIRouter(prefix="/api/upload", tags=["upload"])
logger = get_logger(__name__)

ALLOWED_MIME_TYPES = {"text/csv", "text/plain", "application/csv", "application/octet-stream"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/", response_model=UploadResponse)
@limiter.limit("5/hour")  # AthenaGuard §7: 5 uploads per hour per user
async def upload_csv(
    request: Request,
    file: UploadFile = File(...),
    session_id: str = Form(...),
    current_user: TokenData = Depends(get_current_user),  # AthenaGuard §3: JWT required
) -> UploadResponse:
    """
    Upload a CSV file and load it into a session-scoped SQLite table.
    Returns schema description for use with the query endpoint.
    """
    # -- 1. Validate file extension (AthenaGuard §7) --
    filename = file.filename or ""
    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .csv files are accepted.",
        )

    # -- 2. Read file content --
    contents = await file.read()

    # -- 3. Validate file size (AthenaGuard §7) --
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the 10 MB size limit.",
        )

    # -- 4. Validate MIME type via Content-Type header AND magic bytes (AthenaGuard §7) --
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES and "csv" not in content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only CSV files are accepted.",
        )

    # Magic bytes check — sniff actual file content
    try:
        detected_mime = magic.from_buffer(contents[:2048], mime=True)
        if detected_mime not in ALLOWED_MIME_TYPES and "text" not in detected_mime:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content does not appear to be a valid CSV.",
            )
    except ImportError:
        # python-magic not available — fall back to extension + content-type check
        logger.warning("python-magic not available; skipping magic bytes check")

    # -- 5. Load into DB with sanitized column names --
    try:
        result = load_csv_to_table(contents, session_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    logger.info(
        "UPLOAD_SUCCESS | user=%s | session=%s | rows=%d | table=%s",
        current_user.username,
        session_id,
        result["row_count"],
        result["table_name"],
    )

    return UploadResponse(
        table_name=result["table_name"],
        row_count=result["row_count"],
        columns=result["columns"],
        schema_description=result["schema_description"],
    )
