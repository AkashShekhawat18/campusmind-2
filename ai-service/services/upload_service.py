import fitz  # PyMuPDF
import docx
import io
import uuid
import os
import random
import base64
from PIL import Image
from groq import Groq
from fastapi import UploadFile
from langchain_text_splitters import RecursiveCharacterTextSplitter
import openpyxl
from pptx import Presentation

from services.embedding_service import get_embeddings
from services.vector_service import store_chunks

def get_groq_client():
    keys = os.environ.get("GROQ_API_KEYS", "")
    key_list = [k.strip() for k in keys.split(",") if k.strip()]
    if not key_list:
        raise ValueError("GROQ_API_KEYS not configured")
    api_key = random.choice(key_list)
    return Groq(api_key=api_key)

async def extract_text(file: UploadFile) -> str:
    """
    Extract text from various file formats.
    """
    content = await file.read()
    filename = file.filename.lower()
    text = ""
    
    try:
        if filename.endswith(".pdf"):
            # Use PyMuPDF for PDF text extraction
            pdf_document = fitz.open(stream=content, filetype="pdf")
            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                page_text = page.get_text()
                
                # If page has no text, try OCR on images
                if not page_text.strip():
                    pix = page.get_pixmap()
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    try:
                        buffered = io.BytesIO()
                        img.save(buffered, format="JPEG")
                        base64_image = base64.b64encode(buffered.getvalue()).decode('utf-8')
                        
                        client = get_groq_client()
                        res = client.chat.completions.create(
                            messages=[
                                {
                                    "role": "user",
                                    "content": [
                                        {"type": "text", "text": "Extract all text from this image exactly as written. If there are diagrams, describe them briefly. If there is no text, describe the image."},
                                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}},
                                    ],
                                }
                            ],
                            model="llama-3.2-11b-vision-preview",
                        )
                        page_text = res.choices[0].message.content
                    except Exception as e:
                        print(f"Groq Vision failed on PDF page {page_num}: {e}")
                
                text += page_text + "\n\n"
                
        elif filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(content))
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            
        elif filename.endswith((".xlsx", ".xls")):
            wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
            for sheet in wb.sheetnames:
                ws = wb[sheet]
                text += f"--- Sheet: {sheet} ---\n"
                for row in ws.iter_rows(values_only=True):
                    row_text = " | ".join([str(cell) for cell in row if cell is not None])
                    if row_text:
                        text += row_text + "\n"
                text += "\n"
                
        elif filename.endswith((".pptx", ".ppt")):
            prs = Presentation(io.BytesIO(content))
            for i, slide in enumerate(prs.slides):
                text += f"--- Slide {i+1} ---\n"
                for shape in slide.shapes:
                    if hasattr(shape, "text"):
                        text += shape.text + "\n"
                text += "\n"
                
        elif filename.endswith((".txt", ".md", ".csv")):
            text = content.decode("utf-8")
            
        elif filename.endswith((".png", ".jpg", ".jpeg", ".webp")):
            try:
                # Convert content to base64
                base64_image = base64.b64encode(content).decode('utf-8')
                mime_type = f"image/{filename.split('.')[-1].lower()}"
                if mime_type == "image/jpg": mime_type = "image/jpeg"
                
                client = get_groq_client()
                res = client.chat.completions.create(
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Extract all text from this image exactly as written. If there are diagrams or charts, describe them in detail. If there is no text, describe the image fully."},
                                {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}},
                            ],
                        }
                    ],
                    model="llama-3.2-11b-vision-preview",
                )
                text = res.choices[0].message.content
            except Exception as e:
                print(f"Groq Image Vision failed: {e}")
                text = "Failed to extract text from image."
        else:
            text = f"Unsupported file type: {filename}"
            
    except Exception as e:
        print(f"Text extraction error for {filename}: {e}")
        text = f"Error extracting text from {filename}."
        
    return text

def chunk_text(text: str) -> list[str]:
    """
    Split text into smaller chunks for vectorization using LangChain's splitter.
    """
    if not text.strip():
        return []
        
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        is_separator_regex=False,
    )
    
    return text_splitter.split_text(text)

async def process_upload(file: UploadFile, user_id: str):
    """
    Process an uploaded file: extract text, chunk it, embed it, and store it.
    """
    # 1. Extract text
    text = await extract_text(file)
    
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if not text.strip():
        return {"filename": file.filename, "size": file_size, "status": "failed", "reason": "No text extracted"}
        
    # 2. Chunk text
    chunks = chunk_text(text)
    
    if not chunks:
        return {"filename": file.filename, "size": file_size, "status": "failed", "reason": "Chunking failed"}
        
    # 3. Embed chunks
    embeddings = get_embeddings(chunks)
    
    # 4. Store in ChromaDB
    document_id = str(uuid.uuid4())
    success = store_chunks(user_id, document_id, file.filename, chunks, embeddings)
    
    if success:
        return {
            "filename": file.filename,
            "document_id": document_id,
            "chunks_stored": len(chunks),
            "size": file_size,
            "status": "success"
        }
    return {"filename": file.filename, "size": file_size, "status": "failed", "reason": "Database storage failed"}
