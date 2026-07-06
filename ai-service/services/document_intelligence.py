import fitz  # PyMuPDF
import io
import json
import base64
from typing import List, Dict, Any
import os
import random
from groq import Groq

from services.image_processor import enhance_camera_image, image_to_base64
from services.embedding_service import get_embeddings

def get_groq_client():
    keys = os.environ.get("GROQ_API_KEYS", "")
    key_list = [k.strip() for k in keys.split(",") if k.strip()]
    if not key_list:
        raise ValueError("GROQ_API_KEYS not configured")
    api_key = random.choice(key_list)
    return Groq(api_key=api_key)

def process_image_with_vision(image_base64: str) -> Dict[str, Any]:
    """
    Sends an image page to Groq Vision Llama 3.2 11B/90B to extract all questions,
    tables, equations, and diagrams.
    """
    client = get_groq_client()
    
    prompt = """
    You are an expert AI Professor extracting questions from an academic exam paper.
    Analyze this image and extract every single question.
    
    CRITICAL INSTRUCTIONS:
    1. EXTRACT ALL QUESTIONS exactly as they appear. Do not summarize.
    2. RECONSTRUCT all mathematical formulas, physics equations, and chemical equations into standard LaTeX (e.g. $\\frac{1}{2}mv^2$ or $$E=mc^2$$). 
    3. If there is a TABLE, reconstruct it into Markdown format within the question text.
    4. If there is a DIAGRAM or GRAPH, provide a detailed textual description in the 'diagramContext' field.
    5. Maintain question numbering and sub-parts correctly.
    
    Return a JSON object matching this schema:
    {
      "questions": [
        {
          "questionNumber": "String (e.g., '1(a)')",
          "questionText": "Full text including markdown tables and inline $latex$",
          "marks": "Integer (if visible, else null)",
          "topic": "String (Infer the general topic)",
          "subParts": "String (Any sub-questions combined)",
          "latex": "String (List of all major equations in this question)",
          "diagramContext": "String (Describe any diagram associated with this question)"
        }
      ]
    }
    Output ONLY valid JSON.
    """
    
    try:
        # We use the vision preview model
        res = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}},
                    ],
                }
            ],
            model="llama-3.2-90b-vision-preview",
            response_format={"type": "json_object"},
            temperature=0.1
        )
        content = res.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"Vision API Error: {e}")
        return {"questions": []}

def deep_question_understanding(question: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates the deep 'fingerprint' for a question: concept, logic, solving_method, etc.
    """
    client = get_groq_client()
    prompt = f"""
    Analyze the following academic question and create a deep cognitive fingerprint.
    
    Question Text: {question.get('questionText', '')}
    Equations: {question.get('latex', '')}
    Diagram Context: {question.get('diagramContext', '')}
    
    Determine the following:
    - concept: The core academic concept tested (e.g., 'Database Normalization', 'Newtonian Mechanics').
    - subconcept: A more specific sub-category (e.g., 'BCNF', 'Conservation of Momentum').
    - questionIntent: What is the question trying to evaluate?
    - requiredFormula: Any standard formulas needed to solve this.
    - solvingMethod: The logical steps or method required.
    - difficulty: Estimate difficulty (EASY, MEDIUM, HARD).
    - logic: A brief summary of the underlying logic pattern.
    
    Return a JSON object exactly matching these keys:
    {{
       "concept": "...", "subconcept": "...", "questionIntent": "...",
       "requiredFormula": "...", "solvingMethod": "...", "difficulty": "...", "logic": "..."
    }}
    """
    try:
        res = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            temperature=0.1
        )
        return json.loads(res.choices[0].message.content)
    except Exception as e:
        print(f"Deep Understanding Error: {e}")
        return {
            "concept": "Unknown",
            "subconcept": "Unknown",
            "questionIntent": "Unknown",
            "requiredFormula": "None",
            "solvingMethod": "Unknown",
            "difficulty": "MEDIUM",
            "logic": "Unknown"
        }

async def process_pyq_document(file_bytes: bytes, filename: str, mime_type: str) -> List[Dict[str, Any]]:
    """
    End-to-end pipeline: OCR/Vision -> Extraction -> Fingerprinting -> Embedding
    """
    all_questions = []
    
    if mime_type == "application/pdf" or filename.lower().endswith(".pdf"):
        # Process PDF page by page as images to capture layout perfectly
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) # Higher resolution
            
            # Convert to JPEG bytes
            img_bytes = pix.tobytes("jpeg")
            
            # Enhance text just in case (optional for born-digital PDFs, but good for scanned)
            # We'll skip enhancement for PDFs assuming they are reasonably clean, or apply conditionally.
            # To be safe, we just pass the image to vision.
            b64_image = image_to_base64(img_bytes)
            
            page_data = process_image_with_vision(b64_image)
            all_questions.extend(page_data.get("questions", []))
            
    elif mime_type.startswith("image/"):
        # Apply OpenCV enhancements for camera photos
        enhanced_bytes = enhance_camera_image(file_bytes)
        b64_image = image_to_base64(enhanced_bytes)
        
        page_data = process_image_with_vision(b64_image)
        all_questions.extend(page_data.get("questions", []))
        
    # Now that we have extracted questions, generate fingerprint and embeddings
    processed_questions = []
    
    for q in all_questions:
        # Skip empty questions
        if not q.get("questionText") or len(q.get("questionText", "").strip()) < 5:
            continue
            
        # 1. Generate Deep Fingerprint
        fingerprint = deep_question_understanding(q)
        q["metadata"] = fingerprint
        
        # 2. Generate Embeddings (Combine text + concept for richer semantic embedding)
        embed_text = f"Question: {q.get('questionText')} \nConcept: {fingerprint.get('concept')} \nLogic: {fingerprint.get('logic')}"
        
        # Assuming get_embeddings returns a list of embeddings, we pass a list of 1 text
        emb_list = get_embeddings([embed_text])
        if emb_list and len(emb_list) > 0:
            q["embedding"] = emb_list[0]
        else:
            q["embedding"] = []
            
        processed_questions.append(q)
        
    return processed_questions
