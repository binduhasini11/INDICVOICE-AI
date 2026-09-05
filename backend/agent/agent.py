from backend.agent.intent import extract_intent
from backend.agent.memory import get_memory, save_memory
from backend.tools.travel_search import search_travel


# ============================================================
# MERGE CURRENT INTENT WITH PREVIOUS MEMORY
# ============================================================

def merge_intent(current, previous):

    """
    Combine the current user message with the previous
    conversation context.

    Example:

    User:
        Chennai to Bangalore tomorrow

    Assistant:
        asks for preference

    User:
        Morning cheap-a

    Final intent becomes:

        origin = Chennai
        destination = Bangalore
        date = tomorrow
        time = morning
        preference = cheapest
    """

    if not previous:
        return current

    # --------------------------------------------------------
    # Only merge when the previous request was the same intent
    # --------------------------------------------------------

    if current.intent != previous.get("intent"):
        return current

    # --------------------------------------------------------
    # Travel fields
    # --------------------------------------------------------

    if not current.origin:
        current.origin = previous.get("origin")

    if not current.destination:
        current.destination = previous.get("destination")

    if not current.date:
        current.date = previous.get("date")

    if not current.time:
        current.time = previous.get("time")

    if not current.preference:
        current.preference = previous.get("preference")

    if not current.transport_type:
        current.transport_type = previous.get(
            "transport_type"
        )

    if not current.budget:
        current.budget = previous.get("budget")

    # --------------------------------------------------------
    # Product fields
    # --------------------------------------------------------

    if not current.product:
        current.product = previous.get("product")

    # --------------------------------------------------------
    # Web search fields
    # --------------------------------------------------------

    if not current.query:
        current.query = previous.get("query")

    return current


# ============================================================
# CHECK REQUIRED FIELDS
# ============================================================

def check_missing_fields(intent):

    """
    Determine which required information is missing.
    """

    missing = []

    # --------------------------------------------------------
    # Travel
    # --------------------------------------------------------

    if intent.intent == "travel_search":

        if not intent.origin:
            missing.append("origin")

        if not intent.destination:
            missing.append("destination")

    # --------------------------------------------------------
    # Product
    # --------------------------------------------------------

    elif intent.intent == "product_search":

        if not intent.product:
            missing.append("product")

    # --------------------------------------------------------
    # Web search
    # --------------------------------------------------------

    elif intent.intent == "web_search":

        if not intent.query:
            missing.append("query")

    return missing


# ============================================================
# GENERATE CLARIFICATION
# ============================================================

def generate_clarification(missing_fields):

    """
    Generate a simple question when required information
    is missing.
    """

    # Both cities missing
    if (
        "origin" in missing_fields
        and "destination" in missing_fields
    ):
        return (
            "Where are you travelling from "
            "and where would you like to go?"
        )

    # Origin missing
    if "origin" in missing_fields:

        return (
            "Which city are you travelling from?"
        )

    # Destination missing
    if "destination" in missing_fields:

        return (
            "Where would you like to travel?"
        )

    # Product missing
    if "product" in missing_fields:

        return (
            "What product are you looking for?"
        )

    # Query missing
    if "query" in missing_fields:

        return (
            "What would you like me to search for?"
        )

    return (
        "Could you provide a little more information?"
    )


# ============================================================
# GENERAL RESPONSE
# ============================================================

def generate_response(intent):

    """
    Generate responses for intents that do not currently
    require an external tool.
    """

    # --------------------------------------------------------
    # General chat
    # --------------------------------------------------------

    if intent.intent == "general_chat":

        return (
            "Hello! I can help you with travel searches, "
            "product searches, web searches, and general questions."
        )

    # --------------------------------------------------------
    # Product search
    # --------------------------------------------------------

    elif intent.intent == "product_search":

        response = (
            f"I understood that you are looking for "
            f"{intent.product}."
        )

        if intent.budget:

            response += (
                f" Your budget is "
                f"₹{intent.budget:.0f}."
            )

        if intent.preference:

            response += (
                f" Your preference is "
                f"{intent.preference}."
            )

        return response

    # --------------------------------------------------------
    # Web search
    # --------------------------------------------------------

    elif intent.intent == "web_search":

        return (
            f"I understood that you want me to search for: "
            f"{intent.query}"
        )

    # --------------------------------------------------------
    # Unknown
    # --------------------------------------------------------

    return (
        "I'm not sure what you are looking for. "
        "Could you please explain?"
    )


# ============================================================
# TRAVEL RESPONSE
# ============================================================

def generate_travel_response(intent, results):

    """
    Generate a useful natural-language response based on
    travel search results.
    """

    route = (
        f"from {intent.origin} "
        f"to {intent.destination}"
    )

    # --------------------------------------------------------
    # No results
    # --------------------------------------------------------

    if not results:

        message = (
            f"Sorry, I couldn't find travel options "
            f"{route}."
        )

        if intent.transport_type:

            message += (
                f" I checked for "
                f"{intent.transport_type} options."
            )

        if intent.budget:

            message += (
                f" within a budget of "
                f"₹{intent.budget:.0f}."
            )

        return message

    # --------------------------------------------------------
    # Base response
    # --------------------------------------------------------

    message = (
        f"I found {len(results)} travel option"
        f"{'s' if len(results) != 1 else ''} "
        f"{route}."
    )

    # --------------------------------------------------------
    # Mention filters
    # --------------------------------------------------------

    if intent.transport_type:

        message += (
            f" Transport: "
            f"{intent.transport_type}."
        )

    if intent.time:

        message += (
            f" Time: {intent.time}."
        )

    if intent.preference:

        message += (
            f" Sorted by {intent.preference}."
        )

    if intent.budget:

        message += (
            f" Budget: ₹{intent.budget:.0f}."
        )

    return message


# ============================================================
# MAIN AGENT
# ============================================================

def process_message(
    user_text: str,
    session_id: str
):

    """
    Main agent pipeline:

        User message
              ↓
        Intent extraction
              ↓
        Memory merge
              ↓
        Missing field check
              ↓
        Tool selection
              ↓
        Tool execution
              ↓
        Response
              ↓
        Memory update
    """

    # ========================================================
    # STEP 1: GET PREVIOUS MEMORY
    # ========================================================

    memory = get_memory(session_id)

    previous_intent = memory.get(
        "last_intent"
    )

    # ========================================================
    # STEP 2: EXTRACT CURRENT INTENT
    # ========================================================

    intent = extract_intent(user_text)

    # ========================================================
    # STEP 3: MERGE WITH PREVIOUS CONTEXT
    # ========================================================

    intent = merge_intent(
        intent,
        previous_intent
    )

    # ========================================================
    # STEP 4: CHECK REQUIRED INFORMATION
    # ========================================================

    missing = check_missing_fields(
        intent
    )

    # ========================================================
    # STEP 5: ASK CLARIFICATION IF NEEDED
    # ========================================================

    if missing:

        message = generate_clarification(
            missing
        )

        save_memory(
            session_id=session_id,
            user_message=user_text,
            assistant_message=message,
            intent=intent.model_dump()
        )

        return {
            "status": "needs_clarification",

            "message": message,

            "intent": intent.model_dump(),

            "results": []
        }

    # ========================================================
    # STEP 6: TRAVEL AGENT
    # ========================================================

    if intent.intent == "travel_search":

        results = search_travel(
        origin=intent.origin,
        destination=intent.destination,
        travel_date=intent.date,
        time_preference=intent.time,
        max_price=intent.budget,
        preference=intent.preference
    )

        # ----------------------------------------------------
        # Generate travel response
        # ----------------------------------------------------

        message = generate_travel_response(
            intent,
            results
        )

        # ----------------------------------------------------
        # Save conversation memory
        # ----------------------------------------------------

        save_memory(
            session_id=session_id,

            user_message=user_text,

            assistant_message=message,

            intent=intent.model_dump()
        )

        # ----------------------------------------------------
        # Return result
        # ----------------------------------------------------

        return {

            "status": "success",

            "message": message,

            "intent": intent.model_dump(),

            "results": results
        }

    # ========================================================
    # STEP 7: OTHER INTENTS
    # ========================================================

    message = generate_response(
        intent
    )

    # ========================================================
    # STEP 8: SAVE MEMORY
    # ========================================================

    save_memory(
        session_id=session_id,

        user_message=user_text,

        assistant_message=message,

        intent=intent.model_dump()
    )

    # ========================================================
    # STEP 9: RETURN RESPONSE
    # ========================================================

    return {

        "status": "success",

        "message": message,

        "intent": intent.model_dump(),

        "results": []
    }
    