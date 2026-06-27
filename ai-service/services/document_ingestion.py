import fitz
import io
from PIL import Image
from fastapi import UploadFile
from typing import List, Dict, Any
from .ocr_service import extract_text_with_vision_api
from .image_preprocessing import preprocess_for_ocr

async def ingest_pdf(file: UploadFile) -> List[Dict[str, Any]]:
    """
    Ingests a PDF, attempts text layer extraction, and falls back to OCR + Preprocessing.
    Returns a list of pages with extracted text and metadata.
    """
    content = await file.read()
    pdf_document = fitz.open(stream=content, filetype="pdf")
    pages = []
    
    for page_num in range(len(pdf_document)):
        page = pdf_document.load_page(page_num)
        
        # 1. Try Text Layer
        text = page.get_text().strip()
        extraction_method = "text_layer"
        
        # 2. If no text layer, it's likely a scanned PDF or image
        if len(text) < 50:
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) # High resolution rendering
            img_bytes = pix.tobytes("png")
            
            # Preprocess image (deskew, threshold) to help OCR
            processed_bytes = preprocess_for_ocr(img_bytes)
            
            # Run AI OCR
            ocr_text = extract_text_with_vision_api(processed_bytes, "image/png")
            if ocr_text:
                text = ocr_text
                extraction_method = "ai_ocr"
                
        pages.append({
            "page_num": page_num + 1,
            "text": text,
            "extraction_method": extraction_method
        })
        
    return pages
