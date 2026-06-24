"""
Gemini Service — Wrapper for Google's Generative AI (google-genai SDK) and Groq API.

Features:
- Auto-detects if key is Groq (starts with gsk_) or Gemini.
- System prompts per mode (STUDENT / TEACHER)
- Exponential backoff retry for rate limits
- Mock fallback when API key is not configured
- Async generation support
"""

import asyncio
import logging
import time
from typing import Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SYSTEM_PROMPTS = {
    "STUDENT": (
        "You are CampusGPT, a highly intelligent and supportive AI assistant for students.\n"
        "Your goal is to help students learn, understand concepts, and debug code.\n"
        "Be encouraging, clear, and concise. You can assist with any topic or question the student has.\n"
        "Do not restrict yourself to specific subjects."
    ),
    "TEACHER": (
        "You are CampusGPT, an AI assistant for teachers.\n"
        "Help educators with lesson planning, grading rubrics, and answering student queries efficiently.\n"
        "You can assist with any topic or question the teacher has."
    ),
}

MODEL_NAME = "gemini-2.5-flash"
FALLBACK_MODEL_NAME = "gemini-2.5-pro"
GROQ_MODEL_NAME = "llama-3.1-8b-instant"

MAX_RETRIES = 3
BASE_DELAY = 1.0  # seconds


# ---------------------------------------------------------------------------
# Client Initialization (lazy singleton)
# ---------------------------------------------------------------------------

_client = None
_client_type = None


def _get_client():
    """Lazy-initialize the AI client (Groq or Gemini)."""
    global _client, _client_type
    if _client is None:
        settings = get_settings()
        if settings.is_gemini_configured:
            api_key = settings.GEMINI_API_KEY
            if api_key.startswith("gsk_"):
                # Initialize Groq client
                try:
                    from groq import Groq
                    _client = Groq(api_key=api_key)
                    _client_type = "GROQ"
                    logger.info("Groq client initialized | model=%s", GROQ_MODEL_NAME)
                except Exception as e:
                    logger.error("Failed to initialize Groq client: %s", str(e))
                    _client = "FAILED"
            else:
                # Initialize Gemini client
                try:
                    from google import genai
                    _client = genai.Client(api_key=api_key)
                    _client_type = "GEMINI"
                    logger.info("Gemini client initialized | model=%s", MODEL_NAME)
                except Exception as e:
                    logger.error("Failed to initialize Gemini client: %s", str(e))
                    _client = "FAILED"
        else:
            _client = "UNCONFIGURED"
            logger.warning("API key not configured — using mock responses")
    return _client


# ---------------------------------------------------------------------------
# Mock Response
# ---------------------------------------------------------------------------

def _mock_response(message: str, mode: str) -> str:
    """Return a mock response when API is not configured."""
    return (
        f"[Mock AI Response — {mode} Mode]: I received your query about "
        f'"{message[:80]}". Please configure your GEMINI_API_KEY in the '
        f"backend .env file to get actual AI responses!"
    )


# ---------------------------------------------------------------------------
# Synchronous Generation (with retries)
# ---------------------------------------------------------------------------

def generate_response(message: str, mode: str = "STUDENT") -> str:
    """
    Generate an AI response using Groq or Google Gemini.
    """
    client = _get_client()

    # Fallback if not configured or failed
    if client in ("UNCONFIGURED", "FAILED"):
        return _mock_response(message, mode)

    system_prompt = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["STUDENT"])
    last_error: Optional[Exception] = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            if _client_type == "GROQ":
                response = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message}
                    ],
                    model=GROQ_MODEL_NAME,
                )
                result_text = response.choices[0].message.content
                logger.info("Groq response generated | mode=%s | attempt=%d", mode, attempt)
                return result_text
            else:
                full_prompt = f"{system_prompt}\n\nUser query: {message}"
                response = client.models.generate_content(
                    model=MODEL_NAME,
                    contents=full_prompt,
                )
                result_text = response.text
                logger.info("Gemini response generated | mode=%s | attempt=%d", mode, attempt)
                return result_text

        except Exception as e:
            last_error = e
            error_str = str(e)

            # Retry on rate limit (429)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                delay = BASE_DELAY * (2 ** (attempt - 1))
                logger.warning(
                    "AI API rate limited | attempt=%d/%d | retrying in %.1fs | error=%s",
                    attempt, MAX_RETRIES, delay, error_str[:100],
                )
                time.sleep(delay)
                continue

            # Non-retryable error
            logger.error("AI API error (non-retryable): %s", error_str)
            break

    logger.error("AI failed after %d attempts: %s", MAX_RETRIES, str(last_error))
    return "Sorry, I am having trouble connecting to my AI brain right now. Please try again later."


# ---------------------------------------------------------------------------
# Async Generation
# ---------------------------------------------------------------------------

async def generate_response_async(message: str, mode: str = "STUDENT") -> str:
    """Async wrapper for generate_response."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, generate_response, message, mode)
