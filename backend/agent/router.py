from typing import Dict, Any, List, Tuple, Optional
from backend.services.search_service import SearchService

class SpecialistRouter:
    """
    Central router that directs structured intent to the appropriate specialist agent.
    Encapsulates specialist execution and error containment.
    """

    @staticmethod
    def route_and_execute(intent: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], str, Optional[str]]:
        """
        Executes the routed specialist tool.
        Returns: (results, result_type, error_message)
        """
        intent_type = intent.get("intent", "general_chat")

        try:
            if intent_type == "travel_search":
                results = SearchService.execute_travel(intent)
                return results, "travel", None

            elif intent_type == "product_search":
                results = SearchService.execute_product(intent)
                return results, "product", None

            elif intent_type == "web_search":
                results = SearchService.execute_web(intent)
                return results, "web", None

            elif intent_type == "general_chat":
                return [], "chat", None

            else:
                return [], "unknown", None

        except Exception as e:
            # Error isolation: Specialist failure should not crash the orchestrator
            print(f"Error in specialist agent '{intent_type}': {e}")
            return [], intent_type.replace("_search", ""), str(e)
