"""
Auth Models — Pydantic schemas for authentication requests/responses.
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class GoogleAuthRequest(BaseModel):
    """Request body for Google OAuth login."""
    credential: str = Field(
        ...,
        description="Google ID token from Google Identity Services",
        min_length=10,
    )


class UserResponse(BaseModel):
    """Public user representation returned in API responses."""
    id: str
    name: str
    email: str
    role: str = "STUDENT"
    picture: str = ""
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """Response after successful authentication."""
    token: str = Field(..., description="JWT access token")
    user: UserResponse
