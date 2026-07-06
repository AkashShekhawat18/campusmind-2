import os
from typing import List, Dict, Any
from rank_bm25 import BM25Okapi
import chromadb
from sentence_transformers import CrossEncoder

class RetrievalAgent:
    """
    Agent responsible for Hybrid Search (Semantic + BM25) and Cross-Encoder Re-ranking.
    """
    def __init__(self, chroma_client: chromadb.PersistentClient, embedding_service):
        self.chroma_client = chroma_client
        self.embedding_service = embedding_service
        
        # Load cross-encoder for re-ranking
        # ms-marco-MiniLM-L-6-v2 is fast and excellent for reranking search results
        try:
            self.cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2', max_length=512)
        except Exception as e:
            print(f"Failed to load CrossEncoder: {e}")
            self.cross_encoder = None

    def hybrid_search(self, query: str, user_id: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Executes hybrid search (Semantic Vector Search + BM25 Keyword Search).
        """
        collection_name = f"user_{user_id.replace('-', '_')}"
        try:
            collection = self.chroma_client.get_collection(name=collection_name)
        except Exception:
            return [] # Collection does not exist
            
        if collection.count() == 0:
            return []

        # 1. Semantic Search
        query_emb = self.embedding_service.get_embeddings([query])[0]
        
        # We fetch more than top_k for semantic search to allow for BM25 fusion and reranking
        semantic_results = collection.query(
            query_embeddings=[query_emb],
            n_results=top_k * 2
        )
        
        # Build document dictionary from semantic results
        candidates = {}
        if semantic_results and semantic_results['documents'] and len(semantic_results['documents'][0]) > 0:
            for i, doc_text in enumerate(semantic_results['documents'][0]):
                doc_id = semantic_results['ids'][0][i]
                metadata = semantic_results['metadatas'][0][i] if semantic_results['metadatas'] else {}
                candidates[doc_id] = {
                    "id": doc_id,
                    "text": doc_text,
                    "metadata": metadata,
                    "semantic_rank": i
                }

        # 2. BM25 Keyword Search
        # To do BM25 properly, we'd need all documents in memory. 
        # Since Chroma doesn't natively support full BM25 without a plugin, 
        # we will fetch the entire collection (if small) or just rerank the semantic candidates using BM25.
        # Given this is a personal user vault, fetching all docs is feasible for up to 10k docs.
        try:
            all_data = collection.get()
            all_docs = all_data['documents']
            all_ids = all_data['ids']
            all_metadatas = all_data['metadatas']
            
            if all_docs:
                tokenized_corpus = [doc.split(" ") for doc in all_docs]
                bm25 = BM25Okapi(tokenized_corpus)
                tokenized_query = query.split(" ")
                bm25_scores = bm25.get_scores(tokenized_query)
                
                # Get top K BM25 results
                top_bm25_indices = sorted(range(len(bm25_scores)), key=lambda i: bm25_scores[i], reverse=True)[:top_k*2]
                
                for rank, idx in enumerate(top_bm25_indices):
                    doc_id = all_ids[idx]
                    if doc_id not in candidates:
                        candidates[doc_id] = {
                            "id": doc_id,
                            "text": all_docs[idx],
                            "metadata": all_metadatas[idx] if all_metadatas else {},
                            "semantic_rank": 999 # Very low semantic rank
                        }
                    candidates[doc_id]["bm25_rank"] = rank
                    candidates[doc_id]["bm25_score"] = bm25_scores[idx]
        except Exception as e:
            print(f"BM25 Search failed, falling back to Semantic only: {e}")

        # 3. Reciprocal Rank Fusion (RRF) - optional, or just pass all candidates to Cross-Encoder
        candidate_list = list(candidates.values())
        
        # 4. Cross-Encoder Re-ranking
        if self.cross_encoder and candidate_list:
            # Prepare pairs: [query, doc_text]
            cross_inp = [[query, doc["text"]] for doc in candidate_list]
            cross_scores = self.cross_encoder.predict(cross_inp)
            
            for idx, score in enumerate(cross_scores):
                candidate_list[idx]["rerank_score"] = float(score)
                
            # Sort by cross-encoder score
            candidate_list = sorted(candidate_list, key=lambda x: x.get("rerank_score", -999), reverse=True)
        
        return candidate_list[:top_k]
