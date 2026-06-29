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
    # Using L2 distance threshold (default for all-MiniLM-L6-v2). Lower is more similar.
    # A typical threshold for relevance might be around 1.5
    for res in results:
        distance = res.get("distance", 0)
        if distance > 1.5:
            continue
            
        filename = res["metadata"].get("filename", "Unknown file")
        text = res["text"]
        context_parts.append(f"--- SOURCE: {filename} ---\n{text}\n")
        
    return "\n".join(context_parts)
