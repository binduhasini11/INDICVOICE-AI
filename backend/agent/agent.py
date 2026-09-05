"""Central agent entrypoint for IndicVoice AI."""
from typing import Dict, Any, Optional
from backend.agent.orchestrator import orchestrator, CentralOrchestrator

def run_agent(message: str, session_id: Optional[str] = None) -> Dict[str, Any]:
    """Execute the central orchestrator pipeline for an incoming user message."""
    return orchestrator.process_message(message=message, session_id=session_id)

__all__ = ["orchestrator", "CentralOrchestrator", "run_agent"]
