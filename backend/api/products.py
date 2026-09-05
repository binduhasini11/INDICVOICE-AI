from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from backend.services.search_service import execute_search


router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


class ProductRequest(BaseModel):
    query: str
    category: Optional[str] = None
    max_price: Optional[float] = None
    preference: Optional[str] = None


@router.post("/search")
def product_search(request: ProductRequest):

    intent = {
        "intent": "product_search",
        "query": request.query,
        "category": request.category,
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