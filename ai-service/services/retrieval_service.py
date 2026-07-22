from services.embedding_service import get_embeddings
from services.vector_service import search_chunks, get_recent_chunks

def is_general_doc_query(query: str) -> bool:
    """
    Check if the query is asking for general document overview, explanation, or summary.
    """
    q_lower = query.lower()
    keywords = [
        "explain", "summarize", "summary", "overview", "what is", "about", 
        "pdf", "file", "document", "attached", "describe", "analyze", "analysis",
        "key points", "tell me", "content", "details"
    ]
    return any(kw in q_lower for kw in keywords)

def retrieve_context(query: str, user_id: str, top_k: int = 6) -> str:
    """
    Perform semantic search for a query and return a concatenated context string.
    """
    if not query.strip():
        return ""
        
    is_general = is_general_doc_query(query)
    
    # 1. Embed the user query
    query_embeddings = get_embeddings([query])
    results = []
    if query_embeddings:
        # 2. Search ChromaDB
        results = search_chunks(user_id, query_embeddings[0], n_results=top_k)
    
    # If vector search produced no results and query is asking about a document, try direct collection retrieval
    if not results:
        results = get_recent_chunks(user_id, limit=top_k)
        
    if not results:
        return ""
        
    # 3. Format context
    context_parts = []
    MAX_DISTANCE = 3.0 if is_general else 1.8
    
    for res in results:
        distance = res.get("distance", 0)
        if distance > MAX_DISTANCE and not is_general:
            continue
            
        filename = res.get("metadata", {}).get("filename", "Uploaded document")
        text = res.get("text", "")
        if text:
            context_parts.append(f"--- SOURCE: {filename} ---\n{text}\n")
        
    # Fallback: If distance threshold filtered out everything, but documents exist in the collection,
    # include top results so the LLM is aware of the user's uploaded document content.
    if not context_parts and results:
        for res in results[:top_k]:
            filename = res.get("metadata", {}).get("filename", "Uploaded document")
            text = res.get("text", "")
            if text:
                context_parts.append(f"--- SOURCE: {filename} ---\n{text}\n")
            
    return "\n".join(context_parts)
