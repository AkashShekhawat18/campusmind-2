"""
API Dependencies — FastAPI dependency injection for authentication.

Usage in routers:
    @router.get("/protected")
    async def protected_route(user = Depends(get_current_user)):
        ...

    @router.get("/optional-auth")
    async def optional_route(user = Depends(get_optional_user)):
        if user is None:
            # Guest access
        ...
"""

import logging
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_access_token
from app.models.auth import UserResponse
from app.repositories.user_repository import user_repository

logger = logging.getLogger(__name__)

# HTTPBearer extracts the token from "Authorization: Bearer <token>"
security_scheme = HTTPBearer()
optional_security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> UserResponse:
    """
    FastAPI dependency that extracts and validates the JWT from the
    Authorization header, then returns the authenticated user.

    Raises HTTPException 401 if the token is missing, invalid, or the
    user is not found.
    """
    token = credentials.credentials
    payload = decode_access_token(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user ID",
        )

    user = user_repository.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        picture=user.get("picture", ""),
        created_at=user["created_at"],
    )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security_scheme),
) -> Optional[UserResponse]:
    """
    Same as get_current_user, but returns None instead of raising
    an exception when no token is provided. Used for routes that
    support both guest and authenticated access.
    """
    if credentials is None:
        return None

    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
