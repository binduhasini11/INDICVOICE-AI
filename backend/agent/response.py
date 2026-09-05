from typing import Dict, Any, List

def generate_natural_response(
    intent: Dict[str, Any],
    results: List[Dict[str, Any]],
    needs_clarification: bool = False,
    clarification_question: str = None
) -> str:
    """
    Generate conversational, culturally attuned response based on intent, results, and detected language.
    """
    lang = intent.get("language", "en")
    intent_type = intent.get("intent", "general_chat")

    if needs_clarification and clarification_question:
        return clarification_question

    if intent_type == "travel_search":
        origin = intent.get("origin") or "origin"
        destination = intent.get("destination") or "destination"
        transport = intent.get("transport_type") or "travel"
        count = len(results)

        if count == 0:
            if lang == "ta-en":
                return f"Mannikavum, {origin} la irundhu {destination} ku options kedaikala. Vera time or date check panlama?"
            elif lang == "hi-en":
                return f"Maaf kijiye, {origin} se {destination} ke liye koi option nahi mila. Kripya doosri date ya time try karein."
            else:
                return f"Sorry, I couldn't find any {transport} options from {origin} to {destination}."

        if lang == "ta-en":
            return f"Naan {origin} la irundhu {destination} ku {count} {transport} options kandupidichuten. Keela check pannunga!"
        elif lang == "hi-en":
            return f"Maine {origin} se {destination} ke liye {count} {transport} options dhundhe hain. Neeche details dekhein."
        else:
            return f"I found {count} {transport} options from {origin} to {destination} matching your preferences."

    elif intent_type == "product_search":
        item_name = intent.get("product") or "products"
        count = len(results)

        if count == 0:
            if lang == "hi-en":
                return f"Maaf kijiye, aapke budget mein koi {item_name} nahi mila."
            elif lang == "ta-en":
                return f"Unga budget kulla {item_name} kedaikala."
            else:
                return f"I couldn't find any {item_name} within the specified criteria."

        if lang == "hi-en":
            return f"Aapke liye {count} badhiya {item_name} options mile hain. Neeche check karein."
        elif lang == "ta-en":
            return f"Ungalukaga {count} nalla {item_name} options iruku. Keela paarunga."
        else:
            return f"I found {count} great {item_name} options for you."

    elif intent_type == "web_search":
        q = intent.get("query") or "topic"
        count = len(results)
        if count == 0:
            return f"No recent web updates found for '{q}'."
        return f"Here is the latest information regarding '{q}'."

    elif intent_type == "general_chat":
        if lang == "ta-en":
            return "Vanakkam! Naan unga IndicVoice AI assistant. Travel tickets, products, or web updates keka ungalukku naan help panren."
        elif lang == "hi-en":
            return "Namaste! Main aapka IndicVoice AI assistant hoon. Travel tickets, products ya news ke bare mein batayein, main madad karunga."
        else:
            return "Hello! I am your IndicVoice AI assistant. You can ask me about travel bookings, products, or search information in English, Tamil, or Hindi."

    return "How else may I help you today?"
