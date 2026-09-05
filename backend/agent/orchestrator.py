import uuid
from typing import Dict, Any, List, Optional
from backend.agent.intent import extract_intent
from backend.agent.memory import memory_manager
from backend.agent.router import SpecialistRouter
from backend.agent.response import generate_natural_response

class CentralOrchestrator:
    """
    Central AI Agent Orchestration Layer.
    Coordinates intent extraction, context memory, parameter validation,
    specialist tool execution, result ranking, response generation, and session state.
    """

    def __init__(self):
        self.memory = memory_manager
        self.router = SpecialistRouter()

    def process_message(self, message: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        sid = session_id or str(uuid.uuid4())
        session = self.memory.get_or_create_session(sid)

        # 1. Intent & Entity Extraction
        raw_intent = extract_intent(message)

        # 2. Merge Multi-turn Context Memory
        intent = self.memory.merge_intent_context(sid, raw_intent, message)

        intent_type = intent.get("intent", "general_chat")

        # 3. Validate Required Parameters
        if intent_type == "travel_search":
            origin = intent.get("origin")
            destination = intent.get("destination")

            if not origin or not destination:
                lang = intent.get("language", "en")
                if not origin and not destination:
                    clarification = (
                        "Enga irundhu enga poganum? (Where are you travelling from and to?)"
                        if lang == "ta-en"
                        else "Kahan se kahan jaana chahte hain?" if lang == "hi-en"
                        else "Where are you travelling from and where would you like to go?"
                    )
                elif not origin:
                    clarification = (
                        f"Enga irundhu {destination} ku poganum? (Which city are you travelling from?)"
                        if lang == "ta-en"
                        else f"Kis city se {destination} jaana chahte hain?" if lang == "hi-en"
                        else f"Which city are you travelling from to {destination}?"
                    )
                else:
                    clarification = (
                        f"{origin} la irundhu enga poganum? (Where would you like to travel to?)"
                        if lang == "ta-en"
                        else f"{origin} se kahan jaana chahte hain?" if lang == "hi-en"
                        else f"Where would you like to travel to from {origin}?"
                    )

                session.update_intent(intent)
                session.add_message("user", message)
                session.add_message("assistant", clarification)

                return {
                    "status": "needs_clarification",
                    "message": clarification,
                    "intent": intent,
                    "results": [],
                    "result_type": None,
                    "session_id": sid,
                    "needs_clarification": True,
                }

        # 4. Route and Execute Specialist
        results, result_type, error_msg = self.router.route_and_execute(intent)

        if error_msg:
            err_response = "I encountered an issue retrieving results right now. Please try again."
            session.add_message("user", message)
            session.add_message("assistant", err_response)
            return {
                "status": "error",
                "message": err_response,
                "error_code": "SPECIALIST_EXECUTION_ERROR",
                "intent": intent,
                "results": [],
                "result_type": result_type,
                "session_id": sid,
                "needs_clarification": False,
            }

        # 5. Generate Natural Multilingual Response
        natural_response = generate_natural_response(intent, results)

        # 6. Save Turn in Memory
        session.update_intent(intent)
        session.add_message("user", message)
        session.add_message("assistant", natural_response)

        return {
            "status": "success",
            "message": natural_response,
            "intent": intent,
            "results": results,
            "result_type": result_type,
            "session_id": sid,
            "needs_clarification": False,
        }

# Global orchestrator singleton
orchestrator = CentralOrchestrator()
