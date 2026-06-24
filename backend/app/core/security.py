"""
Core Security — Google OAuth token validation, JWT creation & verification.

This module handles ALL authentication cryptography. No other module should
import google.oauth2 or python-jose directly.
"""

import logging
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from jose import JWTError, jwt

from app.core.config import get_settings

logger = logging.getLogger(__name__)


# =============================================================================
# Google OAuth Token Validation
# =============================================================================

def verify_google_token(credential: str) -> dict:
    """
    Validate a Google OAuth2 ID token from the frontend.

    Args:
        credential: The Google ID token string from Google Identity Services.

    Returns:
        dict with keys: sub (Google user ID), email, name, picture

    Raises:
        HTTPException 401 if the token is invalid or expired.
    """
    settings = get_settings()
    try:
        id_info = google_id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            audience=settings.GOOGLE_CLIENT_ID,
        )

        # Verify the issuer
        if id_info.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
            raise ValueError("Invalid issuer")

        logger.info("Google token verified | email=%s", id_info.get("email"))

        return {
            "sub": id_info["sub"],
            "email": id_info["email"],
            "name": id_info.get("name", ""),
            "picture": id_info.get("picture", ""),
        }

    except ValueError as e:
        logger.warning("Google token verification failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}",
        )


# =============================================================================
# JWT Creation & Verification
# =============================================================================

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Create a signed JWT access token.

    Args:
        data: Payload to encode (must include 'sub' for user ID).
        expires_delta: Optional custom expiry. Defaults to config JWT_EXPIRY_MINUTES.

    Returns:
        Encoded JWT string.
    """
    settings = get_settings()
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRY_MINUTES)

    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )

    logger.debug("JWT created for sub=%s | expires=%s", data.get("sub"), expire.isoformat())
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    Decode and verify a JWT access token.

    Args:
        token: The JWT string from the Authorization header.

    Returns:
        Decoded payload dict.

    Raises:
        HTTPException 401 if the token is invalid, expired, or malformed.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )

        sub: str | None = payload.get("sub")
        if sub is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload missing 'sub' claim",
            )

        return payload

    except JWTError as e:
        logger.warning("JWT decode failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
