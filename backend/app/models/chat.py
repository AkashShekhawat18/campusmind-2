"""
Chat Models — Pydantic schemas for chat requests/responses.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request body to send a chat message."""
    message: str = Field(..., description="User's message text", min_length=1, max_length=10000)
    chat_id: Optional[str] = Field(None, description="Existing chat session ID (null for new chat)")
    mode: str = Field("STUDENT", description="AI mode: STUDENT or TEACHER")


class ChatResponse(BaseModel):
    """Response containing the AI reply and chat session ID."""
    chat_id: str
    reply: str


class MessageResponse(BaseModel):
    """Single message within a chat session."""
    id: str
    role: str  # "user" or "assistant"
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionResponse(BaseModel):
    """Full chat session with message history."""
    id: str
    title: str
    created_at: datetime
    messages: list[MessageResponse] = []

    model_config = {"from_attributes": True}
