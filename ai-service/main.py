from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uvicorn
import os
from dotenv import load_dotenv

from services.upload_service import process_upload
from services.chat_service import handle_chat_stream
from services.vector_service import delete_collection_for_user

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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
