import json
from typing import List, Dict, Any
from groq import Groq
from fastapi.responses import StreamingResponse
import os
import random

from services.vector_service import search_chunks
from services.embedding_service import get_embeddings

def get_groq_client():
    keys = os.environ.get("GROQ_API_KEYS", "")
    key_list = [k.strip() for k in keys.split(",") if k.strip()]
    if not key_list:
        raise ValueError("GROQ_API_KEYS not configured")
    api_key = random.choice(key_list)
    return Groq(api_key=api_key)

async def stream_pyq_chat(
    user_message: str, 
    chat_type: str, 
    context_data: Dict[str, Any], 
    history: List[Dict[str, str]]
):
    """
    Handles streaming responses for both PAPER_SPECIFIC and GLOBAL_LIBRARY chatbots.
    chat_type: "PAPER_SPECIFIC" or "GLOBAL_LIBRARY"
    context_data: dict containing current paper details or global filters
    """
    client = get_groq_client()
    
    # Base system prompt
    system_prompt = """You are MALPHOR (CampusMind AI), an expert academic professor and PYQ (Previous Year Question) analyzer.
    You analyze exam papers, identify trends, explain concepts, and provide actionable insights.
    
    CRITICAL RULE: NEVER hallucinate. If you don't have the data to answer, state clearly that the data is not available.
    Use the provided context to answer the user's questions."""
    
    context_text = ""
    
    if chat_type == "PAPER_SPECIFIC":
        paper_stats = context_data.get("analytics", {})
        similarity_results = context_data.get("similarityResults", [])
        
        context_text = f"Context: Currently analyzing a specific exam paper.\n"
        context_text += f"Overall Repetition: {paper_stats.get('overallRepetitionPercent', 0)}%\n"
        context_text += f"Fully Repeated: {paper_stats.get('fullyRepeated', 0)}\n"
        context_text += f"Concept Repeated: {paper_stats.get('conceptRepeated', 0)}\n"
        context_text += f"New Questions: {paper_stats.get('newQuestions', 0)}\n\n"
        
        context_text += "Similarity Details:\n"
        for res in similarity_results[:10]: # Limit to top 10 to fit context window
            context_text += f"- Question '{res.get('sourceQuestionId')}' matched '{res.get('targetQuestionId')}' with {res.get('overallSimilarity')}% ({res.get('matchType')}). Reason: {res.get('reasoning')}\n"
            
    elif chat_type == "GLOBAL_LIBRARY":
        # In a full production system, we'd do a dynamic RAG search here against the ChromaDB collection of ALL PYQs
        # For now, we simulate the context retrieval if there are specific filters applied (e.g. searching for 'DBMS trends')
        emb_query = get_embeddings([user_message])[0]
        # Example pseudo-search (user_id is hardcoded or passed via context)
        # raw_results = search_similar_chunks("global_pyq_pool", emb_query, top_k=5)
        context_text = "Context: You have access to the global PYQ library. Analyze trends based on the user's queries."
        
    messages = [{"role": "system", "content": system_prompt + "\n\n" + context_text}]
    
    # Add history
    for msg in history[-5:]: # Last 5 messages
        messages.append({"role": msg["role"], "content": msg["content"]})
        
    messages.append({"role": "user", "content": user_message})
    
    def generate():
        try:
            stream = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.3,
                stream=True
            )
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield f"data: {json.dumps({'text': chunk.choices[0].delta.content})}\n\n"
                    
            yield "data: [DONE]\n\n"
        except Exception as e:
            print(f"Chat error: {e}")
            yield f"data: {json.dumps({'text': 'Sorry, I encountered an error while processing your request.'})}\n\n"
            yield "data: [DONE]\n\n"
            
    return StreamingResponse(generate(), media_type="text/event-stream")
