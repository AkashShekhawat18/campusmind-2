import json
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
    # 1. Base semantic similarity using embeddings (used as a proxy for language/pattern)
    emb_sim = 0.0
    if "embedding" in source_q and "embedding" in target_q and len(source_q["embedding"]) > 0 and len(target_q["embedding"]) > 0:
        emb_sim = cosine_similarity(source_q["embedding"], target_q["embedding"])
    else:
        # Fallback to SequenceMatcher if embeddings are not available
        s_text = source_q.get("questionText", "")
        t_text = target_q.get("questionText", "")
        emb_sim = difflib.SequenceMatcher(None, s_text, t_text).ratio()
        
    s_meta = source_q.get("metadata", {})
    t_meta = target_q.get("metadata", {})
    
    # Calculate dimensional scores (0 to 1)
    # Concept Match (35%)
    concept_match = 1.0 if s_meta.get("concept") == t_meta.get("concept") else (emb_sim if emb_sim > 0.7 else 0.0)
    if s_meta.get("subconcept") == t_meta.get("subconcept"):
        concept_match = min(1.0, concept_match + 0.2)
        
    # Logic Match (30%)
    # Logic is harder to exact match textually, so we rely on intent and general semantic similarity of the logic string
    logic_match = 1.0 if s_meta.get("solvingMethod") == t_meta.get("solvingMethod") else emb_sim
    
    # Formula Match (15%)
    s_formula = s_meta.get("requiredFormula", "").lower()
    t_formula = t_meta.get("requiredFormula", "").lower()
    if s_formula != "none" and s_formula == t_formula:
        formula_match = 1.0
    elif s_formula == "none" and t_formula == "none":
        formula_match = 1.0 # Both require no formula
    else:
        formula_match = 0.0
        
    # Question Pattern (10%)
    pattern_match = 1.0 if s_meta.get("questionIntent") == t_meta.get("questionIntent") else 0.5
    
    # Values Match (5%) - Simple heuristic based on numerical presence in text or exact string match
    values_match = 1.0 if source_q.get("questionText") == target_q.get("questionText") else 0.0 # Strict for now unless LLM verified
    
    # Language Similarity (5%)
    lang_match = emb_sim
    
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
        "reasoning": f"Calculated based on {concept_match*100:.0f}% concept match and {logic_match*100:.0f}% logic match.",
        "originalQuestion": {
            "questionText": source_q.get("questionText", ""),
            "marks": source_q.get("marks", 5),
            "metadata": source_q.get("metadata", {})
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
    
    matched_q_ids = {r["sourceQuestionId"] for r in reports}
    new_c = total_q - len(matched_q_ids)
    
    # Handle case where report is generated but it's NEW (score < 40)
    for r in reports:
        if r["matchType"] == "NEW" and r["sourceQuestionId"] in matched_q_ids:
            # It was matched below threshold, so technically NEW
            new_c += 1
            # Adjust the other counts
            pass # We already filtered above
            
    overall_rep = ((exact_c * 1.0) + (concept_c * 0.7) + (modified_c * 0.4)) / total_q * 100
    
    return {
        "totalQuestions": total_q,
        "overallRepetitionPercent": round(min(100.0, overall_rep), 2),
        "fullyRepeated": exact_c,
        "conceptRepeated": concept_c,
        "modified": modified_c,
        "newQuestions": new_c
    }
