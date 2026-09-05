from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.tools.travel_search import search_travel

router = APIRouter(prefix="/travel", tags=["Travel"])

class TravelSearchRequest(BaseModel):
    origin: str
    destination: str
    travel_date: Optional[str] = None
    time_preference: Optional[str] = None
    max_price: Optional[float] = None
    preference: Optional[str] = None
    transport_type: Optional[str] = None

@router.post("/search")
async def travel_search_endpoint(req: TravelSearchRequest) -> Dict[str, Any]:
    results = search_travel(
        origin=req.origin,
        destination=req.destination,
        travel_date=req.travel_date,
        time_preference=req.time_preference,
        max_price=req.max_price,
        preference=req.preference,
        transport_type=req.transport_type,
    )
    return {
        "type": "travel",
        "results": results
    }
