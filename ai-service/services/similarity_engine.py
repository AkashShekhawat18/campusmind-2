import json
import re
import unicodedata
from typing import List, Dict, Any
import numpy as np
import difflib

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2:
        return 0.0
    vec1 = np.array(v1)
    vec2 = np.array(v2)
    dot_product = np.dot(vec1, vec2)
    norm = np.linalg.norm(vec1) * np.linalg.norm(vec2)
    if norm == 0:
        return 0.0
    return dot_product / norm

def normalize_text(text: str) -> str:
    """
    Normalize question text for robust comparison.
    Strips whitespace, normalizes unicode, lowercases, and collapses spaces.
    This handles minor OCR/extraction differences that shouldn't affect matching.
    """
    if not text:
        return ""
    # Normalize unicode characters (e.g., different dash types, smart quotes)
    text = unicodedata.normalize("NFKC", text)
    # Lowercase
    text = text.lower()
    # Remove extra whitespace and newlines
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def fuzzy_field_match(s: str, t: str) -> float:
    """
    Compare two metadata field strings using fuzzy matching.
    Returns a score from 0.0 to 1.0.
    Handles LLM non-determinism where the same question gets slightly different
    metadata strings across separate extraction calls.
    """
    if not s and not t:
        return 1.0  # Both empty = match
    if not s or not t:
        return 0.0  # One empty, one not = no match
    s_norm = normalize_text(s)
    t_norm = normalize_text(t)
    if s_norm == t_norm:
        return 1.0
    return difflib.SequenceMatcher(None, s_norm, t_norm).ratio()

def calculate_similarity_report(source_q: Dict[str, Any], target_q: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compares two questions using the 6-dimension weighting formula.
    Weights:
    - Concept Match: 35%
    - Logic Match: 30%
    - Formula Match: 15%
    - Question Pattern: 10%
    - Values Match: 5%
    - Language Similarity: 5%
    """
    # Self-match detection: if both questions have IDs and they're the same,
    # it's literally the same question in the database.
    src_id = source_q.get("id")
    tgt_id = target_q.get("id")
    if src_id and tgt_id and str(src_id) == str(tgt_id):
        return {
            "sourceQuestionId": src_id,
            "targetQuestionId": tgt_id,
            "conceptMatch": 100.0,
            "logicMatch": 100.0,
            "formulaMatch": 100.0,
            "patternMatch": 100.0,
            "valuesMatch": 100.0,
            "languageSimilarity": 100.0,
            "overallSimilarity": 100.0,
            "matchType": "EXACT",
            "reasoning": "Identical question detected (same database record).",
            "matchedQuestionText": target_q.get("questionText", ""),
            "matchedQuestionImages": target_q.get("images", []),
            "originalQuestion": {
                "questionText": source_q.get("questionText", ""),
                "marks": source_q.get("marks", 5),
                "metadata": source_q.get("metadata", {}),
                "images": source_q.get("images", [])
            }
        }

    # 1. Base semantic similarity using embeddings
    emb_sim = 0.0
    if "embedding" in source_q and "embedding" in target_q and len(source_q.get("embedding", [])) > 0 and len(target_q.get("embedding", [])) > 0:
        emb_sim = cosine_similarity(source_q["embedding"], target_q["embedding"])

    # 2. Normalize and compare question text
    s_text = normalize_text(source_q.get("questionText", ""))
    t_text = normalize_text(target_q.get("questionText", ""))
    text_ratio = difflib.SequenceMatcher(None, s_text, t_text).ratio()
    
    # Fallback embedding sim to text ratio if no embeddings available
    if not ("embedding" in source_q and "embedding" in target_q and len(source_q.get("embedding", [])) > 0 and len(target_q.get("embedding", [])) > 0):
        emb_sim = text_ratio

    # If the normalized question text is 85%+ similar, it's effectively the same question.
    # LLM extraction non-determinism and minor OCR differences can cause wording variations
    # in both the question text AND the metadata. We force 100% to avoid hallucinated differences.
    if text_ratio >= 0.85:
        return {
            "sourceQuestionId": source_q.get("id"),
            "targetQuestionId": target_q.get("id"),
            "conceptMatch": 100.0,
            "logicMatch": 100.0,
            "formulaMatch": 100.0,
            "patternMatch": 100.0,
            "valuesMatch": 100.0,
            "languageSimilarity": round(max(emb_sim, text_ratio) * 100, 2),
            "overallSimilarity": 100.0,
            "matchType": "EXACT",
            "reasoning": f"AI matched question text with {text_ratio*100:.1f}% textual similarity (ignoring minor OCR/extraction variations).",
            "matchedQuestionText": target_q.get("questionText", ""),
            "matchedQuestionImages": target_q.get("images", []),
            "originalQuestion": {
                "questionText": source_q.get("questionText", ""),
                "marks": source_q.get("marks", 5),
                "metadata": source_q.get("metadata", {}),
                "images": source_q.get("images", [])
            }
        }
        
    s_meta = source_q.get("metadata", {}) or {}
    t_meta = target_q.get("metadata", {}) or {}
    
    # ---- Calculate dimensional scores (0 to 1) ----

    # Concept Match (35%) — Use fuzzy comparison to handle LLM non-determinism
    concept_match = fuzzy_field_match(
        s_meta.get("concept", ""),
        t_meta.get("concept", "")
    )
    # Also factor in subconcept for a richer comparison
    subconcept_sim = fuzzy_field_match(
        s_meta.get("subconcept", ""),
        t_meta.get("subconcept", "")
    )
    concept_match = (concept_match * 0.7) + (subconcept_sim * 0.3)
        
    # Logic Match (30%) — Fuzzy compare solving method + logic
    solving_sim = fuzzy_field_match(
        s_meta.get("solvingMethod", ""),
        t_meta.get("solvingMethod", "")
    )
    logic_sim = fuzzy_field_match(
        s_meta.get("logic", ""),
        t_meta.get("logic", "")
    )
    logic_match = (solving_sim * 0.5) + (logic_sim * 0.3) + (emb_sim * 0.2)
    
    # Formula Match (15%) — Fuzzy compare required formulas
    s_formula = normalize_text(s_meta.get("requiredFormula", ""))
    t_formula = normalize_text(t_meta.get("requiredFormula", ""))
    if s_formula == t_formula:
        formula_match = 1.0
    elif s_formula in ("none", "") and t_formula in ("none", ""):
        formula_match = 1.0  # Both require no formula
    elif s_formula in ("none", "") or t_formula in ("none", ""):
        formula_match = 0.0  # One needs formula, other doesn't
    else:
        formula_match = fuzzy_field_match(s_formula, t_formula)
        
    # Visual Element Match (factor into pattern)
    s_images = source_q.get("images", [])
    t_images = target_q.get("images", [])
    s_img_desc = " ".join([i.get("description", "") for i in s_images])
    t_img_desc = " ".join([i.get("description", "") for i in t_images])
    
    img_sim = fuzzy_field_match(s_img_desc, t_img_desc)
    
    # Question Pattern (10%) — Fuzzy compare question intent + Visual Elements
    intent_match = fuzzy_field_match(
        s_meta.get("questionIntent", ""),
        t_meta.get("questionIntent", "")
    )
    if s_images or t_images:
        pattern_match = (intent_match * 0.5) + (img_sim * 0.5)
    else:
        pattern_match = intent_match
    
    # Values Match (5%) — Check if numerical values/data in text are the same
    # Use normalized text comparison instead of strict equality
    if s_text == t_text:
        values_match = 1.0
    elif text_ratio >= 0.7:
        values_match = text_ratio
    else:
        values_match = 0.0
    
    # Language Similarity (5%)
    lang_match = max(emb_sim, text_ratio)
    
    # Apply weights
    overall_score = (
        (concept_match * 0.35) +
        (logic_match * 0.30) +
        (formula_match * 0.15) +
        (pattern_match * 0.10) +
        (values_match * 0.05) +
        (lang_match * 0.05)
    )
    
    overall_percent = round(overall_score * 100, 2)
    
    # Determine Match Type
    if overall_percent >= 85:
        match_type = "EXACT"
    elif overall_percent >= 60:
        match_type = "CONCEPT_REPEATED"
    elif overall_percent >= 40:
        match_type = "MODIFIED"
    else:
        match_type = "NEW"
        
    return {
        "sourceQuestionId": source_q.get("id"),
        "targetQuestionId": target_q.get("id"),
        "conceptMatch": round(concept_match * 100, 2),
        "logicMatch": round(logic_match * 100, 2),
        "formulaMatch": round(formula_match * 100, 2),
        "patternMatch": round(pattern_match * 100, 2),
        "valuesMatch": round(values_match * 100, 2),
        "languageSimilarity": round(lang_match * 100, 2),
        "overallSimilarity": overall_percent,
        "matchType": match_type,
        "reasoning": f"Calculated based on {concept_match*100:.0f}% concept match, {logic_match*100:.0f}% logic match, and {pattern_match*100:.0f}% pattern/diagram match.",
        "matchedQuestionText": target_q.get("questionText", ""),
        "matchedQuestionImages": target_q.get("images", []),
        "originalQuestion": {
            "questionText": source_q.get("questionText", ""),
            "marks": source_q.get("marks", 5),
            "metadata": source_q.get("metadata", {}),
            "images": source_q.get("images", [])
        }
    }

def search_pyq_database(questions: List[Dict[str, Any]], historical_pool: List[Dict[str, Any]], threshold: float = 40.0) -> List[Dict[str, Any]]:
    """
    Compares a list of current questions against a historical pool of PYQs.
    Returns the similarity reports for matches above the threshold.
    """
    reports = []
    
    for current_q in questions:
        best_match = None
        best_score = -1
        
        for hist_q in historical_pool:
            report = calculate_similarity_report(current_q, hist_q)
            if report["overallSimilarity"] > best_score:
                best_score = report["overallSimilarity"]
                best_match = report
                
        if best_match and best_score >= threshold:
            reports.append(best_match)
            
    return reports

def compute_overall_paper_analytics(questions: List[Dict[str, Any]], reports: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregates the individual reports into paper-level statistics.
    """
    total_q = len(questions)
    if total_q == 0:
        return {}
        
    exact_c = sum(1 for r in reports if r["matchType"] == "EXACT")
    concept_c = sum(1 for r in reports if r["matchType"] == "CONCEPT_REPEATED")
    modified_c = sum(1 for r in reports if r["matchType"] == "MODIFIED")
    
    # Questions that found a match above threshold
    matched_count = len(reports)
    new_c = total_q - matched_count
        
    overall_rep = ((exact_c * 1.0) + (concept_c * 0.7) + (modified_c * 0.4)) / total_q * 100
    
    return {
        "totalQuestions": total_q,
        "overallRepetitionPercent": round(min(100.0, overall_rep), 2),
        "fullyRepeated": exact_c,
        "conceptRepeated": concept_c,
        "modified": modified_c,
        "newQuestions": new_c
    }
