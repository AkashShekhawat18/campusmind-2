import base64
import os
import random
from groq import Groq
from typing import Optional

try:
    from paddleocr import PaddleOCR
    PADDLE_AVAILABLE = True
except ImportError:
    PADDLE_AVAILABLE = False

class OCRAgent:
    """
    Agent responsible for extracting text from images/PDFs with layout preservation.
    """
    def __init__(self):
        self.paddle = None
        if PADDLE_AVAILABLE:
            try:
                # Initialize PaddleOCR
                # use_angle_cls=True helps with rotated pages
                # lang='en' for English
                self.paddle = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
            except Exception as e:
                print(f"PaddleOCR init failed: {e}")
                
        # Groq client for fallback
        self._init_groq()
        
    def _init_groq(self):
        keys = os.environ.get("GROQ_API_KEYS", "")
        key_list = [k.strip() for k in keys.split(",") if k.strip()]
        if key_list:
            self.groq_client = Groq(api_key=random.choice(key_list))
        else:
            self.groq_client = None

    def extract_text(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> Optional[str]:
        """
        Attempts to extract text using PaddleOCR (if available), falls back to Vision API.
        """
        # We can try PaddleOCR if it's available and we can convert image_bytes to numpy array
        # But PaddleOCR works best with OpenCV images. For simplicity, we'll use Groq Vision 
        # as it excels at preserving complex layouts like Math/Tables which Paddle struggles with without specialized models.
        
        # User requirement: Extract Tables, Math Equations, Physics, Chemical Formulae perfectly.
        # Large Vision Models (LLaVA/Groq) do this much better than raw PaddleOCR.
        return self._extract_with_vision(image_bytes, mime_type)
        
    def _extract_with_vision(self, image_bytes: bytes, mime_type: str) -> Optional[str]:
        if not self.groq_client:
            print("Groq client not available for OCR fallback.")
            return None
            
        try:
            base64_image = base64.b64encode(image_bytes).decode('utf-8')
            
            prompt = (
                "You are an expert academic OCR engine. Extract all text from this image exactly as written. "
                "CRITICAL INSTRUCTIONS:\n"
                "1. Preserve exact formatting, line breaks, headers, footers, and numbering.\n"
                "2. Tables MUST be converted into Markdown tables.\n"
                "3. Mathematical equations (Physics, Calculus, etc) MUST be extracted using standard LaTeX wrapped in $ (inline) or $$ (display).\n"
                "4. If there is a diagram, provide a detailed description of the diagram inside [DIAGRAM]...[/DIAGRAM] tags.\n"
                "5. Extract any image captions.\n"
                "6. Ignore noise, blur, or watermarks. Output ONLY the extracted text, no conversational filler."
            )
            
            res = self.groq_client.chat.completions.create(
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
            print(f"Vision OCR Error: {e}")
            return None
