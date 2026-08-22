import os
import random
import json
from groq import Groq
from typing import List, Dict, Any

class QuestionExtractionAgent:
    """
    Agent responsible for detecting and extracting structured questions from raw document text.
    Implements question-level chunking and metadata extraction.
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

    def extract_questions(self, raw_text: str) -> List[Dict[str, Any]]:
        """
        Parses raw text and chunks it into independent, searchable question objects with metadata.
        """
        if not self.groq_client:
            print("Groq client not available for Extraction Agent.")
            return []
            
        system_prompt = (
            "You are an expert academic data extraction pipeline. Given the raw text of an exam paper, "
            "your job is to extract EVERY question as an independent object.\n\n"
            "Respond with ONLY a valid JSON array. Each element MUST follow this schema:\n"
            "{\n"
            '  "questionNumber": "<e.g. 1a, 2, 3b>",\n'
            '  "questionText": "<the exact full text of the question, preserving all LaTeX math>",\n'
            '  "marks": <integer or null>,\n'
            '  "topic": "<inferred topic>",\n'
            '  "difficulty": "<EASY, MEDIUM, or HARD>",\n'
            '  "unit": "<inferred unit or null>"\n'
            "}\n\n"
            "CRITICAL RULES:\n"
            "- Extract sub-parts as separate entries (e.g., Q1a and Q1b are separate objects).\n"
            "- Do not miss ANY questions.\n"
            "- Ignore general instructions at the top of the paper.\n"
            "- Ensure Math equations remain in LaTeX format ($...$).\n"
            "- Output ONLY valid JSON, no markdown formatting."
        )

        try:
            res = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Extract questions from this text:\n\n{raw_text[:20000]}"}
                ],
                model="openai/gpt-oss-120b",
                temperature=0.1,
                max_tokens=8000,
                response_format={"type": "json_object"}
            )
            
            content = res.choices[0].message.content.strip()
            
            # The model might wrap the array in an object if response_format="json_object" is used.
            # E.g. {"questions": [...]}
            data = json.loads(content)
            
            if isinstance(data, dict):
                # Find the first list value
                for val in data.values():
                    if isinstance(val, list):
                        return val
                return []
            elif isinstance(data, list):
                return data
            return []
            
        except Exception as e:
            print(f"Question Extraction Error: {e}")
            return []
