"""
Chat Router — AI chat endpoints.

Endpoints:
    POST /api/chat          — Send a message and get an AI response
    GET  /api/chat          — Get chat history (authenticated users only)
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.dependencies import get_current_user, get_optional_user
from app.models.auth import UserResponse
from app.models.chat import ChatRequest, ChatResponse, ChatSessionResponse
from app.services.chat_service import (
    get_user_chats,
    is_guest_limited,
    process_chat_message,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def send_message(
    chat_request: ChatRequest,
    request: Request,
    user: Optional[UserResponse] = Depends(get_optional_user),
):
    """
    Send a chat message and receive an AI response.

    Supports both authenticated and guest users:
    - Authenticated: Unlimited messages, chat history saved.
    - Guest: Limited to 4 messages per IP, no persistent history.

    Returns {loginRequired: true} when the guest limit is reached.
    """
    client_ip = request.client.host if request.client else "unknown"

    # Check guest message limit
    if user is None and is_guest_limited(client_ip):
        logger.info("Guest rate limited | ip=%s", client_ip)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "loginRequired": True,
                "message": "Guest limit reached. Please log in to continue.",
            },
        )

    response = await process_chat_message(
        request=chat_request,
        user_id=user.id if user else None,
        client_ip=client_ip,
    )

    return response


@router.get("", response_model=list[ChatSessionResponse])
async def get_chats(
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Get all chat sessions for the authenticated user.
    Returns chats sorted by creation date (newest first) with full message history.
    """
    chats = get_user_chats(current_user.id)
    logger.info("Chats retrieved | user=%s | count=%d", current_user.email, len(chats))
    return chats
