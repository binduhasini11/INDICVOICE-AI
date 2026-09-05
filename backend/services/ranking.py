from typing import List, Dict, Any

def rank_results(results: List[Dict[str, Any]], preference: str = None) -> List[Dict[str, Any]]:
    """
    Rank normalized results deterministically based on user preference.
    """
    if not results:
        return results

    if not preference:
        return results

    pref = preference.lower().strip()

    if pref in ["cheapest", "lowest_price", "low_price", "budget", "cheap"]:
        # Only rank by price if price exists
        return sorted(results, key=lambda x: x.get("price") if x.get("price") is not None else float("inf"))

    if pref in ["earliest", "early", "fastest", "quick"]:
        def get_sort_key(item: Dict[str, Any]):
            meta = item.get("metadata", {})
            dep = meta.get("departure") or "99:99"
            return dep
        return sorted(results, key=get_sort_key)

    if pref in ["rating", "best_rated", "top_rated"]:
        def get_rating(item: Dict[str, Any]):
            meta = item.get("metadata", {})
            return meta.get("rating", 0)
        return sorted(results, key=get_rating, reverse=True)

    return results
