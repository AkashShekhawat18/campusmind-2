import os
import json
import uuid
from typing import List, Dict, Any
from pathlib import Path
import google.generativeai as genai
from PIL import Image
import io
import time
import concurrent.futures

import re as _re

def _generate_with_retry(model, prompt, img):
    max_retries = 3
    for attempt in range(max_retries + 1):
        req_start = time.time()
        print(f"[DEBUG] Vision Request Started - Attempt {attempt + 1}", flush=True)
        try:
            # 25s timeout — gemini-2.0-flash typically responds in 3-8s
            response = model.generate_content([prompt, img], request_options={"timeout": 25.0})
            duration = time.time() - req_start
            print(f"[DEBUG] Vision Request Success - Attempt {attempt + 1} (Duration: {duration:.2f}s)", flush=True)
            return response
        except Exception as err:
            duration = time.time() - req_start
            
            is_transient = False
            err_str = str(err).lower()
            err_type = type(err).__name__.lower()
            
            if "retry" in err_type or "deadlineexceeded" in err_type or "serviceunavailable" in err_type or "toomanyrequests" in err_type:
                is_transient = True
            elif "timeout" in err_str or "connection reset" in err_str or "503" in err_str or "429" in err_str or "transient" in err_str or "resource_exhausted" in err_str:
                is_transient = True
                
            if "400" in err_str or "401" in err_str or "403" in err_str or "404" in err_str or "invalid" in err_str:
                is_transient = False

            if attempt < max_retries and is_transient:
                # Try to extract the server-suggested retry delay
                retry_match = _re.search(r'retry.*?(\d+(?:\.\d+)?)\s*s', err_str)
                if retry_match:
                    wait_secs = min(float(retry_match.group(1)) + 1, 60)
                else:
                    wait_secs = (2 ** attempt) * 2  # 2s, 4s, 8s
                print(f"[DEBUG] Vision Request Failure (Retryable) - Attempt {attempt + 1} (Duration: {duration:.2f}s) Waiting {wait_secs:.0f}s. Reason: {err}", flush=True)
                time.sleep(wait_secs)
            else:
                print(f"[DEBUG] Vision Request Failure (Final) - Attempt {attempt + 1} (Duration: {duration:.2f}s) Reason: {err}", flush=True)
                raise err

# GEMINI_API_KEY is loaded from ai-service/.env via main.py

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
- CRITICAL: Extract sub-parts as separate entries (e.g., Q1a and Q1b MUST be separate objects).
- CRITICAL: Treat internal choices (OR questions) as separate questions.
- CRITICAL: Do NOT merge independent questions.
- CRITICAL: Extract every single question visible, including MCQs, Case Study Questions, Paragraph-based Questions, Subjective, and Image/Diagram Questions.
- DO NOT hallucinate diagrams that do not exist.
- If the entire question is a text block, images should be an empty array [].
- Output ONLY valid JSON containing the array. Do not include markdown formatting like ```json.
    """

    # Fastest models first. gemini-2.0-flash is significantly faster than 1.5-flash for vision.
    candidate_models = [
        'models/gemini-2.5-flash',
        'models/gemini-2.0-flash',
        'models/gemini-2.0-flash-lite',
    ]

    response = None
    for m_name in candidate_models:
        try:
            model = genai.GenerativeModel(m_name)
            response = _generate_with_retry(model, prompt, img)
                
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
            
        raw_data = json.loads(text)
        
        # Handle case where Gemini wraps the array in an object {"questions": [...]}
        questions = []
        if isinstance(raw_data, dict):
            for val in raw_data.values():
                if isinstance(val, list):
                    questions = val
                    break
        elif isinstance(raw_data, list):
            questions = raw_data
            
        if not isinstance(questions, list):
            questions = []
        
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


# ---------------------------------------------------------------------------
# New Pipeline Functions (used by multi-stage Document Intelligence)
# ---------------------------------------------------------------------------

def crop_and_save_image(page_image_bytes: bytes, bbox: list) -> str:
    """
    Crop a region from a page image and save it.
    bbox format: [ymin, xmin, ymax, xmax] normalized 0-1000.
    Returns the URL path for the saved image.
    """
    try:
        img = Image.open(io.BytesIO(page_image_bytes))
        img_width, img_height = img.size
        
        ymin, xmin, ymax, xmax = bbox
        left = max(0, int(xmin * img_width / 1000.0) - 10)
        upper = max(0, int(ymin * img_height / 1000.0) - 10)
        right = min(img_width, int(xmax * img_width / 1000.0) + 10)
        lower = min(img_height, int(ymax * img_height / 1000.0) + 10)
        
        if right > left and lower > upper:
            cropped = img.crop((left, upper, right, lower))
            filename = f"{uuid.uuid4()}.png"
            filepath = UPLOAD_DIR / filename
            cropped.save(filepath, format="PNG")
            return f"/uploads/pyq_images/{filename}"
    except Exception as e:
        print(f"[Vision] Crop error: {e}")
    return ""


def analyze_page_layout(image_bytes: bytes) -> Dict[str, Any]:
    """
    Vision-based layout analysis ONLY.
    
    Does NOT extract question text (that comes from PyMuPDF).
    Instead identifies:
    - Visual elements (diagrams, graphs, tables, figures) with bounding boxes
    - Section boundaries
    - Question block boundaries (for validation)
    - Any text that might be inside diagrams/figures
    
    This is a lighter Gemini call than full question extraction.
    Returns a dict with layout metadata.
    """
    img = Image.open(io.BytesIO(image_bytes))
    
    layout_prompt = """Analyze this exam paper page and identify ONLY the visual layout elements.
Do NOT extract question text — only identify visual elements and their locations.

Return a JSON object with:
{
  "visual_elements": [
    {
      "type": "diagram|graph|table|figure|chart|map|circuit|flowchart|image",
      "description": "Detailed conceptual description of the visual element.",
      "metadata": {
        "x_axis_label": "for graphs",
        "y_axis_label": "for graphs",
        "units": "any units mentioned",
        "key_data_points": ["point1", "point2"],
        "labels": ["all textual labels in the diagram"],
        "table_headers": ["if it's a table"]
      },
      "bbox": [ymin, xmin, ymax, xmax],
      "associated_question": "The question number this element belongs to, e.g. '5' or '3a'",
      "caption": "Any caption text near the element"
    }
  ],
  "sections_detected": ["Section A", "Section B"],
  "question_count_estimate": 0,
  "has_multi_column": false,
  "page_type": "question_paper|answer_sheet|instructions|blank"
}

bbox values are integers 0-1000 representing normalized coordinates.
Output ONLY valid JSON. No markdown."""
    
    candidate_models = [
        'models/gemini-2.0-flash',
        'models/gemini-2.0-flash-lite',
    ]
    
    for m_name in candidate_models:
        try:
            model = genai.GenerativeModel(m_name)
            response = _generate_with_retry(model, layout_prompt, img)
            
            if response and response.text:
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                
                result = json.loads(text)
                
                # Crop and save visual elements
                if isinstance(result, dict):
                    for ve in result.get("visual_elements", []):
                        bbox = ve.get("bbox")
                        if bbox and len(bbox) == 4:
                            url = crop_and_save_image(image_bytes, bbox)
                            if url:
                                ve["url"] = url
                            del ve["bbox"]
                
                return result if isinstance(result, dict) else {}
                
        except Exception as err:
            print(f"[Vision Layout] Model '{m_name}' failed: {err}")
            continue
    
    return {}


def ocr_page_with_vision(image_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Full OCR + question extraction via Gemini Vision.
    Used ONLY for scanned pages where PyMuPDF has no text layer.
    
    This is essentially the same as process_page_with_vision but 
    with an enhanced prompt focused on complete extraction.
    """
    img = Image.open(io.BytesIO(image_bytes))
    img_width, img_height = img.size
    
    ocr_prompt = """You are an expert academic document analyzer performing OCR on a scanned exam paper page.
Extract ALL questions from this page with maximum precision.

Return a JSON array where each element has:
- questionNo: The question number (e.g. "1", "2a", "3(i)")
- questionText: The COMPLETE text of the question. Do not summarize.
- marks: Integer marks if visible, null otherwise
- topic: Inferred academic topic
- latex: Mathematical expressions in LaTeX ($..$ or $$..$$)
- section: Section name if visible (e.g. "Section A")
- questionType: One of: MCQ, Fill in the Blanks, Match the Following, Assertion Reason, Case Study, Short Answer, Long Answer, Numerical, Diagram Based, Graph Based, Table Based, Coding Question, Subjective
- options: For MCQs, array of {label, text} objects. Empty array otherwise.
- images: Array of visual elements with {type, description, bbox: [ymin,xmin,ymax,xmax]}

CRITICAL RULES:
- Extract EVERY question. Do not skip any.
- Keep OR alternatives as SEPARATE questions with a field "isOrAlternative": true
- Keep Fill in the Blanks as ONE question with all blanks listed
- Keep Case Study passage + child questions together
- Include sub-parts (a, b, c, i, ii, iii) as separate entries
- Preserve mathematical notation in LaTeX
- bbox values are integers 0-1000 (normalized coordinates)
- Output ONLY valid JSON array. No markdown."""

    candidate_models = [
        'models/gemini-2.5-flash',
        'models/gemini-2.0-flash',
        'models/gemini-2.0-flash-lite',
    ]
    
    response = None
    for m_name in candidate_models:
        try:
            model = genai.GenerativeModel(m_name)
            response = _generate_with_retry(model, ocr_prompt, img)
            if response and response.text:
                break
        except Exception as err:
            print(f"[Vision OCR] Model '{m_name}' failed: {err}")
            continue
    
    if not response or not response.text:
        return []
    
    try:
        text = response.text.strip()
        # Robustly strip markdown blocks
        import re
        text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\s*```$', '', text)
        text = text.strip()
        
        raw_data = json.loads(text)
        
        questions = []
        if isinstance(raw_data, dict):
            for val in raw_data.values():
                if isinstance(val, list):
                    questions = val
                    break
        elif isinstance(raw_data, list):
            questions = raw_data
        
        # Process bounding box crops
        for q in questions:
            visuals = q.get("images", [])
            for v in visuals:
                bbox = v.get("bbox")
                if bbox and len(bbox) == 4:
                    url = crop_and_save_image(image_bytes, bbox)
                    if url:
                        v["url"] = url
                    del v["bbox"]
        
        return questions
        
    except Exception as e:
        print(f"[Vision OCR] Parse error: {e}")
        return []
