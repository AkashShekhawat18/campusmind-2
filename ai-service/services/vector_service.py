import chromadb
from chromadb.config import Settings
import os

# Ensure chromadb data directory exists
DB_PATH = os.path.join(os.getcwd(), "chroma_data")
os.makedirs(DB_PATH, exist_ok=True)

# Initialize ChromaDB persistent client
client = chromadb.PersistentClient(path=DB_PATH)

import re

def sanitize_user_id(user_id: str) -> str:
    if not user_id or str(user_id).strip() in ["null", "undefined", "None", ""]:
        return "demo-user"
    clean = re.sub(r'[^a-zA-Z0-9_-]', '_', str(user_id).strip())
    return clean if clean else "demo-user"

def get_user_collection(user_id: str):
    """
    Get or create a dedicated ChromaDB collection for a specific user.
    This ensures complete isolation of user data.
    """
    clean_id = sanitize_user_id(user_id)
    collection_name = f"user_{clean_id}"
    # Ensure collection_name adheres to ChromaDB rules (3-63 chars)
    if len(collection_name) > 63:
        collection_name = collection_name[:63]
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

def search_chunks(user_id: str, query_embedding: list[float], n_results: int = 6):
    """
    Search the user's collection for the most similar chunks.
    If current user collection is empty, fall back to checking demo-user or other collections.
    """
    try:
        clean_id = sanitize_user_id(user_id)
        collection = get_user_collection(clean_id)
        
        # Fallback search if current user collection is empty: check 'demo-user' or 'null'
        if collection.count() == 0:
            for fallback_id in ["demo-user", "null"]:
                if fallback_id != clean_id:
                    fb_col = get_user_collection(fallback_id)
                    if fb_col.count() > 0:
                        collection = fb_col
                        break
                        
        if collection.count() == 0:
            return []
            
        # Ensure n_results does not exceed total count in collection
        actual_n = min(n_results, collection.count())
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=actual_n
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

def get_recent_chunks(user_id: str, limit: int = 6):
    """
    Get raw chunks directly from the user's collection (used when query is general summary/explanation).
    """
    try:
        clean_id = sanitize_user_id(user_id)
        collection = get_user_collection(clean_id)
        
        if collection.count() == 0:
            for fallback_id in ["demo-user", "null"]:
                if fallback_id != clean_id:
                    fb_col = get_user_collection(fallback_id)
                    if fb_col.count() > 0:
                        collection = fb_col
                        break
                        
        if collection.count() == 0:
            return []
            
        data = collection.get(limit=limit)
        if not data or not data.get('documents'):
            return []
            
        formatted_results = []
        for i in range(len(data['documents'])):
            formatted_results.append({
                "text": data['documents'][i],
                "metadata": data['metadatas'][i] if data.get('metadatas') else {},
                "distance": 0.0
            })
        return formatted_results
    except Exception as e:
        print(f"Get recent chunks error: {e}")
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
