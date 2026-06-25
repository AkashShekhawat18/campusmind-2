from sentence_transformers import SentenceTransformer

# Load a fast, lightweight local embedding model
# all-MiniLM-L6-v2 produces 384-dimensional embeddings and is great for RAG.
print("Loading embedding model (this may take a moment on first run)...")
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
print("Embedding model loaded successfully.")

def get_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generate vector embeddings for a list of text chunks.
    """
    if not texts:
        return []
    
    # Generate embeddings and convert to list of floats
    embeddings = embedding_model.encode(texts, show_progress_bar=False)
    return embeddings.tolist()
