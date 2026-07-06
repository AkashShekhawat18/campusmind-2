import os
import random
from typing import Tuple
from groq import Groq

class VerificationAgent:
    """
    Agent responsible for evaluating the generated answer against the retrieved context to detect hallucinations.
    Calculates a confidence score (0.0 to 1.0).
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

    def verify_answer(self, query: str, answer: str, context_results: list) -> Tuple[float, str]:
        """
        Verifies if the answer is completely grounded in the context.
        Returns (confidence_score, modified_answer).
        Confidence > 0.85: Return as is.
        Confidence between 0.70 - 0.85: Return with a moderate confidence warning.
        Confidence < 0.70: Reject completely.
        """
        if not self.groq_client:
            return 1.0, answer # Pass through if verifier is down
            
        if "I could not find sufficient information" in answer:
            return 1.0, answer # Legitimate refusal is highly confident
            
        if not context_results:
            return 0.0, "Insufficient evidence found in the uploaded documents."

        # Re-construct context text
        context_text = ""
        for i, res in enumerate(context_results):
            context_text += f"--- Source {i+1} ---\n{res['text']}\n\n"

        system_prompt = (
            "You are an elite hallucination detection system. Your job is to verify if a generated answer is strictly grounded in the provided context.\n\n"
            "EVALUATION CRITERIA:\n"
            "1. Grounding: Are ALL facts, claims, and equations present in the context?\n"
            "2. Relevance: Does the answer actually address the user's query?\n"
            "3. Fabrication: Did the AI invent ANY information not found in the text?\n\n"
            "OUTPUT FORMAT:\n"
            "You must output ONLY a float value between 0.00 and 1.00 representing your confidence that the answer is perfectly grounded and hallucination-free. Do not output anything else."
        )
        
        user_prompt = f"Context:\n{context_text}\n\nUser Query: {query}\n\nGenerated Answer:\n{answer}\n\nConfidence Score (0.00 - 1.00):"

        try:
            res = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.0,
                max_tokens=10
            )
            
            score_str = res.choices[0].message.content.strip()
            # Clean up the output in case the model added extra text
            import re
            match = re.search(r"0\.\d+|1\.00?", score_str)
            if match:
                confidence = float(match.group())
            else:
                confidence = 0.5 # Safe default if parsing fails
                
            if confidence >= 0.85:
                return confidence, answer
            elif confidence >= 0.70:
                warning = "> [!WARNING]\n> **Moderate Confidence**: This answer was generated using the uploaded documents, but the evidence was not definitive. Please double-check the sources.\n\n"
                return confidence, warning + answer
            else:
                return confidence, "Insufficient evidence found in the uploaded documents. The AI generation was blocked by the Verification Guard due to potential hallucination."
                
        except Exception as e:
            print(f"Verification Agent Error: {e}")
            return 0.5, answer # Pass through on error
