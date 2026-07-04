from services.embedding_service import get_embeddings
from services.vector_service import search_chunks

def retrieve_context(query: str, user_id: str, top_k: int = 5) -> str:
    """
    Perform semantic search for a query across isolated collections in priority order.
    Priority: 1. Current User's files, 2. Official Resources, 3. Official PYQs
    """
    if not query.strip():
        return ""
        
    query_embeddings = get_embeddings([query])
    if not query_embeddings:
        return ""
        
    # Search across all isolated collections
    user_results = search_chunks(user_id, query_embeddings[0], n_results=top_k)
    resource_results = search_chunks("official_resources", query_embeddings[0], n_results=top_k)
    pyq_results = search_chunks("official_pyqs", query_embeddings[0], n_results=top_k)
    
    context_parts = []
    
    if user_results:
        context_parts.append("=== YOUR PERSONAL UPLOADS ===")
        for res in user_results:
            filename = res["metadata"].get("filename", "Unknown file")
            context_parts.append(f"--- SOURCE: {filename} ---\n{res['text']}\n")
            
    if resource_results:
        context_parts.append("=== OFFICIAL RESOURCES ===")
        for res in resource_results:
            filename = res["metadata"].get("filename", "Unknown file")
            context_parts.append(f"--- SOURCE: {filename} ---\n{res['text']}\n")
            
    if pyq_results:
        context_parts.append("=== OFFICIAL QUESTION PAPERS ===")
        for res in pyq_results:
            filename = res["metadata"].get("filename", "Unknown file")
            context_parts.append(f"--- SOURCE: {res['metadata'].get('filename')} ---\n{res['text']}\n")
            
    return "\n".join(context_parts)
