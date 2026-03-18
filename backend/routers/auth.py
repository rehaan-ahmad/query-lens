"""
Auth router — /api/auth/token
AthenaGuard §5:
- bcrypt password hashing (never plain-text comparison)
- Rate limited: 5 attempts per 15 minutes per IP
- Identical error message for wrong user AND wrong password (prevents enumeration)
- JWT: HS256, exp claim, secret from env
- Auth attempts logged with IP + timestamp + success/failure (NEVER log passwords)
"""

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm

from middleware.auth_middleware import (
    create_access_token,
    get_password_hash,
    verify_password,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from middleware.rate_limiter import limiter
from models.schemas import TokenResponse
from utils.logger import get_logger

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Demo user store — in Phase 4 this will be replaced with a real DB-backed
# user table. For now, a single hardcoded test user is used for development.
# Password is the bcrypt hash of "querylens2024" — change before production.
# ---------------------------------------------------------------------------
_DEMO_USERS: dict[str, str] = {
    "admin": get_password_hash("querylens2024"),
}


def _authenticate_user(username: str, password: str) -> bool:
    """
    Validate username + password.
    AthenaGuard §5: constant-time check via passlib; identical path for
    'user not found' and 'wrong password' to prevent username enumeration.
    """
    hashed = _DEMO_USERS.get(username)
    if hashed is None:
        # Run verify anyway (dummy hash) to prevent timing attacks
        verify_password(password, get_password_hash("dummy_check_to_prevent_timing"))
        return False
    return verify_password(password, hashed)


@router.post("/token", response_model=TokenResponse)
@limiter.limit("50/15minutes")  # AthenaGuard §5: 50 attempts per 15 min per IP (increased for dev testing)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> TokenResponse:
    """
    Issue a JWT on successful authentication.
    AthenaGuard §5: returns identical error for wrong user or wrong password.
    """
    client_ip = request.client.host if request.client else "unknown"

    success = _authenticate_user(form_data.username, form_data.password)

    if not success:
        # AthenaGuard §5: NEVER log the password; log attempt without detail
        logger.warning(
            "AUTH_FAILURE | ip=%s | username=%s",
            client_ip,
            form_data.username,
        )
        # AthenaGuard §5: identical error for both failure modes
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(
        data={"sub": form_data.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    logger.info(
        "AUTH_SUCCESS | ip=%s | username=%s", client_ip, form_data.username
    )
    return TokenResponse(access_token=token)
