import json
from pathlib import Path
from typing import Optional


# Path to fallback travel data
DATA_PATH = (
    Path(__file__).resolve().parent.parent / "data" / "fallback_travel.json"
)


def load_fallback_data():
    """Load fallback travel data from JSON."""

    try:
        with open(DATA_PATH, "r", encoding="utf-8") as file:
            return json.load(file)

    except (FileNotFoundError, json.JSONDecodeError) as error:
        print(f"Error loading fallback travel data: {error}")
        return []

CITY_ALIASES = {
    "bangalore": "bengaluru",
    "blr": "bengaluru",
    "madras": "chennai",
    "maa": "chennai",
}


def normalize_city(city: str) -> str:
    city = city.lower().strip()
    return CITY_ALIASES.get(city, city)

def search_travel(
    origin: ,
    destination: str,
    travel_date: Optional[str] = None,
    time_preference: Optional[str] = None,
    max_price: Optional[float] = None,
    preference: Optional[str] = None,
):
    """
    Search travel options.

    Currently uses fallback data.
    A live travel API can be plugged in later.
    """

    data = load_fallback_data()

    origin = origin.lower().strip()
    destination = destination.lower().strip()

    origin = CITY_ALIASES.get(origin, origin)
    destination = CITY_ALIASES.get(destination, destination)

    results = []

    for option in data:

        if option["origin"].lower() != origin:
            continue

        if option["destination"].lower() != destination:
            continue

        # Filter by maximum price
        if max_price is not None:
            if option["price"] > max_price:
                continue

        # Filter by time preference
        if time_preference:
            departure_hour = int(option["departure"].split(":")[0])

            if time_preference.lower() == "morning":
                if not 5 <= departure_hour < 12:
                    continue

            elif time_preference.lower() == "afternoon":
                if not 12 <= departure_hour < 17:
                    continue

            elif time_preference.lower() == "evening":
                if not 17 <= departure_hour < 21:
                    continue

            elif time_preference.lower() == "night":
                if not (departure_hour >= 21 or departure_hour < 5):
                    continue

        results.append(option)

    # Sort according to user preference
    if preference:

        preference = preference.lower()

        if preference in ["cheapest", "lowest_price", "low_price"]:
            results.sort(key=lambda x: x["price"])

        elif preference in ["earliest", "early"]:
            results.sort(key=lambda x: x["departure"])

    return results

if __name__ == "__main__":

        results = search_travel(
            origin="Chennai",
            destination="Bengaluru",
            time_preference="morning",
            preference="cheapest"
        )

        for result in results:
            print(result)