from typing import Dict, Any, List, Optional

class SessionMemory:
    """Stores conversation turns and context for a single user session."""
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.messages: List[Dict[str, str]] = []
        self.last_intent: Optional[Dict[str, Any]] = None

    def add_message(self, role: str, content: str):
        self.messages.append({"role": role, "content": content})

    def update_intent(self, intent: Dict[str, Any]):
        self.last_intent = intent

    def get_context(self) -> Optional[Dict[str, Any]]:
        return self.last_intent


class MemoryManager:
    """Manages multi-session conversation memories and intent merging."""
    def __init__(self):
        self._sessions: Dict[str, SessionMemory] = {}

    def get_or_create_session(self, session_id: str) -> SessionMemory:
        sid = session_id or "default"
        if sid not in self._sessions:
            self._sessions[sid] = SessionMemory(sid)
        return self._sessions[sid]

    def merge_intent_context(self, session_id: str, current_intent: Dict[str, Any], raw_message: str) -> Dict[str, Any]:
        """
        Merge context from the previous turn if:
        1. Current intent is same as last intent, OR
        2. Current intent is an ambiguous continuation (e.g. user just said 'naalaiku morning' or 'buses' or 'wireless')
        If user explicitly switched to a different intent, discard previous context.
        """
        session = self.get_or_create_session(session_id)
        prev_intent = session.get_context()

        if not prev_intent:
            return current_intent

        curr_type = current_intent.get("intent")
        prev_type = prev_intent.get("intent")

        # Check if user explicitly switched to a distinct intent
        # (e.g. previous was travel_search, now product_search)
        if curr_type in ["travel_search", "product_search", "web_search"]:
            if prev_type in ["travel_search", "product_search", "web_search"] and curr_type != prev_type:
                # Distinct topic switch! Do not carry over unrelated fields
                return current_intent

        # If current intent is general_chat or same intent, check if message provides missing slots
        if curr_type == "general_chat" and prev_type in ["travel_search", "product_search"]:
            # Evaluate if message is a follow-up answer
            merged = dict(prev_intent)
            lower = raw_message.lower()

            if prev_type == "travel_search":
                # Check transport change like "only buses", "train", "flight"
                if "bus" in lower:
                    merged["transport_type"] = "bus"
                elif "train" in lower:
                    merged["transport_type"] = "train"
                elif "flight" in lower:
                    merged["transport_type"] = "flight"

                # Check date / time in continuation
                if any(w in lower for w in ["tomorrow", "naalaiku", "kal"]):
                    merged["date"] = "tomorrow"
                elif any(w in lower for w in ["today", "innaiku", "aaj"]):
                    merged["date"] = "today"

                if any(w in lower for w in ["morning", "kaalai", "subah"]):
                    merged["time"] = "morning"
                elif any(w in lower for w in ["evening", "maalai", "shaam"]):
                    merged["time"] = "evening"
                elif any(w in lower for w in ["night", "raathri", "raat"]):
                    merged["time"] = "night"

                # Check preference in continuation
                if any(w in lower for w in ["cheap", "cheapest", "sasta", "kammi-a"]):
                    merged["preference"] = "cheapest"
                elif any(w in lower for w in ["fast", "fastest", "early", "earliest"]):
                    merged["preference"] = "fastest"

                # If origin or destination missing, see if provided
                from backend.agent.intent import extract_cities
                o, d = extract_cities(raw_message)
                if o and not merged.get("origin"):
                    merged["origin"] = o
                if d and not merged.get("destination"):
                    merged["destination"] = d

                return merged

            elif prev_type == "product_search":
                if any(w in lower for w in ["wireless", "bluetooth", "wired", "best", "cheap"]):
                    merged["preference"] = raw_message.strip()
                return merged

        # If same intent type, inherit un-filled fields from previous turn
        if curr_type == prev_type:
            merged = dict(prev_intent)
            for k, v in current_intent.items():
                if v is not None:
                    merged[k] = v
            return merged

        return current_intent

# Global memory instance
memory_manager = MemoryManager()
