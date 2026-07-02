from typing import List, Dict, Any

def compute_paper_analytics(extracted_questions: List[Dict[str, Any]], similarity_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes overall paper similarity, unique/repeated counts, and topic distributions.
    """
    total_questions = len(extracted_questions)
    if total_questions == 0:
        return {
            "overallSimilarity": 0.0,
            "repeatedCount": 0,
            "uniqueCount": 0,
            "totalQuestions": 0,
            "topicDistribution": "{}",
            "yearDistribution": "{}"
        }
        
    repeated_q_ids = set()
    topic_counts = {}
    year_counts = {}
    
    total_similarity_sum = 0.0
    
    for sim in similarity_results:
        # Avoid counting the same source question multiple times if it matched multiple targets
        if sim["sourceQuestionId"] not in repeated_q_ids:
            repeated_q_ids.add(sim["sourceQuestionId"])
            total_similarity_sum += sim["similarityScore"]
            
            # Year distribution
            matched_year = sim.get("matchedYear")
            if matched_year:
                year_counts[str(matched_year)] = year_counts.get(str(matched_year), 0) + 1

    # Add 0% for unique questions to the sum
    # The average similarity across the paper:
    overall_similarity = total_similarity_sum / total_questions if total_questions > 0 else 0.0
    
    # Topic distribution
    for q in extracted_questions:
        topic = q.get("topic")
        if topic:
            topic_counts[topic] = topic_counts.get(topic, 0) + 1
            
    repeated_count = len(repeated_q_ids)
    unique_count = total_questions - repeated_count
    
    import json
    return {
        "overallSimilarity": round(overall_similarity, 2),
        "repeatedCount": repeated_count,
        "uniqueCount": unique_count,
        "totalQuestions": total_questions,
        "topicDistribution": json.dumps(topic_counts),
        "yearDistribution": json.dumps(year_counts)
    }
