"""
Document Models — Pydantic schemas for document upload and task status.
"""

from typing import Optional

from pydantic import BaseModel, Field


class DocumentUploadResponse(BaseModel):
    """Response after submitting a document for processing."""
    task_id: str = Field(..., description="Celery task ID for polling status")
    status: str = Field("PENDING", description="Initial task status")
    message: str = Field("Document submitted for processing")


class TaskStatusResponse(BaseModel):
    """Response for polling a task's progress."""
    task_id: str
    status: str = Field(
        ...,
        description="Task status: PENDING | PROCESSING | SUCCESS | FAILURE",
    )
    result: Optional[dict] = Field(
        None,
        description="Extracted text and embeddings (only present when status=SUCCESS)",
    )
    error: Optional[str] = Field(
        None,
        description="Error message (only present when status=FAILURE)",
    )
