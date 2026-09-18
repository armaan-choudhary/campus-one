"""JWT creation, signing, and verification utilities."""
from datetime import datetime, timedelta, timezone
import secrets
from typing import Optional, Dict, Any
import jwt
from app.core.config import settings


def create_access_token(
    claims: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a signed HMAC-SHA256 JWT access token."""
    to_encode = claims.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "jti": secrets.token_hex(16),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    })
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(
    claims: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a signed HMAC-SHA256 JWT refresh token."""
    to_encode = claims.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({
        "jti": secrets.token_hex(16),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "refresh",
    })
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and verify an HMAC-SHA256 JWT token.

    Raises:
        jwt.ExpiredSignatureError: If token is expired
        jwt.InvalidTokenError: If token signature or structure is invalid
    """
    payload = jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM]
    )
    return payload
