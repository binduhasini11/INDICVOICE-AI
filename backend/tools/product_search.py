from typing import Optional


# Demo product dataset
PRODUCTS = [
    {
        "id": "P001",
        "name": "Wireless Bluetooth Earbuds",
        "category": "electronics",
        "price": 1299,
        "rating": 4.4,
        "source": "Demo Product Data"
    },
    {
        "id": "P002",
        "name": "Noise Cancelling Headphones",
        "category": "electronics",
        "price": 2499,
        "rating": 4.6,
        "source": "Demo Product Data"
    },
    {
        "id": "P003",
        "name": "Smart Watch",
        "category": "electronics",
        "price": 1999,
        "rating": 4.3,
        "source": "Demo Product Data"
    },
    {
        "id": "P004",
        "name": "USB-C Fast Charger",
        "category": "electronics",
        "price": 799,
        "rating": 4.5,
        "source": "Demo Product Data"
    },
    {
        "id": "P005",
        "name": "Portable Power Bank",
        "category": "electronics",
        "price": 999,
        "rating": 4.2,
        "source": "Demo Product Data"
    }
]


def search_products(
    query: str,
    category: Optional[str] = None,
    max_price: Optional[float] = None,
    preference: Optional[str] = None,
):
    """
    Search products based on a natural-language query.

    Currently uses demo product data.
    A live e-commerce/search API can be connected later.
    """

    query = query.lower().strip()

    results = []

    for product in PRODUCTS:

        # Match query against product name/category
        searchable_text = (
            product["name"].lower()
            + " "
            + product["category"].lower()
        )

        if query not in searchable_text:
            continue

        # Category filter
        if category:
            if product["category"].lower() != category.lower():
                continue

        # Maximum price filter
        if max_price is not None:
            if product["price"] > max_price:
                continue

        results.append(product)

    # Ranking
    if preference:

        preference = preference.lower()

        if preference in ["cheapest", "lowest_price", "low_price"]:
            results.sort(key=lambda x: x["price"])

        elif preference in ["best_rated", "highest_rating", "rating"]:
            results.sort(key=lambda x: x["rating"], reverse=True)

    return results


if __name__ == "__main__":

    results = search_products(
        query="earbuds",
        preference="cheapest"
    )

    for result in results:
        print(result)