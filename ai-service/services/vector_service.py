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

def get_global_pyq_collection():
    """
    Get or create the shared ChromaDB collection for the Global PYQ Library.
    """
    return client.get_or_create_collection(name="global_pyq")

def store_global_pyq_chunks(paper_id: str, questions: list[dict], embeddings: list[list[float]]):
    """
    Store PYQ questions and their embeddings into the global collection.
    """
    if not questions or not embeddings:
        return False
        
    collection = get_global_pyq_collection()
    
    ids = [f"{paper_id}_q_{q.get('id', i)}" for i, q in enumerate(questions)]
    
    documents = []
    metadatas = []
    
    for i, q in enumerate(questions):
        text = q.get("questionText", "")
        if q.get("latex"):
            text += f"\nLaTeX: {q.get('latex')}"
            
        documents.append(text)
        
        meta = {
            "paper_id": paper_id,
            "question_id": str(q.get("id", i)),
            "marks": int(q.get("marks", 0)) if q.get("marks") else 0,
            "topic": str(q.get("topic", ""))
        }
        
        q_meta = q.get("metadata", {})
        if q_meta:
            for k, v in q_meta.items():
                if isinstance(v, (str, int, float, bool)) and v:
                    meta[f"meta_{k}"] = v
                    
        metadatas.append(meta)
        
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas
    )
    return True

def search_global_pyq(query_embedding: list[float], n_results: int = 15):
    """
    Search the global PYQ collection for the most relevant historical questions.
    """
    try:
        collection = get_global_pyq_collection()
        
        if collection.count() == 0:
            return []
            
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        
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
        print(f"Global vector search error: {e}")
        return []
