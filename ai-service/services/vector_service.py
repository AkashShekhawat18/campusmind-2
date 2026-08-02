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

import time

def store_chunks(user_id: str, document_id: str, filename: str, chunks: list[str], embeddings: list[list[float]], chat_id: str = None):
    """
    Store document chunks and their embeddings into the user's collection with metadata:
    user_id, document_id, filename, chat_id, knowledge_scope='user', upload_time, chunk_index.
    """
    if not chunks or not embeddings:
        return False
        
    collection = get_user_collection(user_id)
    safe_chat_id = str(chat_id).strip() if chat_id else ""
    upload_time = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{
        "user_id": str(user_id),
        "document_id": document_id,
        "filename": filename,
        "chat_id": safe_chat_id,
        "knowledge_scope": "user",
        "upload_time": upload_time,
        "chunk_index": i
    } for i in range(len(chunks))]
    
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas
    )
    print(f"[Vector Store] Stored {len(chunks)} knowledge base chunks for user_id='{user_id}', filename='{filename}'")
    return True

def search_chunks(user_id: str, query_embedding: list[float], n_results: int = 8, chat_id: str = None):
    """
    Search order:
    1. Active chat_id documents (if active chat_id exists)
    2. User persistent knowledge base (collection for user_id)
    Merge results, remove duplicates, return top_k.
    """
    try:
        clean_id = sanitize_user_id(user_id)
        collection = get_user_collection(clean_id)
        
        if collection.count() == 0:
            return []
            
        actual_n = min(n_results, collection.count())
        safe_chat_id = str(chat_id).strip() if chat_id else ""
        
        chat_results = []
        if safe_chat_id:
            try:
                res1 = collection.query(
                    query_embeddings=[query_embedding],
                    n_results=actual_n,
                    where={"chat_id": safe_chat_id}
                )
                if res1 and res1.get('documents') and len(res1['documents'][0]) > 0:
                    for i in range(len(res1['documents'][0])):
                        chat_results.append({
                            "text": res1['documents'][0][i],
                            "metadata": res1['metadatas'][0][i],
                            "distance": res1['distances'][0][i] if 'distances' in res1 and res1['distances'] else 0
                        })
            except Exception as e1:
                print(f"[Vector Search] Chat query error: {e1}")

        kb_results = []
        try:
            res2 = collection.query(
                query_embeddings=[query_embedding],
                n_results=actual_n
            )
            if res2 and res2.get('documents') and len(res2['documents'][0]) > 0:
                for i in range(len(res2['documents'][0])):
                    kb_results.append({
                        "text": res2['documents'][0][i],
                        "metadata": res2['metadatas'][0][i],
                        "distance": res2['distances'][0][i] if 'distances' in res2 and res2['distances'] else 0
                    })
        except Exception as e2:
            print(f"[Vector Search] KB query error: {e2}")

        merged = []
        seen_texts = set()
        for r in chat_results + kb_results:
            txt = r.get("text", "")
            if txt and txt not in seen_texts:
                seen_texts.add(txt)
                merged.append(r)
                
        return merged[:n_results]
    except Exception as e:
        print(f"Vector search error: {e}")
        return []

def get_recent_chunks(user_id: str, limit: int = 8, chat_id: str = None):
    """
    Retrieve recent chunks from active chat or persistent user knowledge base.
    """
    try:
        clean_id = sanitize_user_id(user_id)
        collection = get_user_collection(clean_id)
        
        if collection.count() == 0:
            return []
            
        safe_chat_id = str(chat_id).strip() if chat_id else ""
        results = []
        
        if safe_chat_id:
            try:
                d1 = collection.get(limit=limit, where={"chat_id": safe_chat_id})
                if d1 and d1.get('documents'):
                    for i in range(len(d1['documents'])):
                        results.append({
                            "text": d1['documents'][i],
                            "metadata": d1['metadatas'][i] if d1.get('metadatas') else {},
                            "distance": 0.0
                        })
            except Exception:
                pass
                
        if not results:
            try:
                d2 = collection.get(limit=limit)
                if d2 and d2.get('documents'):
                    for i in range(len(d2['documents'])):
                        results.append({
                            "text": d2['documents'][i],
                            "metadata": d2['metadatas'][i] if d2.get('metadatas') else {},
                            "distance": 0.0
                        })
            except Exception:
                pass

        seen_texts = set()
        dedup = []
        for r in results:
            t = r.get("text", "")
            if t and t not in seen_texts:
                seen_texts.add(t)
                dedup.append(r)
                
        return dedup[:limit]
    except Exception as e:
        print(f"Get recent chunks error: {e}")
        return []

def delete_chunks_for_chat(user_id: str, chat_id: str):
    """
    Delete temporary chat-specific context when a chat session is deleted.
    Preserves persistent user knowledge base chunks (knowledge_scope="user").
    """
    try:
        clean_id = sanitize_user_id(user_id)
        collection = get_user_collection(clean_id)
        safe_chat_id = str(chat_id).strip() if chat_id else ""
        if safe_chat_id and collection.count() > 0:
            try:
                collection.delete(where={"chat_id": safe_chat_id, "knowledge_scope": "temp"})
            except Exception:
                pass
            print(f"[Vector Store] Purged chat-specific context for chat '{safe_chat_id}' while preserving Knowledge Base")
        return True
    except Exception as e:
        print(f"Delete chunks for chat error: {e}")
        return False

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
