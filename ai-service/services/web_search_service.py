from duckduckgo_search import DDGS
from typing import List, Dict, Any

def search_web(query: str, max_results: int = 3) -> List[Dict[str, Any]]:
    """
    Perform a web search using DuckDuckGo and return a list of result dictionaries.
    Each dictionary contains 'title', 'href', and 'body' (the snippet).
    """
    try:
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append({
                    "title": r.get("title", ""),
                    "href": r.get("href", ""),
                    "body": r.get("body", "")
                })
        return results
    except Exception as e:
        print(f"Web Search Error: {e}")
        return []
