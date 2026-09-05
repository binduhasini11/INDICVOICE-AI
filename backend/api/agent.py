from fastapi import APIRouter
from pydantic import BaseModel

from backend.agent.agent import process_message


router = APIRouter(
    prefix="/agent",
    tags=["Agent"]
)


class AgentRequest(BaseModel):
    message: str
    session_id: str = "default"


@router.post("/chat")
def agent_chat(request: AgentRequest):

    return process_message(
        user_text=request.message,
        session_id=request.session_id
    )