from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from backend.services.search_service import execute_search


router = APIRouter(
    prefix="/travel",
    tags=["Travel"]
)


class TravelRequest(BaseModel):
    origin: str
    destination: str
    travel_date: Optional[str] = None
    time_preference: Optional[str] = None
    max_price: Optional[float] = None
    preference: Optional[str] = None


@router.post("/search")
def travel_search(request: TravelRequest):
    """
    Search for travel options using structured user intent.
    """

    intent = {
        "intent": "travel_search",
        "origin": request.origin,
        "destination": request.destination,
        "travel_date": request.travel_date,
        "time_preference": request.time_preference,
        "max_price": request.max_price,
        "preference": request.preference
    }

    try:
        result = execute_search(intent)

        return result


    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )