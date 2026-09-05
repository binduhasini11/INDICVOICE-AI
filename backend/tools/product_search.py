from typing import List, Dict, Any, Optional

# Demo catalog for product search agent
PRODUCT_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "P101",
        "title": "Boat Rockerz 450 Bluetooth Headphones",
        "description": "Wireless on-ear headphones with 15 hours battery backup and punchy bass.",
        "category": "headphones",
        "price": 1499,
        "rating": 4.3,
        "source": "Flipkart",
        "url": "https://www.flipkart.com",
        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300",
    },
    {
        "id": "P102",
        "title": "Sony WH-CH520 Wireless Headphones",
        "description": "Lightweight on-ear wireless headphones with up to 50 hours battery life.",
        "category": "headphones",
        "price": 3990,
        "rating": 4.6,
        "source": "Amazon",
        "url": "https://www.amazon.in",
        "image": "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300",
    },
    {
        "id": "P103",
        "title": "OnePlus Bullets Z2 Wireless in-Ear Earphones",
        "description": "Fast charging Bluetooth neckband earphones with 12.4mm bass drivers.",
        "category": "headphones",
        "price": 1999,
        "rating": 4.2,
        "source": "Amazon",
        "url": "https://www.amazon.in",
        "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300",
    },
    {
        "id": "P104",
        "title": "Noise ColorFit Pulse Grand Smart Watch",
        "description": "1.69 inch HD display, 60 sports modes, 150 watch faces.",
        "category": "smartwatch",
        "price": 1299,
        "rating": 4.1,
        "source": "Myntra",
        "url": "https://www.myntra.com",
        "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300",
    },
    {
        "id": "P105",
        "title": "Puma Men's Softride Running Shoes",
        "description": "Comfortable, lightweight running and training athletic sneakers.",
        "category": "shoes",
        "price": 2199,
        "rating": 4.4,
        "source": "Puma India",
        "url": "https://in.puma.com",
        "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300",
    },
    {
        "id": "P106",
        "title": "Asian Men's Jasper Running Shoes",
        "description": "Breathable mesh lightweight sports running shoes.",
        "category": "shoes",
        "price": 499,
        "rating": 4.0,
        "source": "Amazon",
        "url": "https://www.amazon.in",
        "image": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300",
    },
]

def search_products(
    query: str,
    category: Optional[str] = None,
    max_price: Optional[float] = None,
    preference: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Search products catalog and return normalized product schemas.
    """
    q = (query or "").lower().strip()
    results = []

    for item in PRODUCT_CATALOG:
        name_cat = f"{item['title'].lower()} {item.get('category', '').lower()} {item.get('description', '').lower()}"

        # Match query keywords
        if q:
            keywords = [k for k in q.split() if len(k) > 2 and k not in ["the", "for", "and", "with", "best", "good", "accha", "dikhao", "chahiye"]]
            if keywords and not any(k in name_cat for k in keywords):
                continue

        if category and item.get("category", "").lower() != category.lower():
            continue

        if max_price is not None and item.get("price", 0) > max_price:
            continue

        results.append(item)

    if preference:
        pref = preference.lower()
        if pref in ["cheapest", "lowest_price", "low_price", "budget"]:
            results.sort(key=lambda x: x.get("price", 0))
        elif pref in ["rating", "best_rated", "top_rated"]:
            results.sort(key=lambda x: x.get("rating", 0), reverse=True)

    # Normalize response format
    normalized = []
    for item in results:
        normalized.append({
            "type": "product",
            "title": item["title"],
            "description": item.get("description", ""),
            "price": item.get("price", 0),
            "currency": "INR",
            "source": f"Demo Catalog ({item.get('source', 'Store')})",
            "url": item.get("url", "#"),
            "image": item.get("image"),
            "metadata": {
                "id": item.get("id"),
                "rating": item.get("rating"),
                "category": item.get("category"),
                "is_demo": True,
            }
        })
    return normalized

def search_product(intent: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Specialist interface adapter for Product Search Agent.
    """
    query = intent.get("product") or intent.get("query") or ""
    category = intent.get("category")
    max_price = intent.get("budget")
    preference = intent.get("preference")
    return search_products(query=query, category=category, max_price=max_price, preference=preference)
