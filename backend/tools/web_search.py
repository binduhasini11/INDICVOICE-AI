import os
from typing import List, Dict, Any, Optional

FALLBACK_WEB_RESULTS: List[Dict[str, Any]] = [
    {
        "title": "ISRO Updates & Space Exploration Mission Highlights",
        "description": "Indian Space Research Organisation successfully conducts milestone tests for future lunar and solar exploration missions.",
        "source": "ISRO Official / News",
        "url": "https://www.isro.gov.in",
    },
    {
        "title": "Latest Artificial Intelligence and LLM Advancements in India",
        "description": "Indian AI ecosystem expands rapidly with multilingual models supporting 22 scheduled languages including Tamil, Telugu, and Hindi.",
        "source": "Tech News India",
        "url": "https://tech.economictimes.indiatimes.com",
    },
    {
        "title": "Indian Railways Modernization & Vande Bharat Network",
        "description": "New superfast train corridors connect major southern cities with reduced travel time and advanced amenities.",
        "source": "National Travel News",
        "url": "https://indianrailways.gov.in",
    }
]

def search_web_query(query: str) -> List[Dict[str, Any]]:
    """
    Search web using Tavily if API key is provided, or provide realistic contextual results.
    """
    tavily_key = os.getenv("TAVILY_API_KEY")
    if tavily_key:
        try:
            import requests # type: ignore
            response = requests.post(
                "https://api.tavily.com/search",
                json={"query": query, "api_key": tavily_key, "max_results": 5},
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                results = []
                for item in data.get("results", []):
                    results.append({
                        "type": "web",
                        "title": item.get("title", "Web Result"),
                        "description": item.get("content", ""),
                        "source": item.get("url", "Web"),
                        "url": item.get("url", "#"),
                        "image": None,
                        "metadata": {"score": item.get("score")}
                    })
                return results
        except Exception as e:
            print(f"Warning: Tavily search error: {e}")

    # Fallback contextual results matching query terms
    q = query.lower()
    matched = []
    for item in FALLBACK_WEB_RESULTS:
        if any(w in item["title"].lower() or w in item["description"].lower() for w in q.split() if len(w) > 2):
            matched.append(item)

    if not matched:
        matched = [
            {
                "title": f"Web information for: {query.title()}",
                "description": f"Recent articles, updates, and discussions regarding '{query}' across verified sources.",
                "source": "Web Search",
                "url": f"https://duckduckgo.com/?q={query.replace(' ', '+')}",
            }
        ]

    normalized = []
    for item in matched:
        normalized.append({
            "type": "web",
            "title": item["title"],
            "description": item["description"],
            "source": f"Demo Web Data ({item.get('source', 'Web')})",
            "url": item.get("url", "#"),
            "image": None,
            "metadata": {"is_demo": True}
        })
    return normalized

def search_web(intent: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Specialist interface adapter for Web Search Agent.
    """
    query = intent.get("query") or intent.get("message") or ""
    return search_web_query(query)
