"""
Auth Router — Google OAuth login and user profile endpoints.

Endpoints:
    POST /api/auth/google   — Exchange Google ID token for a JWT
    GET  /api/auth/me        — Get current authenticated user profile
"""

import logging

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.models.auth import GoogleAuthRequest, TokenResponse, UserResponse
from app.services.auth_service import authenticate_google_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/google", response_model=TokenResponse)
async def google_login(request: GoogleAuthRequest):
    """
    Authenticate with Google OAuth.

    Receives a Google ID token from the frontend's Google Identity Services,
    validates it, creates/finds the user, and returns a JWT for API access.
    """
    logger.info("Google login attempt")
    result = authenticate_google_user(request.credential)
    logger.info("Google login success | email=%s", result.user.email)
    return result


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return current_user
