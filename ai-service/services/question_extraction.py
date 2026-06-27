import json
import os
import random
from typing import List, Dict, Any
from groq import Groq

def get_groq_client():
    keys = os.environ.get("GROQ_API_KEYS", "")
    key_list = [k.strip() for k in keys.split(",") if k.strip()]
    if not key_list:
        raise ValueError("GROQ_API_KEYS not configured")
    return Groq(api_key=random.choice(key_list))

def extract_questions_from_text(text: str) -> List[Dict[str, Any]]:
    """
    Parses cleaned OCR text into structured Question objects.
    Extracts Question Number, Marks, Section, Sub Parts, Unit, Topic.
    """
    if not text.strip():
        return []
        
    client = get_groq_client()
    prompt = f"""
    You are an AI trained to extract academic questions from exam papers.
    Analyze the following text and extract every question.
    
    CRITICAL: 
    - Output ONLY valid JSON matching the exact schema below.
    - EXTRACT THE ENTIRE QUESTION TEXT exactly as it appears. DO NOT summarize, truncate, or stop early. Include all paragraphs, sentences, and sub-parts.
    - RECONSTRUCT ALL mathematical equations, symbols, and formulas into standard LaTeX.
    - Enclose ONLY the mathematical symbols and equations in $...$ for inline and $$...$$ for block. 
    - DO NOT enclose entire English sentences or normal words in $...$. Regular text MUST remain outside the math delimiters so spaces are preserved.
    - Do NOT output unicode math symbols (e.g., use $x \in \\{{0, 1\\}}^n$ instead of x ∈ {{0, 1}}^n).
    - If there are markdown tables, preserve them in 'questionText'.
    - If there are diagram descriptions, include them in 'questionText'.
    
    Schema:
    {{
      "questions": [
        {{
          "questionNumber": "1", // string, e.g. "1", "1(a)", "Q2"
          "questionText": "Explain Database Normalization.",
          "marks": 5, // integer or null
          "section": "A", // string or null
          "subParts": null, // string (JSON encoded list if applicable) or null
          "topic": "Normalization", // inferred topic (string)
          "unit": "Unit 2" // string or null
        }}
      ]
    }}
    
    Exam Text:
    {text}
    """
    
    try:
        res = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            temperature=0.1
        )
        data = json.loads(res.choices[0].message.content)
        return data.get("questions", [])
    except Exception as e:
        print(f"Error structuring questions: {e}")
        return []
