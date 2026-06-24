"""
Chat Service — Orchestrates the chat flow.

Handles: create/find chat → save user message → call Gemini → save AI response.
Also manages guest message limits (4 messages per IP).
"""

import logging
from typing import Optional

from app.models.chat import ChatRequest, ChatResponse, ChatSessionResponse, MessageResponse
from app.repositories.chat_repository import chat_repository
from app.services.gemini_service import generate_response_async

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Guest Rate Limiting (in-memory, per IP)
# ---------------------------------------------------------------------------

GUEST_MESSAGE_LIMIT = 4
_guest_counts: dict[str, int] = {}  # ip_address -> message_count


def get_guest_count(ip: str) -> int:
    """Get the number of messages sent by a guest IP."""
    return _guest_counts.get(ip, 0)


def increment_guest_count(ip: str) -> int:
    """Increment and return the new message count for a guest IP."""
    _guest_counts[ip] = _guest_counts.get(ip, 0) + 1
    return _guest_counts[ip]


def is_guest_limited(ip: str) -> bool:
    """Check if a guest IP has exceeded the message limit."""
    return get_guest_count(ip) >= GUEST_MESSAGE_LIMIT


# ---------------------------------------------------------------------------
# Chat Operations
# ---------------------------------------------------------------------------

async def process_chat_message(
    request: ChatRequest,
    user_id: Optional[str] = None,
    client_ip: str = "unknown",
) -> ChatResponse:
    """
    Process an incoming chat message:
    1. Create or find the chat session
    2. Save the user's message
    3. Generate AI response via Gemini
    4. Save the AI response
    5. Return the reply

    Args:
        request: ChatRequest with message, optional chat_id, and mode.
        user_id: Authenticated user's ID (None for guests).
        client_ip: Client IP address for guest rate limiting.

    Returns:
        ChatResponse with chat_id and AI reply.
    """
    # For guests, use IP-based pseudo user ID
    effective_user_id = user_id or f"guest_{client_ip}"

    # Find or create chat session
    chat_id = request.chat_id
    if not chat_id:
        chat = chat_repository.create({
            "user_id": effective_user_id,
            "title": request.message[:30],
        })
        chat_id = chat["id"]
        logger.info("New chat created | id=%s | user=%s", chat_id, effective_user_id)

    # Save user message
    chat_repository.add_message(
        chat_id=chat_id,
        role="user",
        content=request.message,
    )

    # Generate AI response
    ai_reply = await generate_response_async(request.message, request.mode)

    # Save AI message
    chat_repository.add_message(
        chat_id=chat_id,
        role="assistant",
        content=ai_reply,
    )

    # Track guest usage
    if user_id is None:
        count = increment_guest_count(client_ip)
        logger.info("Guest message | ip=%s | count=%d/%d", client_ip, count, GUEST_MESSAGE_LIMIT)

    return ChatResponse(chat_id=chat_id, reply=ai_reply)


def get_user_chats(user_id: str) -> list[ChatSessionResponse]:
    """
    Get all chat sessions for an authenticated user.

    Returns:
        List of ChatSessionResponse with full message history.
    """
    raw_chats = chat_repository.get_chats_for_user(user_id)

    return [
        ChatSessionResponse(
            id=chat["id"],
            title=chat["title"],
            created_at=chat["created_at"],
            messages=[
                MessageResponse(
                    id=msg["id"],
                    role=msg["role"],
                    content=msg["content"],
                    created_at=msg["created_at"],
                )
                for msg in chat.get("messages", [])
            ],
        )
        for chat in raw_chats
    ]
