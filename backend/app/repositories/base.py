"""
Abstract Repository — Base interface for all data access.

Implements the Repository Pattern so the data store can be swapped
(in-memory → PostgreSQL/pgvector) without changing service logic.
"""

from abc import ABC, abstractmethod
from typing import Any, Optional


class AbstractRepository(ABC):
    """
    Abstract base class defining the repository interface.

    All concrete repositories (InMemory, PostgreSQL, etc.) must implement
    these methods. Services depend on this interface, not the concrete class.
    """

    @abstractmethod
    def get_by_id(self, entity_id: str) -> Optional[dict]:
        """Retrieve a single entity by its ID."""
        ...

    @abstractmethod
    def create(self, data: dict) -> dict:
        """Create a new entity and return it with generated fields (id, timestamps)."""
        ...

    @abstractmethod
    def update(self, entity_id: str, data: dict) -> Optional[dict]:
        """Update an existing entity. Returns None if not found."""
        ...

    @abstractmethod
    def delete(self, entity_id: str) -> bool:
        """Delete an entity by ID. Returns True if deleted, False if not found."""
        ...

    @abstractmethod
    def list_all(self, **filters: Any) -> list[dict]:
        """List entities with optional filters."""
        ...
