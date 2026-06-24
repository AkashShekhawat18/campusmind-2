"""
User Repository — In-memory implementation.

Stores users in a dict for development. Swap this with a PostgreSQL
implementation when ready (same interface, different storage).
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from app.repositories.base import AbstractRepository

logger = logging.getLogger(__name__)


class InMemoryUserRepository(AbstractRepository):
    """In-memory user store backed by a Python dict."""

    def __init__(self) -> None:
        self._store: dict[str, dict] = {}
        self._email_index: dict[str, str] = {}  # email -> user_id for fast lookup

    def get_by_id(self, entity_id: str) -> Optional[dict]:
        return self._store.get(entity_id)

    def find_by_email(self, email: str) -> Optional[dict]:
        """Find a user by email address."""
        user_id = self._email_index.get(email)
        if user_id:
            return self._store.get(user_id)
        return None

    def find_or_create(
        self,
        email: str,
        name: str = "",
        picture: str = "",
        google_sub: str = "",
    ) -> dict:
        """
        Find an existing user by email or create a new one.
        Used during Google OAuth login flow.
        """
        existing = self.find_by_email(email)
        if existing:
            logger.info("User found | email=%s | id=%s", email, existing["id"])
            return existing

        user_data = {
            "email": email,
            "name": name,
            "picture": picture,
            "google_sub": google_sub,
            "role": "STUDENT",
        }
        return self.create(user_data)

    def create(self, data: dict) -> dict:
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "name": data.get("name", ""),
            "email": data["email"],
            "role": data.get("role", "STUDENT"),
            "picture": data.get("picture", ""),
            "google_sub": data.get("google_sub", ""),
            "created_at": datetime.now(timezone.utc),
        }
        self._store[user_id] = user
        self._email_index[user["email"]] = user_id
        logger.info("User created | email=%s | id=%s", user["email"], user_id)
        return user

    def update(self, entity_id: str, data: dict) -> Optional[dict]:
        if entity_id not in self._store:
            return None
        self._store[entity_id].update(data)
        return self._store[entity_id]

    def delete(self, entity_id: str) -> bool:
        user = self._store.pop(entity_id, None)
        if user:
            self._email_index.pop(user["email"], None)
            return True
        return False

    def list_all(self, **filters: Any) -> list[dict]:
        results = list(self._store.values())
        for key, value in filters.items():
            results = [u for u in results if u.get(key) == value]
        return results


# ---------------------------------------------------------------------------
# Singleton instance — import this in services/dependencies
# ---------------------------------------------------------------------------
user_repository = InMemoryUserRepository()
