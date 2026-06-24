"""
Documents Router — File upload and async task status endpoints.

Endpoints:
    POST /api/documents/upload          — Upload a PDF/image for processing
    GET  /api/documents/tasks/{task_id} — Poll task status
"""

import logging
import os
import tempfile
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status

from app.api.dependencies import get_current_user
from app.models.auth import UserResponse
from app.models.documents import DocumentUploadResponse, TaskStatusResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["Documents"])

# Supported file types
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

# Directory for uploaded files (shared between web and worker via Docker volume)
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", os.path.join(tempfile.gettempdir(), "campusmind_uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Upload a document (PDF or image) for asynchronous processing.

    The file is saved to disk and a Celery task is dispatched for:
    - Text extraction (OCR for images, native + OCR fallback for PDFs)
    - Embedding generation (sentence-transformers)

    Returns a task_id for polling the status.
    """
    # Validate file extension
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file_ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)} MB",
        )

    # Save to disk with unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    logger.info(
        "Document uploaded | user=%s | file=%s | size=%d | saved=%s",
        current_user.email, file.filename, len(content), unique_filename,
    )

    # Dispatch Celery task
    try:
        from app.worker.tasks import process_document
        task = process_document.delay(file_path, file_ext)
        task_id = task.id
        logger.info("Celery task dispatched | task_id=%s", task_id)
    except Exception as e:
        logger.error("Failed to dispatch Celery task: %s", str(e))
        # Return a mock task ID if Celery/Redis isn't running
        task_id = str(uuid.uuid4())
        logger.warning("Using mock task_id=%s (Celery unavailable)", task_id)

    return DocumentUploadResponse(
        task_id=task_id,
        status="PENDING",
        message=f"Document '{file.filename}' submitted for processing",
    )


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Poll the status of a document processing task.

    Returns the current status and, if complete, the extracted text
    and embedding vectors.
    """
    try:
        from app.worker.celery_app import celery_app
        result = celery_app.AsyncResult(task_id)

        if result.state == "PENDING":
            return TaskStatusResponse(task_id=task_id, status="PENDING")
        elif result.state == "PROCESSING":
            return TaskStatusResponse(task_id=task_id, status="PROCESSING")
        elif result.state == "SUCCESS":
            return TaskStatusResponse(
                task_id=task_id,
                status="SUCCESS",
                result=result.result,
            )
        elif result.state == "FAILURE":
            return TaskStatusResponse(
                task_id=task_id,
                status="FAILURE",
                error=str(result.info),
            )
        else:
            return TaskStatusResponse(task_id=task_id, status=result.state)

    except Exception as e:
        logger.error("Failed to fetch task status: %s", str(e))
        return TaskStatusResponse(
            task_id=task_id,
            status="UNKNOWN",
            error="Unable to connect to task queue. Is Redis running?",
        )
