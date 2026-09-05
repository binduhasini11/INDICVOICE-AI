from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.tools.travel_search import search_travel, sanitize_and_verify_bus_url

router = APIRouter(prefix="/travel", tags=["Travel"])

class BusUrlVerifyRequest(BaseModel):
    url: Optional[str] = None
    origin: Optional[str] = ""
    destination: Optional[str] = ""
    operator: Optional[str] = None
    bus_type: Optional[str] = None
    travel_date: Optional[str] = None
    date: Optional[str] = None

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

@router.post("/verify-url")
async def verify_bus_url_endpoint(req: BusUrlVerifyRequest) -> Dict[str, Any]:
    journey_date = req.travel_date or req.date
    verified_url = sanitize_and_verify_bus_url(
        url=req.url,
        origin=req.origin or "",
        destination=req.destination or "",
        operator=req.operator,
        bus_type=req.bus_type,
        travel_date=journey_date
    )
    return {
        "valid": True,
        "original_url": req.url,
        "verified_url": verified_url,
        "provider": "redBus" if "redbus.in" in verified_url else "Official Operator",
        "is_redirected_to_route": verified_url != req.url,
        "date": journey_date
    }

