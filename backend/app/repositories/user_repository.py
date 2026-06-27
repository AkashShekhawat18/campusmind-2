"""
User Repository — SQLAlchemy implementation.
"""

import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User

logger = logging.getLogger(__name__)


class SQLAlchemyUserRepository:
    """SQLAlchemy user store backed by the database."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entity_id: str) -> Optional[dict]:
        user = self.db.query(User).filter(User.id == entity_id).first()
        if user:
            return self._to_dict(user)
        return None

    def find_by_email(self, email: str) -> Optional[dict]:
        """Find a user by email address."""
        user = self.db.query(User).filter(User.email == email).first()
        if user:
            return self._to_dict(user)
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

        user = User(
            email=email,
            name=name,
            picture=picture,
            google_sub=google_sub,
            role="STUDENT"
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        logger.info("User created | email=%s | id=%s", user.email, user.id)
        return self._to_dict(user)

    def _to_dict(self, user: User) -> dict:
        return {
            "id": user.id,
            "email": user.email,
            "google_sub": user.google_sub,
            "name": user.name,
            "picture": user.picture,
            "role": user.role,
            "created_at": user.created_at,
        }
