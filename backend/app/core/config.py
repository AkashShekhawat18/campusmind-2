"""
Core Configuration — Loads all environment variables via Pydantic Settings.

All config values are accessed through the singleton `get_settings()` function.
Usage:
    from app.core.config import get_settings
    settings = get_settings()
    print(settings.JWT_SECRET)
"""

import logging
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- Google OAuth ---
    GOOGLE_CLIENT_ID: str = "your-google-client-id.apps.googleusercontent.com"

    # --- JWT ---
    JWT_SECRET: str = "change-this-to-a-secure-random-string"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 1440  # 24 hours

    # --- Google Gemini ---
    GEMINI_API_KEY: str = "your-gemini-api-key"

    # --- Celery / Redis ---
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # --- CORS ---
    FRONTEND_URL: str = "http://localhost:3000"

    # --- Environment ---
    ENVIRONMENT: str = "development"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_gemini_configured(self) -> bool:
        return (
            self.GEMINI_API_KEY != "your-gemini-api-key"
            and len(self.GEMINI_API_KEY) > 10
        )


@lru_cache()
def get_settings() -> Settings:
    """
    Returns a cached singleton Settings instance.
    The @lru_cache ensures env vars are read only once.
    """
    settings = Settings()
    logger.info(
        "Settings loaded | env=%s | gemini_configured=%s",
        settings.ENVIRONMENT,
        settings.is_gemini_configured,
    )
    return settings
