import numpy as np
from typing import List, Dict, Any, Tuple
from sentence_transformers import SentenceTransformer

# Load a lightweight, fast local model for embeddings
_model = None

def get_model():
    global _model
    if _model is None:
        try:
            _model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            print(f"Failed to load local SentenceTransformer: {e}")
            _model = "fallback_mock"
    return _model

def generate_embedding(text: str) -> List[float]:
    """Generates an embedding for a piece of text."""
    model = get_model()
    if model == "fallback_mock":
        # Fallback if torch/transformers isn't installed properly
        return [0.0] * 384
        
    embedding = model.encode(text)
    return embedding.tolist()

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Computes cosine similarity between two vectors."""
    try:
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        if len(v1) != len(v2):
            return 0.0
        if np.linalg.norm(v1) == 0 or np.linalg.norm(v2) == 0:
            return 0.0
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
    except Exception:
        return 0.0

def find_most_similar(target_embedding: List[float], historical_pool: List[Dict[str, Any]], threshold: float = 0.75) -> List[Dict[str, Any]]:
    """
    Finds semantically similar questions from the historical pool.
    historical_pool should be a list of dicts: {"id": str, "embedding": List[float], "text": str, "paperTitle": str, "year": int}
    """
    results = []
    for hist in historical_pool:
        if not hist.get("embedding"):
            continue
            
        sim = cosine_similarity(target_embedding, hist["embedding"])
        if sim >= threshold:
            # Treat very high similarity as an exact match (100%) to avoid confusing the user with 98.09% for identical questions
            is_exact = sim >= 0.98
            sim_score = 100.0 if is_exact else round(float(sim * 100), 1)
            
            results.append({
                "matchedQuestionId": hist["id"],
                "similarityScore": sim_score,
                "matchType": "EXACT" if is_exact else "SEMANTIC",
                "matchedYear": hist.get("year"),
                "matchedPaperTitle": hist.get("paperTitle"),
                "matchedSubject": hist.get("subject"),
                "matchedText": hist.get("text")
            })
            
    # Sort by similarity descending
    results.sort(key=lambda x: x["similarityScore"], reverse=True)
    return results
