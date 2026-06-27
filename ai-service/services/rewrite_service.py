import os
import random
from groq import Groq

def get_groq_client():
    keys = os.environ.get("GROQ_API_KEYS", "")
    key_list = [k.strip() for k in keys.split(",") if k.strip()]
    if not key_list:
        raise ValueError("GROQ_API_KEYS not configured")
    return Groq(api_key=random.choice(key_list))

def generate_rewrite(original_text: str, marks: int, topic: str) -> str:
    """
    Generates a completely fresh question on the same topic, marks, and difficulty.
    """
    client = get_groq_client()
    prompt = f"""
    You are an expert academic examiner.
    A teacher has found that this question has been repeated too many times in previous years.
    
    Original Question: "{original_text}"
    Topic: {topic}
    Marks: {marks}
    
    Task: Write a completely fresh, new question that tests the same learning objective, topic, and difficulty level as the original.
    Change the wording entirely. If the original asked for a definition, ask for an application or comparison.
    Do NOT include conversational text. Output ONLY the new question text.
    """
    
    try:
        res = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.7
        )
        return res.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating rewrite: {e}")
        return "Failed to generate rewrite."
