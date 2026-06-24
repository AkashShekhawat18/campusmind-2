"""
Chat Repository — In-memory implementation.

Stores chats and messages in dicts. Mirrors the existing Prisma schema
(Chat has many Messages, Chat belongs to User).
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from app.repositories.base import AbstractRepository

logger = logging.getLogger(__name__)


class InMemoryChatRepository(AbstractRepository):
    """In-memory chat/message store backed by Python dicts."""

    def __init__(self) -> None:
        self._chats: dict[str, dict] = {}
        self._messages: dict[str, dict] = {}
        # Index: user_id -> list of chat_ids (for fast listing)
        self._user_chats: dict[str, list[str]] = {}

    # ---- Chat CRUD ----

    def get_by_id(self, entity_id: str) -> Optional[dict]:
        """Get a chat by ID, including its messages."""
        chat = self._chats.get(entity_id)
        if chat:
            chat = chat.copy()
            chat["messages"] = self._get_messages_for_chat(entity_id)
        return chat

    def create(self, data: dict) -> dict:
        """Create a new chat session."""
        chat_id = str(uuid.uuid4())
        chat = {
            "id": chat_id,
            "user_id": data["user_id"],
            "title": data.get("title", "New Chat"),
            "created_at": datetime.now(timezone.utc),
        }
        self._chats[chat_id] = chat

        # Update user->chats index
        if chat["user_id"] not in self._user_chats:
            self._user_chats[chat["user_id"]] = []
        self._user_chats[chat["user_id"]].append(chat_id)

        logger.info("Chat created | id=%s | user=%s", chat_id, chat["user_id"])
        return {**chat, "messages": []}

    def update(self, entity_id: str, data: dict) -> Optional[dict]:
        if entity_id not in self._chats:
            return None
        self._chats[entity_id].update(data)
        return self._chats[entity_id]

    def delete(self, entity_id: str) -> bool:
        chat = self._chats.pop(entity_id, None)
        if chat:
            # Remove from user index
            user_chats = self._user_chats.get(chat["user_id"], [])
            if entity_id in user_chats:
                user_chats.remove(entity_id)
            # Remove associated messages
            msg_ids = [
                mid for mid, m in self._messages.items()
                if m["chat_id"] == entity_id
            ]
            for mid in msg_ids:
                del self._messages[mid]
            return True
        return False

    def list_all(self, **filters: Any) -> list[dict]:
        results = list(self._chats.values())
        for key, value in filters.items():
            results = [c for c in results if c.get(key) == value]
        # Attach messages to each chat
        for chat in results:
            chat["messages"] = self._get_messages_for_chat(chat["id"])
        # Sort by created_at descending
        results.sort(key=lambda c: c["created_at"], reverse=True)
        return results

    # ---- Message Operations ----

    def add_message(self, chat_id: str, role: str, content: str) -> dict:
        """Add a message to an existing chat."""
        message_id = str(uuid.uuid4())
        message = {
            "id": message_id,
            "chat_id": chat_id,
            "role": role,
            "content": content,
            "created_at": datetime.now(timezone.utc),
        }
        self._messages[message_id] = message
        logger.debug("Message added | chat=%s | role=%s | len=%d", chat_id, role, len(content))
        return message

    def _get_messages_for_chat(self, chat_id: str) -> list[dict]:
        """Get all messages for a chat, sorted by creation time."""
        msgs = [m for m in self._messages.values() if m["chat_id"] == chat_id]
        msgs.sort(key=lambda m: m["created_at"])
        return msgs

    def get_chats_for_user(self, user_id: str) -> list[dict]:
        """Get all chats for a user with their messages."""
        return self.list_all(user_id=user_id)


# ---------------------------------------------------------------------------
# Singleton instance
# ---------------------------------------------------------------------------
chat_repository = InMemoryChatRepository()
