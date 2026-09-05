import os
from dotenv import load_dotenv

load_dotenv()
from typing import Optional

import requests


def web_search(
    query: str,
    max_results: int = 5,
    language: Optional[str] = None
):
    """
    Perform a web search.

    Uses Tavily if TAVILY_API_KEY is available.
    Returns an empty list if the API is unavailable.
    """

    api_key = os.getenv("TAVILY_API_KEY")

    if not api_key:
        print("TAVILY_API_KEY not found. Using fallback.")
        return []

    url = "https://api.tavily.com/search"

    payload = {
        "api_key": api_key,
        "query": query,
        "max_results": max_results,
        "search_depth": "basic"
    }

    if language:
        payload["query"] = f"{query} {language}"

    try:
        response = requests.post(
            url,
            json=payload,
            timeout=10
        )

        response.raise_for_status()

        data = response.json()

        results = []

        for item in data.get("results", []):
            results.append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "content": item.get("content", ""),
                "source": "Web Search"
            })

        return results

    except requests.RequestException as error:
        print(f"Web search failed: {error}")
        return []


if __name__ == "__main__":

    results = web_search(
        query="best budget travel options Chennai Bengaluru"
    )

    if results:
        for result in results:
            print("\nTitle:", result["title"])
            print("URL:", result["url"])
            print("Content:", result["content"][:200])

    else:
        print("No web results available.")