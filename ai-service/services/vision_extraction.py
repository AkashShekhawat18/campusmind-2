import os
import json
import uuid
from typing import List, Dict, Any
from pathlib import Path
import google.generativeai as genai
from PIL import Image
import io

# Load GEMINI_API_KEY from backend .env
backend_env_path = Path(__file__).resolve().parent.parent.parent / "backend" / ".env"
if backend_env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(backend_env_path)

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# Ensure uploads directory exists
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "backend" / "uploads" / "pyq_images"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def process_page_with_vision(image_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Passes a page image to Gemini 2.5 Flash to extract questions and bounding boxes for diagrams.
    Crops the diagrams and saves them, returning the structured questions.
    """
    img = Image.open(io.BytesIO(image_bytes))
    img_width, img_height = img.size
    
    prompt = """
You are an expert AI professor and academic document analyzer.
Extract all questions from the provided exam paper image.
Return a JSON array of objects representing the questions.
For each question, extract:
- questionNo: e.g. "Q1" or "1"
- questionText: The full text of the question
- marks: Integer marks if visible, else null
- topic: The academic topic of the question
- latex: Any mathematical formulas or equations in the question wrapped in $ or $$
- images: An array of visual elements (diagrams, graphs, circuits, tables, figures) associated with THIS question.

If a question has a visual element, provide:
- type: e.g. "circuit_diagram", "graph", "table", "geometry_figure"
- description: A highly detailed, conceptual description of the visual element so that it can be understood without seeing it. Include labels, axes, values, and structure.
- bbox: The bounding box of the visual element on the page in the format [ymin, xmin, ymax, xmax] where each value is an integer between 0 and 1000 representing the normalized coordinates.

IMPORTANT: 
- DO NOT hallucinate diagrams that do not exist.
- If the entire question is a text block, images should be an empty array [].
- Output ONLY valid JSON containing the array. Do not include markdown formatting like ```json.
    """

    candidate_models = [
        'models/gemma-4-26b-a4b-it',
        'models/gemini-2.0-flash',
        'models/gemini-1.5-flash-8b',
        'models/gemini-1.5-flash',
        'models/gemini-1.5-pro',
        'models/gemini-2.5-flash'
    ]

    response = None
    for m_name in candidate_models:
        try:
            model = genai.GenerativeModel(m_name)
            response = model.generate_content([prompt, img])
            if response and response.text:
                break
        except Exception as err:
            print(f"[Vision Extraction] Candidate '{m_name}' failed: {err}")
            continue

    if not response or not response.text:
        return []

    try:
        text = response.text.strip()
        
        # Remove potential markdown json blocks
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        questions = json.loads(text)
        
        # Now process crops
        for q in questions:
            visuals = q.get("images", [])
            for v in visuals:
                bbox = v.get("bbox")
                if bbox and len(bbox) == 4:
                    ymin, xmin, ymax, xmax = bbox
                    
                    # Convert normalized 0-1000 coordinates to actual pixel coordinates
                    left = int(xmin * img_width / 1000.0)
                    upper = int(ymin * img_height / 1000.0)
                    right = int(xmax * img_width / 1000.0)
                    lower = int(ymax * img_height / 1000.0)
                    
                    # Add a small padding (10 pixels) to avoid cutting borders
                    left = max(0, left - 10)
                    upper = max(0, upper - 10)
                    right = min(img_width, right + 10)
                    lower = min(img_height, lower + 10)
                    
                    if right > left and lower > upper:
                        cropped_img = img.crop((left, upper, right, lower))
                        filename = f"{uuid.uuid4()}.png"
                        filepath = UPLOAD_DIR / filename
                        cropped_img.save(filepath, format="PNG")
                        
                        # Set URL for backend
                        v["url"] = f"/uploads/pyq_images/{filename}"
                    
                    # Remove bbox from final output to keep it clean
                    del v["bbox"]
                    
        return questions
        
    except Exception as e:
        print(f"Vision Extraction Error: {e}")
        return []
