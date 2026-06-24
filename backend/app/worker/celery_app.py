"""
Celery Application — Task queue configuration.

The sentence-transformers model is loaded ONCE at worker startup via the
worker_init signal, NOT on every task execution.

Start the worker:
    celery -A app.worker.celery_app worker --loglevel=info
"""

import logging

from celery import Celery
from celery.signals import worker_init

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Celery Instance
# ---------------------------------------------------------------------------

celery_app = Celery("campusmind")

# Configuration — reads from environment or uses defaults
celery_app.conf.update(
    broker_url="redis://localhost:6379/0",
    result_backend="redis://localhost:6379/0",
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

# Auto-discover tasks in the worker package
celery_app.autodiscover_tasks(["app.worker"])


# ---------------------------------------------------------------------------
# Load config from .env (override defaults)
# ---------------------------------------------------------------------------

def _load_config():
    """Load Celery config from app settings (if available)."""
    try:
        from app.core.config import get_settings
        settings = get_settings()
        celery_app.conf.update(
            broker_url=settings.CELERY_BROKER_URL,
            result_backend=settings.CELERY_RESULT_BACKEND,
        )
        logger.info("Celery config loaded from settings")
    except Exception as e:
        logger.warning("Could not load settings, using defaults: %s", str(e))


_load_config()


# ---------------------------------------------------------------------------
# ML Model Loading at Worker Startup
# ---------------------------------------------------------------------------

# Global reference to the sentence-transformers model
# Loaded ONCE when the worker process starts, shared across all tasks
embedding_model = None


@worker_init.connect
def load_ml_models(**kwargs):
    """
    Signal handler: loads the sentence-transformers model into memory
    when the Celery worker starts. This ensures the model is loaded
    once per worker process, not per task execution.
    """
    global embedding_model

    logger.info("Worker starting — loading sentence-transformers model...")

    try:
        from sentence_transformers import SentenceTransformer

        embedding_model = SentenceTransformer("all-mpnet-base-v2")
        logger.info(
            "✓ Embedding model loaded: all-mpnet-base-v2 | "
            "embedding_dim=%d",
            embedding_model.get_sentence_embedding_dimension(),
        )
    except Exception as e:
        logger.error(
            "✗ Failed to load embedding model: %s. "
            "Embedding tasks will fail.",
            str(e),
        )
        embedding_model = None
