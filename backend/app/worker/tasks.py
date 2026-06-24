"""
Celery Tasks — Heavy ML/OCR operations offloaded from FastAPI.

Tasks:
    process_document  — Full pipeline: extract text → generate embeddings
    generate_embeddings — Encode text chunks using sentence-transformers
"""

import logging
from typing import Optional

from celery import Task

from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


class MLTask(Task):
    """
    Custom Celery task base class that provides access to the
    pre-loaded embedding model via self.model.
    """

    @property
    def model(self):
        """Access the globally loaded sentence-transformers model."""
        from app.worker.celery_app import embedding_model

        if embedding_model is None:
            raise RuntimeError(
                "Embedding model not loaded. Ensure the worker started "
                "correctly and sentence-transformers is installed."
            )
        return embedding_model


@celery_app.task(bind=True, base=MLTask, name="process_document")
def process_document(self, file_path: str, file_type: str) -> dict:
    """
    Full document processing pipeline:
    1. Extract text (OCR for images, native+OCR for PDFs)
    2. Chunk the text
    3. Generate embeddings for each chunk

    Args:
        file_path: Absolute path to the uploaded file.
        file_type: File extension (e.g., ".pdf", ".png").

    Returns:
        dict with keys: text, chunks, embeddings, metadata
    """
    from app.services.ocr_service import extract_text_from_image, extract_text_from_pdf

    # Update state to PROCESSING
    self.update_state(state="PROCESSING", meta={"step": "extracting_text"})
    logger.info("Processing document | path=%s | type=%s", file_path, file_type)

    try:
        # Step 1: Extract text
        if file_type.lower() in (".png", ".jpg", ".jpeg", ".tiff", ".bmp"):
            text = extract_text_from_image(file_path)
        elif file_type.lower() == ".pdf":
            text = extract_text_from_pdf(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

        if not text.strip():
            logger.warning("No text extracted from document: %s", file_path)
            return {
                "text": "",
                "chunks": [],
                "embeddings": [],
                "metadata": {"file_path": file_path, "file_type": file_type},
            }

        # Step 2: Chunk text (simple paragraph-based splitting)
        self.update_state(state="PROCESSING", meta={"step": "chunking_text"})
        chunks = _chunk_text(text)
        logger.info("Text chunked | chunks=%d", len(chunks))

        # Step 3: Generate embeddings
        self.update_state(state="PROCESSING", meta={"step": "generating_embeddings"})
        embeddings = _generate_embeddings(self, chunks)
        logger.info("Embeddings generated | vectors=%d", len(embeddings))

        return {
            "text": text,
            "chunks": chunks,
            "embeddings": embeddings,
            "metadata": {
                "file_path": file_path,
                "file_type": file_type,
                "total_chars": len(text),
                "total_chunks": len(chunks),
                "embedding_dim": len(embeddings[0]) if embeddings else 0,
            },
        }

    except Exception as e:
        logger.error("Document processing failed: %s", str(e))
        raise


@celery_app.task(bind=True, base=MLTask, name="generate_embeddings")
def generate_embeddings_task(self, text_chunks: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text chunks.
    Uses the pre-loaded all-mpnet-base-v2 model.
    """
    return _generate_embeddings(self, text_chunks)


# ---------------------------------------------------------------------------
# Internal Helpers
# ---------------------------------------------------------------------------

def _chunk_text(text: str, max_chunk_size: int = 512, overlap: int = 50) -> list[str]:
    """
    Split text into overlapping chunks for embedding generation.

    Args:
        text: Full document text.
        max_chunk_size: Maximum characters per chunk.
        overlap: Character overlap between consecutive chunks.

    Returns:
        List of text chunks.
    """
    # First split by paragraphs
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    chunks: list[str] = []
    current_chunk = ""

    for para in paragraphs:
        if len(current_chunk) + len(para) + 1 <= max_chunk_size:
            current_chunk = f"{current_chunk}\n{para}".strip() if current_chunk else para
        else:
            if current_chunk:
                chunks.append(current_chunk)
            # Handle paragraphs longer than max_chunk_size
            if len(para) > max_chunk_size:
                words = para.split()
                sub_chunk = ""
                for word in words:
                    if len(sub_chunk) + len(word) + 1 <= max_chunk_size:
                        sub_chunk = f"{sub_chunk} {word}".strip() if sub_chunk else word
                    else:
                        if sub_chunk:
                            chunks.append(sub_chunk)
                        sub_chunk = word
                current_chunk = sub_chunk
            else:
                current_chunk = para

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


def _generate_embeddings(task: MLTask, chunks: list[str]) -> list[list[float]]:
    """
    Generate embeddings using the pre-loaded sentence-transformers model.

    Returns list of float vectors (one per chunk).
    """
    if not chunks:
        return []

    try:
        embeddings = task.model.encode(chunks, show_progress_bar=False)
        # Convert numpy arrays to lists for JSON serialization
        return [emb.tolist() for emb in embeddings]
    except Exception as e:
        logger.error("Embedding generation failed: %s", str(e))
        raise
