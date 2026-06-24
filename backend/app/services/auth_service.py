"""
Auth Service — Orchestrates the Google OAuth login flow.

Validates the Google token, finds or creates the user in the repository,
and issues a JWT for subsequent API access.
"""

import logging

from app.core.security import create_access_token, verify_google_token
from app.models.auth import TokenResponse, UserResponse
from app.repositories.user_repository import user_repository

logger = logging.getLogger(__name__)


def authenticate_google_user(credential: str) -> TokenResponse:
    """
    Full Google OAuth authentication flow:
    1. Validate the Google ID token
    2. Find or create user in the repository
    3. Issue a JWT

    Args:
        credential: Raw Google ID token from the frontend.

    Returns:
        TokenResponse with JWT and user profile.
    """
    # Step 1: Validate Google token → extract user info
    google_info = verify_google_token(credential)

    # Step 2: Upsert user in repository
    user = user_repository.find_or_create(
        email=google_info["email"],
        name=google_info["name"],
        picture=google_info.get("picture", ""),
        google_sub=google_info["sub"],
    )

    # Step 3: Create JWT with user ID as subject
    token = create_access_token(data={
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
    })

    user_response = UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        picture=user.get("picture", ""),
        created_at=user["created_at"],
    )

    logger.info(
        "User authenticated | email=%s | role=%s",
        user["email"],
        user["role"],
    )

    return TokenResponse(token=token, user=user_response)
