import os
import random
from groq import Groq

class QuestionGeneratorAgent:
    """
    Agent responsible for generating alternative/new questions without semantic duplication.
    """
    def __init__(self):
        self._init_groq()
        
    def _init_groq(self):
        keys = os.environ.get("GROQ_API_KEYS", "")
        key_list = [k.strip() for k in keys.split(",") if k.strip()]
        if key_list:
            self.groq_client = Groq(api_key=random.choice(key_list))
        else:
            self.groq_client = None

    def generate_rewrite(self, original_text: str, marks: int, topic: str) -> str:
        """
        Rewrites a question while preserving difficulty and topic, avoiding semantic duplication.
        """
        if not self.groq_client:
            return "AI Service unavailable."
            
        system_prompt = (
            "You are an expert academic question writer. Generate a completely fresh question that tests the exact same concepts as the provided question.\n\n"
            "REQUIREMENTS:\n"
            f"- Same syllabus/topic: {topic}\n"
            f"- Same marks: {marks}\n"
            "- Same Bloom's Taxonomy level and difficulty.\n"
            "- NO semantic duplication (change the scenario, numbers, entities, or structural approach completely).\n"
            "- Output ONLY the new question text.\n"
            "- Use standard LaTeX format ($ or $$) for all math."
        )

        try:
            res = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Original Question:\n{original_text}"}
                ],
                model="openai/gpt-oss-120b",
                temperature=0.8,
                max_tokens=1024
            )
            return res.choices[0].message.content.strip()
        except Exception as e:
            print(f"Question Generator Agent Error: {e}")
            return "Failed to generate rewrite."
