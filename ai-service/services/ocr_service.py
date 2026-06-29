import base64
from typing import Optional
from groq import Groq
import os
import random

def get_groq_client():
    keys = os.environ.get("GROQ_API_KEYS", "")
    key_list = [k.strip() for k in keys.split(",") if k.strip()]
    if not key_list:
        raise ValueError("GROQ_API_KEYS not configured")
    api_key = random.choice(key_list)
    return Groq(api_key=api_key)

def extract_text_with_vision_api(image_bytes: bytes, mime_type: str = "image/jpeg") -> Optional[str]:
    """Uses Groq Vision (llama-3.2-11b-vision-preview) as a powerful AI OCR engine."""
    try:
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        client = get_groq_client()
        
        prompt = (
            "You are an expert academic OCR engine. Extract all text, equations, and tables perfectly. "
            "CRITICAL INSTRUCTIONS: "
            "1. PRESERVE MATH/SCIENCE STRUCTURE using LaTeX ($...$ for inline, $$...$$ for block). Never flatten matrices, integrals, or fractions. "
            "2. CORRECT OCR ERRORS in math context (e.g., '1' vs 'l', '0' vs 'O', 'x' vs '\\times'). "
            "3. Form chemistry/physics formulas properly using standard LaTeX conventions. "
            "4. Convert tables to Markdown. "
            "5. If there's a diagram, describe it briefly inside [DIAGRAM]...[/DIAGRAM] tags. "
            "6. Output ONLY the extracted text and LaTeX. NO CONVERSATIONAL FILLER."
        )
        
        res = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}},
                    ],
                }
            ],
            model="llama-3.2-11b-vision-preview",
            temperature=0.1
        )
        return res.choices[0].message.content.strip()
    except Exception as e:
        print(f"AI OCR Error: {e}")
        return None

def correct_ocr_text_with_ai(text: str) -> str:
    """Uses a fast LLM to correct flattened OCR text and restore LaTeX equations."""
    if not text or len(text.strip()) < 10:
        return text
        
    try:
        client = get_groq_client()
        prompt = (
            "You are an expert academic text reconstructor. The following text was extracted from a PDF via basic OCR, "
            "which flattened all mathematical equations, chemical formulas, and matrices into plain text, often introducing errors "
            "(e.g., '1' instead of 'l', 'x' instead of '\\times').\n\n"
            "YOUR TASK:\n"
            "1. Reconstruct all mathematical, scientific, engineering, and chemical notations into proper standard LaTeX.\n"
            "2. Use $...$ for inline math and $$...$$ for block math.\n"
            "3. Do NOT wrap regular English words in $...$.\n"
            "4. Fix OCR errors based on context.\n"
            "5. DO NOT summarize or alter the meaning of the text. Output the full text with corrected formatting.\n"
            "6. DO NOT output conversational filler like 'Here is the corrected text:'.\n\n"
            f"TEXT TO CORRECT:\n{text}"
        )
        
        res = client.chat.completions.create(
            messages=[
                {"role": "user", "content": prompt}
            ],
            # Use a fast model for text correction
            model="llama-3.3-70b-versatile",
            temperature=0.1
        )
        return res.choices[0].message.content.strip()
    except Exception as e:
        print(f"AI OCR Correction Error: {e}")
        return text
