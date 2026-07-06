from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uvicorn
import os
from dotenv import load_dotenv

from services.upload_service import process_upload
from services.chat_service import handle_chat_stream
from services.vector_service import delete_collection_for_user
from services.document_intelligence import process_pyq_document
from services.similarity_engine import search_pyq_database, compute_overall_paper_analytics
from services.replacement_engine import generate_question_replacement, generate_updated_pdf
from services.pyq_chat import stream_pyq_chat
from fastapi.responses import Response


load_dotenv()

app = FastAPI(title="CampusMind AI Microservice", version="1.0")

# CORS for direct frontend access if needed (Node proxy is preferred)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "campusmind-ai"}

@app.post("/api/ai/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    user_id: str = Form(...),
):
    """
    Handle document uploads: extract text (OCR if needed), chunk, and embed into ChromaDB.
    """
    try:
        results = []
        for file in files:
            result = await process_upload(file, user_id)
            results.append(result)
        return {"status": "success", "results": results}
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/chat/stream")
async def chat_stream(
    message: str = Form(...),
    user_id: str = Form(...),
    chat_id: Optional[str] = Form(None),
    history: str = Form("[]"), # JSON string of history
):
    """
    Stream response using RAG: Retrieve context -> Assemble prompt -> Stream Groq response.
    """
    try:
        import json
        history_list = json.loads(history)
        
        # Returns a StreamingResponse
        return await handle_chat_stream(message, user_id, chat_id, history_list)
    except Exception as e:
        print(f"Chat Stream Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/ai/memory/{user_id}")
async def clear_memory(user_id: str):
    """
    Clear all vector embeddings for a specific user.
    """
    success = delete_collection_for_user(user_id)
    if success:
        return {"status": "success", "message": "Memory cleared"}
    raise HTTPException(status_code=500, detail="Failed to clear memory")

@app.post("/api/ai/pyq/extract")
async def extract_pyq(file: UploadFile = File(...)):
    """
    Extracts structured questions from a PDF or Image using Groq Vision and OpenCV.
    """
    try:
        file_bytes = await file.read()
        questions = await process_pyq_document(file_bytes, file.filename, file.content_type)
        return {"status": "success", "questions": questions}
    except Exception as e:
        print(f"PYQ Extraction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/pyq/similarity")
async def compute_similarity(
    questions: list = Body(...),
    historical_pool: list = Body(...)
):
    """
    Computes deep semantic similarity across 6 dimensions.
    """
    try:
        reports = search_pyq_database(questions, historical_pool)
        analytics = compute_overall_paper_analytics(questions, reports)
        
        return {
            "status": "success",
            "similarityResults": reports,
            "analytics": analytics
        }
    except Exception as e:
        print(f"Similarity Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/pyq/replace")
async def replace_question(
    original_question: dict = Body(...)
):
    """
    Generates a replacement for a repeated question.
    """
    try:
        replacement = generate_question_replacement(original_question)
        return {"status": "success", "replacement": replacement}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/pyq/generate-pdf")
async def generate_pdf(
    questions: list = Body(...),
    title: str = Body("Updated Question Paper")
):
    """
    Generates a new PDF with the updated questions.
    """
    try:
        pdf_bytes = generate_updated_pdf(questions, title)
        return Response(content=pdf_bytes, media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/pyq/chat/stream")
async def pyq_chat_stream(
    message: str = Form(...),
    chat_type: str = Form(...),
    context_data: str = Form("{}"),
    history: str = Form("[]")
):
    try:
        import json
        ctx = json.loads(context_data)
        hist = json.loads(history)
        return await stream_pyq_chat(message, chat_type, ctx, hist)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
