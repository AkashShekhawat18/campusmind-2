import os
import random
from typing import List, Dict, Any, Tuple
from groq import Groq

class AnswerAgent:
    """
    Agent responsible for generating the grounded answer from retrieved context.
    Strictly follows anti-hallucination prompts.
    """
    def __init__(self):
        self._init_groq()
        
    def _init_groq(self):
        keys = os.environ.get("GROQ_API_KEYS", "")
        key_list = [k.strip() for k in keys.split(",") if k.strip()]
        if key_list:
            self.groq_client = Groq(api_key=random.choice(key_list))
        else:
            self.groq_client = None

    def generate_answer(self, query: str, context_results: List[Dict[str, Any]], history: List[Dict[str, str]] = None) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Generates an answer using ONLY the provided context.
        Returns the generated answer text and the formatted references used.
        """
        if not self.groq_client:
            return "AI Service unavailable.", []
            
        if not history:
            history = []
            
        if not context_results:
            return "I could not find sufficient information in the uploaded documents.", []
            
        # Format the context block and the references
        context_text = ""
        references = []
        for i, res in enumerate(context_results):
            ref_id = i + 1
            meta = res.get("metadata", {})
            doc_name = meta.get("filename", f"Document_{ref_id}")
            chunk_id = meta.get("chunk_index", "Unknown")
            page_num = meta.get("page_number", "Unknown")
            score = res.get("rerank_score", res.get("distance", 0))
            
            context_text += f"--- [Reference {ref_id}] Source: {doc_name} (Page {page_num}) ---\n{res['text']}\n\n"
            
            references.append({
                "ref_id": ref_id,
                "document_name": doc_name,
                "page_number": page_num,
                "chunk_id": chunk_id,
                "similarity_score": round(score, 3) if isinstance(score, float) else score,
                "snippet": res["text"][:150] + "..." # Source snippet
            })

        system_prompt = (
            "You are an academic assistant. Your objective is to answer the user's question.\n\n"
            "CRITICAL RULES:\n"
            "1. You must ONLY answer using the provided retrieved context.\n"
            "2. Never answer using your own knowledge.\n"
            "3. Never fabricate information, facts, formulae, citations, or references.\n"
            "4. If the provided context does not contain enough information to answer the question, you MUST reply EXACTLY with:\n"
            "   'I could not find sufficient information in the uploaded documents.'\n"
            "5. Never guess or attempt to logically deduce an answer if the facts aren't in the text.\n"
            "6. Cite your sources using [Reference X] in your answer.\n"
            "7. ALWAYS use standard LaTeX format ($ or $$) for mathematical equations.\n\n"
            "RETRIEVED CONTEXT:\n"
            f"{context_text}"
        )

        try:
            messages = [{"role": "system", "content": system_prompt}]
            for msg in history:
                messages.append({"role": msg["role"], "content": msg["content"]})
            messages.append({"role": "user", "content": query})
            
            res = self.groq_client.chat.completions.create(
                messages=messages,
                model="openai/gpt-oss-120b",
                temperature=0.0, # Zero temperature for RAG grounding
                max_tokens=2048
            )
            
            answer = res.choices[0].message.content.strip()
            
            # If the model explicitly refused, clear references
            if "I could not find sufficient information" in answer:
                references = []
                
            return answer, references
        except Exception as e:
            print(f"Answer Agent Error: {e}")
            return "An error occurred while generating the answer.", []
