"""
OCR Service — Document text extraction using pytesseract and PyMuPDF.

These functions are designed to be called from Celery workers, NOT from
FastAPI routes directly (they are CPU-intensive and blocking).
"""

import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


def extract_text_from_image(file_path: str) -> str:
    """
    Extract text from an image file using Tesseract OCR.

    Args:
        file_path: Absolute path to the image file.

    Returns:
        Extracted text string.

    Raises:
        FileNotFoundError: If the file does not exist.
        RuntimeError: If Tesseract is not installed or fails.
    """
    import pytesseract
    from PIL import Image

    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Image file not found: {file_path}")

    logger.info("OCR processing image | path=%s", file_path)

    try:
        image = Image.open(path)
        text = pytesseract.image_to_string(image)
        logger.info("OCR complete | path=%s | chars=%d", file_path, len(text))
        return text.strip()
    except Exception as e:
        logger.error("OCR failed | path=%s | error=%s", file_path, str(e))
        raise RuntimeError(f"OCR processing failed: {str(e)}") from e


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from a PDF file using PyMuPDF (fitz).
    Falls back to OCR for scanned/image-based pages.

    Args:
        file_path: Absolute path to the PDF file.

    Returns:
        Concatenated text from all pages.

    Raises:
        FileNotFoundError: If the file does not exist.
        RuntimeError: If PDF parsing fails.
    """
    import fitz  # PyMuPDF

    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF file not found: {file_path}")

    logger.info("PDF processing | path=%s", file_path)

    try:
        doc = fitz.open(str(path))
        all_text: list[str] = []

        for page_num, page in enumerate(doc, start=1):
            # Try native text extraction first
            text = page.get_text("text").strip()

            if text:
                all_text.append(text)
                logger.debug("Page %d: native text (%d chars)", page_num, len(text))
            else:
                # Fallback: render page as image → OCR
                logger.debug("Page %d: no native text, falling back to OCR", page_num)
                ocr_text = _ocr_pdf_page(page)
                if ocr_text:
                    all_text.append(ocr_text)

        page_count = doc.page_count
        doc.close()

        combined = "\n\n".join(all_text)
        logger.info(
            "PDF complete | path=%s | pages=%d | chars=%d",
            file_path, page_count, len(combined),
        )
        return combined

    except Exception as e:
        logger.error("PDF processing failed | path=%s | error=%s", file_path, str(e))
        raise RuntimeError(f"PDF processing failed: {str(e)}") from e


def _ocr_pdf_page(page) -> Optional[str]:
    """
    OCR a single PDF page by rendering it as a high-resolution image.
    Returns extracted text or None if OCR fails.
    """
    try:
        import pytesseract
        from PIL import Image
        import io

        # Render page at 300 DPI for better OCR accuracy
        # Render page at 300 DPI for better OCR accuracy
        # Actually use fitz.Matrix for DPI
        import fitz
        zoom = 300 / 72  # 300 DPI / default 72 DPI
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)

        img_data = pix.tobytes("png")
        image = Image.open(io.BytesIO(img_data))
        text = pytesseract.image_to_string(image)
        return text.strip() if text.strip() else None

    except Exception as e:
        logger.warning("OCR fallback failed for page: %s", str(e))
        return None
