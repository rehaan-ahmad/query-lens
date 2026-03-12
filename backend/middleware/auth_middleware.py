"""
JWT authentication middleware.
AthenaGuard §5:
- JWT secret loaded from env var only (never hardcoded)
- Token must include `exp` claim
- HS256 algorithm
- Signature validated on every protected request
- Identical error message for invalid/expired/missing token
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from models.schemas import TokenData
from utils.logger import get_logger

logger = get_logger(__name__)

# OAuth2 scheme — looks for Bearer token in Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# Password hashing context — bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings — loaded at import time; fail fast if missing (AthenaGuard §6)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def _get_jwt_secret() -> str:
    """Load JWT secret from environment. Raises immediately if not set."""
    secret = os.environ.get("JWT_SECRET_KEY", "")
    if not secret:
        raise RuntimeError(
            "JWT_SECRET_KEY environment variable is not set. "
            "Set it before starting the server."
        )
    return secret


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Constant-time password check via passlib bcrypt."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password with bcrypt."""
    return pwd_context.hash(password)


def create_access_token(
    data: dict, expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a signed JWT.
    AthenaGuard §5: Always includes `exp` claim. Secret from env.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    secret = _get_jwt_secret()
    return jwt.encode(to_encode, secret, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    """
    Dependency: validates JWT signature and expiry on every protected request.
    AthenaGuard §5: Identical 401 message regardless of failure reason —
    prevents information leakage about token structure/validity.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        secret = _get_jwt_secret()
        payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if username is None:
            raise credentials_exception
        return TokenData(username=username)
    except JWTError:
        # AthenaGuard §5: Do NOT log the token or the specific JWT error
        logger.warning("JWT validation failed — invalid or expired token")
        raise credentials_exception
