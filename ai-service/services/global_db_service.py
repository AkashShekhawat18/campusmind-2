import sqlite3
import os
from typing import List, Dict, Any

DB_PATH = os.path.join(os.getcwd(), "..", "backend", "prisma", "dev.db")

def search_global_pyqs(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Search the global PYQ table (ExtractedQuestion) for relevant text using simple LIKE.
    """
    if not os.path.exists(DB_PATH):
        print(f"DB not found at {DB_PATH}")
        return []
        
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Simple keyword search fallback (since SQLite doesn't have native vector search)
        keywords = [k for k in query.split() if len(k) > 3] # only search meaningful words
        if not keywords:
            keywords = [query.strip()]
            
        # Build query (simplified matching)
        base_query = "SELECT id, questionText, topic, marks FROM ExtractedQuestion WHERE "
        conditions = " OR ".join(["questionText LIKE ?" for _ in keywords])
        full_query = base_query + conditions + f" LIMIT {limit}"
        
        params = [f"%{k}%" for k in keywords]
        
        cursor.execute(full_query, params)
        rows = cursor.fetchall()
        
        results = []
        for row in rows:
            results.append({
                "id": row["id"],
                "text": row["questionText"],
                "topic": row["topic"],
                "marks": row["marks"]
            })
            
        conn.close()
        return results
    except Exception as e:
        print(f"Global PYQ Search Error: {e}")
        return []
