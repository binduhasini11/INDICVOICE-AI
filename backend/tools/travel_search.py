import json
from pathlib import Path
from typing import List, Dict, Any, Optional

FALLBACK_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "fallback_travel.json"

CITY_ALIASES = {
    "bangalore": "bengaluru",
    "blr": "bengaluru",
    "madras": "chennai",
    "maa": "chennai",
    "bombay": "mumbai",
    "bom": "mumbai",
    "calcutta": "kolkata",
    "ccu": "kolkata",
}

def normalize_city(city: Optional[str]) -> str:
    if not city:
        return ""
    clean = city.strip().lower()
    return CITY_ALIASES.get(clean, clean)

def load_travel_data() -> List[Dict[str, Any]]:
    if not FALLBACK_DATA_PATH.exists():
        return []
    try:
        with open(FALLBACK_DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Warning: could not load travel data: {e}")
        return []

def search_travel(
    origin: str,
    destination: str,
    travel_date: Optional[str] = None,
    time_preference: Optional[str] = None,
    max_price: Optional[float] = None,
    preference: Optional[str] = None,
    transport_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Search travel options and return normalized travel results.
    """
    data = load_travel_data()
    norm_origin = normalize_city(origin)
    norm_destination = normalize_city(destination)

    filtered: List[Dict[str, Any]] = []

    for item in data:
        item_origin = normalize_city(item.get("origin", ""))
        item_destination = normalize_city(item.get("destination", ""))

        if item_origin != norm_origin or item_destination != norm_destination:
            continue

        if transport_type:
            item_transport = (item.get("type") or "").lower()
            if item_transport != transport_type.lower():
                continue

        if max_price is not None:
            price = item.get("price", 0)
            if price > max_price:
                continue

        if time_preference:
            dep = item.get("departure", "")
            if dep and ":" in dep:
                try:
                    dep_hour = int(dep.split(":")[0])
                    tp = time_preference.lower()
                    if tp == "morning" and not (5 <= dep_hour < 12):
                        continue
                    elif tp == "afternoon" and not (12 <= dep_hour < 17):
                        continue
                    elif tp == "evening" and not (17 <= dep_hour < 21):
                        continue
                    elif tp == "night" and not (dep_hour >= 21 or dep_hour < 5):
                        continue
                except ValueError:
                    pass

        filtered.append(item)

    # Apply ranking preference
    if preference:
        pref = preference.lower()
        if pref in ["cheapest", "lowest_price", "low_price", "budget"]:
            filtered.sort(key=lambda x: x.get("price", 0))
        elif pref in ["earliest", "early"]:
            filtered.sort(key=lambda x: x.get("departure", "99:99"))
        elif pref in ["fastest", "quick"]:
            filtered.sort(key=lambda x: x.get("departure", "99:99"))

    # Return normalized result format
    normalized_results = []
    for item in filtered:
        trans_type = item.get("type", "train")
        orig = item.get("origin", origin)
        dest = item.get("destination", destination)
        dep = item.get("departure", "")
        arr = item.get("arrival", "")
        name = item.get("name", f"{trans_type.capitalize()} Option")
        price = item.get("price", 0)

        normalized_results.append({
            "type": "travel",
            "title": name,
            "description": f"{trans_type.capitalize()} from {orig} to {dest} ({dep} - {arr})",
            "price": price,
            "currency": item.get("currency", "INR"),
            "source": "Demo Travel Data (IRCTC Dataset)",
            "url": item.get("url", "https://www.irctc.co.in"),
            "image": None,
            "metadata": {
                "id": item.get("id"),
                "transport": trans_type,
                "origin": orig,
                "destination": dest,
                "departure": dep,
                "arrival": arr,
                "date": travel_date or "tomorrow",
                "is_demo": True,
            }
        })

    return normalized_results
