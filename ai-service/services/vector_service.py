import chromadb
from chromadb.config import Settings
import os

# Ensure chromadb data directory exists
DB_PATH = os.path.join(os.getcwd(), "chroma_data")
os.makedirs(DB_PATH, exist_ok=True)

# Initialize ChromaDB persistent client
client = chromadb.PersistentClient(path=DB_PATH)

def get_user_collection(user_id: str):
    """
    Get or create a dedicated ChromaDB collection for a specific user.
    This ensures complete isolation of user data.
    """
    collection_name = f"user_{user_id.replace('-', '_')}"
    return client.get_or_create_collection(name=collection_name)

def store_chunks(user_id: str, document_id: str, filename: str, chunks: list[str], embeddings: list[list[float]]):
    """
    Store document chunks and their embeddings into the user's collection.
    """
    if not chunks or not embeddings:
        return False
        
    collection = get_user_collection(user_id)
    
    ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"document_id": document_id, "filename": filename, "chunk_index": i} for i in range(len(chunks))]
    
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas
    )
    return True

def search_chunks(user_id: str, query_embedding: list[float], n_results: int = 5):
    """
    Search the user's collection for the most similar chunks.
    """
    try:
        collection = get_user_collection(user_id)
        
        # If collection is empty, this will raise or return empty
        if collection.count() == 0:
            return []
            
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        
        # Format results
        if not results or not results['documents'] or len(results['documents'][0]) == 0:
            return []
            
        formatted_results = []
        for i in range(len(results['documents'][0])):
            formatted_results.append({
                "text": results['documents'][0][i],
                "metadata": results['metadatas'][0][i],
                "distance": results['distances'][0][i] if 'distances' in results and results['distances'] else 0
            })
            
        return formatted_results
    except Exception as e:
        print(f"Vector search error: {e}")
        return []

def delete_collection_for_user(user_id: str):
    """
    Delete a user's entire collection.
    """
    try:
        collection_name = f"user_{user_id.replace('-', '_')}"
        client.delete_collection(name=collection_name)
        return True
    except Exception as e:
        print(f"Delete collection error: {e}")
        return False
