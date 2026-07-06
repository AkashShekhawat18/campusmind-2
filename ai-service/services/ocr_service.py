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
            "You are an expert OCR engine. Extract all text from this image exactly as written. "
            "Preserve formatting, line breaks, and numbering. "
            "If there are tables, extract them as markdown tables. "
            "If there are mathematical equations, extract them using standard LaTeX surrounded by $ or $$. "
            "If there is a diagram, provide a detailed description inside [DIAGRAM]...[/DIAGRAM] tags. "
            "Do NOT add any conversational filler. Just the extracted text."
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
            model="llama-3.2-90b-vision-preview",
            temperature=0.1
        )
        return res.choices[0].message.content.strip()
    except Exception as e:
        print(f"AI OCR Error: {e}")
        return None
