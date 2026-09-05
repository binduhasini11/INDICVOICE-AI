from typing import List, Dict, Any
from backend.tools.travel_search import search_travel
from backend.tools.product_search import search_product
from backend.tools.web_search import search_web
from backend.services.ranking import rank_results

class SearchService:
    """
    Search Service acting as a clean execution delegate for specialist search tools.
    Separates low-level data fetching from orchestrator control flow.
    """

    @staticmethod
    def execute_travel(intent: Dict[str, Any]) -> List[Dict[str, Any]]:
        results = search_travel(
            origin=intent.get("origin", ""),
            destination=intent.get("destination", ""),
            travel_date=intent.get("date"),
            time_preference=intent.get("time"),
            max_price=intent.get("budget"),
            preference=intent.get("preference"),
            transport_type=intent.get("transport_type"),
            requested_departure_time=intent.get("requested_departure_time"),
            requested_arrival_time=intent.get("requested_arrival_time"),
        )
        return rank_results(results, intent.get("preference"), options=intent)

    @staticmethod
    def execute_product(intent: Dict[str, Any]) -> List[Dict[str, Any]]:
        results = search_product(intent)
        return rank_results(results, intent.get("preference"))

    @staticmethod
    def execute_web(intent: Dict[str, Any]) -> List[Dict[str, Any]]:
        return search_web(intent)
