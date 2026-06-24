"""
CampusMind Backend — FastAPI Application Entrypoint

Start the server:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Or via Docker:
    docker compose up --build
"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger("campusmind")


# ---------------------------------------------------------------------------
# Application Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle events."""
    settings = get_settings()
    logger.info("=" * 60)
    logger.info("CampusMind Backend starting")
    logger.info("Environment: %s", settings.ENVIRONMENT)
    logger.info("Frontend URL: %s", settings.FRONTEND_URL)
    logger.info("Gemini configured: %s", settings.is_gemini_configured)
    logger.info("=" * 60)
    yield
    logger.info("CampusMind Backend shutting down")


# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="CampusMind API",
    description="AI-powered educational platform backend",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS Middleware
# ---------------------------------------------------------------------------

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Register Routers
# ---------------------------------------------------------------------------

from app.api.routers.auth import router as auth_router
from app.api.routers.chat import router as chat_router
from app.api.routers.documents import router as documents_router

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(documents_router)


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint for load balancers and monitoring."""
    return {
        "status": "ok",
        "service": "CampusMind Python Backend",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }
