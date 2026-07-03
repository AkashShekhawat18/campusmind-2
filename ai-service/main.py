from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uvicorn
import os
from dotenv import load_dotenv

from services.upload_service import process_upload
from services.chat_service import handle_chat_stream
from services.vector_service import delete_collection_for_user

# New PYQ Redesign Imports
from services.document_ingestion import ingest_pdf
from services.question_extraction import extract_questions_from_text
from services.similarity_service import generate_embedding, find_most_similar
from services.analytics_service import compute_paper_analytics
from services.rewrite_service import generate_rewrite

# Import Agents
from agents.ocr_agent import OCRAgent
from agents.question_extraction_agent import QuestionExtractionAgent
from agents.retrieval_agent import RetrievalAgent
from agents.answer_agent import AnswerAgent
from agents.verification_agent import VerificationAgent
from agents.question_generator_agent import QuestionGeneratorAgent
import chromadb

from services.embedding_service import get_embeddings
DB_PATH = os.path.join(os.getcwd(), "chroma_data")
chroma_client = chromadb.PersistentClient(path=DB_PATH)

# Instantiate Agents
ocr_agent = OCRAgent()
question_agent = QuestionExtractionAgent()
retrieval_agent = RetrievalAgent(chroma_client, type('EmbeddingServiceMock', (), {'get_embeddings': get_embeddings}))
answer_agent = AnswerAgent()
verification_agent = VerificationAgent()
q_gen_agent = QuestionGeneratorAgent()

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

@app.post("/api/ai/pyq/chat")
async def multi_agent_rag_chat(
    message: str = Form(...),
    user_id: str = Form(...),
    history: str = Form("[]")
):
    """
    Multi-Agent RAG Orchestration:
    1. Retrieval Agent (Hybrid Search + Reranking)
    2. Answer Agent (Grounded Generation)
    3. Verification Agent (Hallucination Guard)
    """
    try:
        import json
        history_list = json.loads(history)
        
        # 1. Retrieve
        print(f"Retrieving context for: {message}")
        context_results = retrieval_agent.hybrid_search(message, user_id, top_k=5)
        
        # 2. Answer
        print(f"Generating answer...")
        answer, references = answer_agent.generate_answer(message, context_results, history_list)
        
        # 3. Verify (Hallucination Guard)
        print(f"Verifying answer...")
        confidence, final_answer = verification_agent.verify_answer(message, answer, context_results)
        
        return {
            "reply": final_answer,
            "confidence": confidence,
            "references": references
        }
    except Exception as e:
        print(f"Multi-Agent RAG Error: {e}")
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
async def extract_pyq(
    file: UploadFile = File(...),
):
    """
    Extracts structured questions from a PDF, performing OCR and image preprocessing if needed.
    Returns a list of extracted question objects.
    """
    try:
        # We now use the specialized OCR Agent if it's an image or image-PDF
        # For simple PDFs, ingest_pdf still works, but we should try OCR for robust layout extraction
        file_bytes = await file.read()
        
        try:
            # Attempt OCR Agent extraction first for highest layout fidelity
            full_text = ocr_agent.extract_text(file_bytes, file.content_type)
        except Exception:
            full_text = None
            
        if not full_text:
            # Fallback to standard PDF ingestion
            await file.seek(0)
            pages = await ingest_pdf(file)
            full_text = "\n".join([p["text"] for p in pages])
        
        # Extract structured questions using the specialized agent
        questions = question_agent.extract_questions(full_text)
        
        # Generate embeddings for each question
        for q in questions:
            q_text = q.get("questionText", "")
            if q_text:
                q["embedding"] = generate_embedding(q_text)
            else:
                q["embedding"] = []
                
        return {"status": "success", "questions": questions, "full_text": full_text}
    except Exception as e:
        print(f"PYQ Extraction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/pyq/similarity")
async def compute_similarity(
    questions: list = Body(...), # list of current extracted questions
    historical_pool: list = Body(...) # list of all historical questions from DB
):
    """
    Computes semantic similarity for the current questions against the historical pool.
    Returns similarity results and paper-level analytics.
    """
    try:
        similarity_results = []
        for q in questions:
            target_emb = q.get("embedding")
            if not target_emb:
                continue
                
            matches = find_most_similar(target_emb, historical_pool, threshold=0.75)
            
            # Map matches to similarity results
            for match in matches:
                similarity_results.append({
                    "sourceQuestionId": q.get("id", "temp_id"),
                    "matchedQuestionId": match["matchedQuestionId"],
                    "similarityScore": match["similarityScore"],
                    "matchType": match["matchType"],
                    "matchedYear": match.get("matchedYear"),
                    "matchedPaperTitle": match.get("matchedPaperTitle"),
                    "matchedSubject": match.get("matchedSubject")
                })
                
        analytics = compute_paper_analytics(questions, similarity_results)
        
        return {
            "status": "success",
            "similarityResults": similarity_results,
            "analytics": analytics
        }
    except Exception as e:
        print(f"Similarity Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/pyq/rewrite")
async def rewrite_question(
    original_text: str = Form(...),
    marks: int = Form(5),
    topic: str = Form("General")
):
    """
    Generates a fresh question rewrite for a repeated question.
    """
    try:
        rewrite = q_gen_agent.generate_rewrite(original_text, marks, topic)
        return {"status": "success", "rewrittenText": rewrite}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
