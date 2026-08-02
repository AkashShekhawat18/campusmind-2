from services.embedding_service import get_embeddings
from services.vector_service import search_chunks, get_recent_chunks

def classify_query_intent(query: str) -> str:
    """
    Classifies user query intent:
    - 'DOCUMENT_SUMMARY': Asking for overview, summary, explanation of uploaded file
    - 'SPECIFIC_QUESTION': Asking for a specific question, formula, problem, or section (e.g. 'Question 5', 'MCQs')
    - 'CONVERSATIONAL': General greeting or pure LLM knowledge request
    """
    q_lower = query.lower()
    
    summary_keywords = [
        "explain", "summarize", "summary", "overview", "what is", "about", 
        "pdf", "file", "document", "attached", "photo", "image", "describe", 
        "analyze", "analysis", "key points", "tell me", "content", "details"
    ]
    
    specific_keywords = [
        "question", "q1", "q2", "q3", "q4", "q5", "q6", "mcq", "viva", 
        "solve", "equation", "formula", "diagram", "table", "translate", 
        "generate", "problem", "code", "solution", "section", "part"
    ]
    
    if any(kw in q_lower for kw in summary_keywords):
        return "DOCUMENT_SUMMARY"
    elif any(kw in q_lower for kw in specific_keywords):
        return "SPECIFIC_QUESTION"
    return "CONVERSATIONAL"

def retrieve_context(query: str, user_id: str, chat_id: str = None, top_k: int = 8) -> str:
    """
    Intelligent Context Retrieval Pipeline for CampusGPT:
    1. Search active chat_id documents and persistent user knowledge base.
    2. Format source metadata and chunks cleanly for LLM reasoning.
    """
    if not query.strip():
        print("[RAG Retrieval] Empty query passed. Returning empty context.")
        return ""
        
    safe_chat_id = str(chat_id).strip() if chat_id else ""
    intent = classify_query_intent(query)
    
    results = []
    # 1. Embed query and search ChromaDB vector store (active chat + persistent User Knowledge Base)
    query_embeddings = get_embeddings([query])
    if query_embeddings:
        results = search_chunks(user_id, query_embeddings[0], n_results=top_k, chat_id=safe_chat_id)
    
    # 2. If vector search yields no hits or query asks for document summary/follow-up, retrieve recent chunks from knowledge base
    if not results or intent in ["DOCUMENT_SUMMARY", "SPECIFIC_QUESTION"]:
        recent_results = get_recent_chunks(user_id, limit=top_k, chat_id=safe_chat_id)
        if recent_results:
            seen_texts = set(r.get("text", "") for r in results)
            for r in recent_results:
                if r.get("text", "") not in seen_texts:
                    results.append(r)
                    seen_texts.add(r.get("text", ""))

    if not results:
        print(f"[RAG Retrieval] Context empty for user_id='{user_id}', chat_id='{safe_chat_id}'")
        return ""
        
    # 3. Assemble structured context
    context_parts = []
    seen_sources = set()
    
    for res in results[:top_k]:
        filename = res.get("metadata", {}).get("filename", "Uploaded Document")
        text = res.get("text", "")
        if text:
            seen_sources.add(filename)
            context_parts.append(f"--- KNOWLEDGE SOURCE: {filename} ---\n{text}\n")
            
    final_context = "\n".join(context_parts)

    print("\n========== RETRIEVED KNOWLEDGE BASE CONTEXT ==========")
    print(final_context[:800])
    print("======================================================\n")

    return final_context
