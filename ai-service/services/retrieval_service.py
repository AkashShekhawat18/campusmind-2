from services.embedding_service import get_embeddings
from services.vector_service import search_chunks

def retrieve_context(query: str, user_id: str, top_k: int = 5) -> str:
    """
    Perform semantic search for a query and return a concatenated context string.
    """
    if not query.strip():
        return ""
        
    # 1. Embed the user query
    query_embeddings = get_embeddings([query])
    if not query_embeddings:
        return ""
        
    # 2. Search ChromaDB
    results = search_chunks(user_id, query_embeddings[0], n_results=top_k)
    
    if not results:
        return ""
        
    # 3. Format context
    context_parts = []
    for res in results:
        # Distance is a measure of similarity (smaller is better usually for L2)
        # Filter out results that are too far (L2 distance > 1.2 for all-MiniLM-L6-v2 usually means irrelevant)
        distance = res.get("distance", 0)
        if distance > 1.2:
            continue
            
        filename = res["metadata"].get("filename", "Unknown file")
        text = res["text"]
        context_parts.append(f"--- SOURCE: {filename} ---\n{text}\n")
        
    return "\n".join(context_parts)
