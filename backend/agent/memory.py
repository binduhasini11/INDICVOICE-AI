# Simple in-memory conversation storage

conversation_memory = {}


def get_memory(session_id: str):
    """
    Get the conversation history for a session.
    """

    return conversation_memory.get(
        session_id,
        {
            "messages": [],
            "last_intent": None
        }
    )


def save_memory(
    session_id: str,
    user_message: str,
    assistant_message: str,
    intent: dict
):
    """
    Save the current conversation to memory.
    """

    if session_id not in conversation_memory:

        conversation_memory[session_id] = {
            "messages": [],
            "last_intent": None
        }

    # Save user's message
    conversation_memory[session_id]["messages"].append(
        {
            "role": "user",
            "content": user_message
        }
    )

    # Save assistant's response
    conversation_memory[session_id]["messages"].append(
        {
            "role": "assistant",
            "content": assistant_message
        }
    )

    # Save the latest intent
    conversation_memory[session_id]["last_intent"] = intent