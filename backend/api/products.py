from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.tools.product_search import search_products

router = APIRouter(prefix="/products", tags=["Products"])

class ProductSearchRequest(BaseModel):
    query: str
    category: Optional[str] = None
    max_price: Optional[float] = None
    preference: Optional[str] = None

@router.post("/search")
async def product_search_endpoint(req: ProductSearchRequest) -> Dict[str, Any]:
    results = search_products(
        query=req.query,
        category=req.category,
        max_price=req.max_price,
        preference=req.preference,
    )
    return {
        "type": "product",
        "results": results
    }
