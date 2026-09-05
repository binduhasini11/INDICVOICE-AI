from backend.tools.travel_search import search_travel
from backend.tools.product_search import search_products
from backend.tools.web_search import web_search
from backend.services.ranking import rank_results


def execute_search(intent: dict):
    """
    Execute a search based on the structured intent
    produced by the AI/intent engine.
    """

    intent_type = intent.get("intent", "").lower()

    # TRAVEL SEARCH
    if intent_type == "travel_search":

        results = search_travel(
            origin=intent.get("origin", ""),
            destination=intent.get("destination", ""),
            travel_date=intent.get("travel_date"),
            time_preference=intent.get("time_preference"),
            max_price=intent.get("max_price"),
            preference=intent.get("preference"),
        )

        results = rank_results(
            results,
            intent.get("preference")
        )

        return {
            "type": "travel",
            "results": results
        }

    # PRODUCT SEARCH
    elif intent_type == "product_search":

        results = search_products(
            query=intent.get("query", ""),
            category=intent.get("category"),
            max_price=intent.get("max_price"),
            preference=intent.get("preference"),
        )

        results = rank_results(
            results,
            intent.get("preference")
        )

        return {
            "type": "product",
            "results": results
        }

    # GENERAL WEB SEARCH
    elif intent_type == "web_search":

        query = intent.get("query", "")

        results = web_search(
            query=query,
            max_results=intent.get("max_results", 5)
        )

        return {
            "type": "web",
            "results": results
        }


    # UNKNOWN INTENT
    else:

        return {
            "type": "error",
            "message": "Unknown search intent.",
            "results": []
        }


if __name__ == "__main__":

    # Demo structured intent
    demo_intent = {
        "intent": "travel_search",
        "origin": "Chennai",
        "destination": "Bangalore",
        "time_preference": "morning",
        "preference": "cheapest"
    }

    response = execute_search(demo_intent)

    print("\nSearch Type:", response["type"])
    print("\nResults:")

    for result in response["results"]:
        print(result)