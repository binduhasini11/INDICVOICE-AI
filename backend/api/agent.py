from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from backend.agent.orchestrator import orchestrator

router = APIRouter(prefix="/agent", tags=["Agent"])

class ChatRequest(BaseModel):
    message: str = Field(..., description="User transcript or text message")
    session_id: Optional[str] = Field(None, description="Client session identifier")

class ChatResponse(BaseModel):
    status: str
    message: str
    intent: Optional[Dict[str, Any]] = None
    results: List[Dict[str, Any]] = []
    result_type: Optional[str] = None
    session_id: str
    needs_clarification: bool = False
    error_code: Optional[str] = None

@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(req: ChatRequest):
    """
    Central AI agent orchestration endpoint.
    Receives voice transcripts or text input, handles intent detection,
    specialist routing, result normalization, and conversational responses.
    """
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        response_data = orchestrator.process_message(
            message=req.message.strip(),
            session_id=req.session_id
        )
        return ChatResponse(**response_data)
    except Exception as e:
        # Prevent stack trace leakage while returning compliant error schema
        return ChatResponse(
            status="error",
            message="Internal server error processing agent request.",
            error_code="ORCHESTRATOR_INTERNAL_ERROR",
            session_id=req.session_id or "default",
            results=[],
            needs_clarification=False
        )
