from typing import List, Dict, Optional


def rank_results(
    results: List[Dict],
    preference: Optional[str] = None
) -> List[Dict]:
    """
    Rank search results according to user preference.
    """

    if not results:
        return []

    if not preference:
        return results

    preference = preference.lower().strip()

    # Cheapest / lowest price
    if preference in [
        "cheapest",
        "lowest_price",
        "low_price",
        "budget"
    ]:
        results.sort(
            key=lambda x: x.get("price", float("inf"))
        )

    # Highest rated
    elif preference in [
        "best_rated",
        "highest_rating",
        "rating"
    ]:
        results.sort(
            key=lambda x: x.get("rating", 0),
            reverse=True
        )

    # Earliest departure
    elif preference in [
        "earliest",
        "early"
    ]:
        results.sort(
            key=lambda x: x.get("departure", "23:59")
        )

    return results


if __name__ == "__main__":

    demo_results = [
        {
            "name": "Train A",
            "price": 600,
            "departure": "08:00"
        },
        {
            "name": "Train B",
            "price": 350,
            "departure": "06:30"
        },
        {
            "name": "Train C",
            "price": 450,
            "departure": "07:00"
        }
    ]

    ranked = rank_results(
        demo_results,
        preference="cheapest"
    )

    for result in ranked:
        print(result)