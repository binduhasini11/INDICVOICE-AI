import re
from typing import Optional

from pydantic import BaseModel


# ============================================================
# INTENT RESULT
# ============================================================

class IntentResult(BaseModel):
    intent: str

    # Travel fields
    origin: Optional[str] = None
    destination: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    preference: Optional[str] = None
    transport_type: Optional[str] = None
    budget: Optional[float] = None

    # Product fields
    product: Optional[str] = None

    # Web search fields
    query: Optional[str] = None

    # Language
    language: Optional[str] = None


# ============================================================
# SUPPORTED CITIES
# ============================================================

CITIES = [
    "Chennai",
    "Bangalore",
    "Bengaluru",
    "Mumbai",
    "Delhi",
    "Hyderabad",
    "Kolkata",
    "Pune",
    "Coimbatore",
    "Madurai",
    "Salem",
    "Trichy",
    "Tiruchirappalli",
    "Kochi",
    "Mysore",
    "Mysuru",
    "Ahmedabad",
    "Jaipur",
]


# ============================================================
# CITY DETECTION
# ============================================================

def find_city(text: str, city: str):
    """
    Find a city name inside the user's message.
    """

    pattern = r"\b" + re.escape(city) + r"\b"

    match = re.search(
        pattern,
        text,
        re.IGNORECASE
    )

    if match:
        return match.group()

    return None


def extract_origin_destination(text: str):
    """
    Extract origin and destination from different
    ways users may express travel.

    Examples:
        Chennai to Bangalore
        from Chennai to Bangalore
        Chennai la irundhu Bangalore ku
        Chennai se Bangalore
    """

    origin = None
    destination = None

    # --------------------------------------------------------
    # Pattern 1:
    # "from Chennai to Bangalore"
    # --------------------------------------------------------

    match = re.search(
        r"\bfrom\s+([A-Za-z]+)\s+to\s+([A-Za-z]+)",
        text,
        re.IGNORECASE
    )

    if match:
        origin = match.group(1)
        destination = match.group(2)

        return origin, destination

    # --------------------------------------------------------
    # Pattern 2:
    # "Chennai to Bangalore"
    # --------------------------------------------------------

    match = re.search(
        r"\b([A-Za-z]+)\s+to\s+([A-Za-z]+)",
        text,
        re.IGNORECASE
    )

    if match:
        first = match.group(1)
        second = match.group(2)

        # Make sure they are known cities
        first_city = find_city(text, first)
        second_city = find_city(text, second)

        if first_city and second_city:
            origin = first_city
            destination = second_city

            return origin, destination

    # --------------------------------------------------------
    # Pattern 3:
    # Tamil-English:
    # "Chennai la irundhu Bangalore ku"
    # --------------------------------------------------------

    match = re.search(
        r"\b([A-Za-z]+)\s+la\s+irundhu\s+([A-Za-z]+)\s+ku\b",
        text,
        re.IGNORECASE
    )

    if match:
        origin = match.group(1)
        destination = match.group(2)

        return origin, destination

    # --------------------------------------------------------
    # Pattern 4:
    # Hindi-English:
    # "Chennai se Bangalore"
    # --------------------------------------------------------

    match = re.search(
        r"\b([A-Za-z]+)\s+se\s+([A-Za-z]+)",
        text,
        re.IGNORECASE
    )

    if match:
        origin = match.group(1)
        destination = match.group(2)

        return origin, destination

    # --------------------------------------------------------
    # Pattern 5:
    # Find two known cities anywhere in the sentence
    # --------------------------------------------------------

    found_cities = []

    for city in CITIES:

        found = find_city(text, city)

        if found:
            found_cities.append(found)

    # Remove duplicates while preserving order
    unique_cities = []

    for city in found_cities:

        if city.lower() not in [
            c.lower() for c in unique_cities
        ]:
            unique_cities.append(city)

    if len(unique_cities) >= 2:

        origin = unique_cities[0]
        destination = unique_cities[1]

    return origin, destination


# ============================================================
# DATE EXTRACTION
# ============================================================

def extract_date(text: str):
    """
    Extract relative travel dates.

    Examples:
        today
        tomorrow
        naalai
        naalaiku
        aaj
        kal
    """

    text_lower = text.lower()

    # Tomorrow
    if (
        "tomorrow" in text_lower
        or "naalaiku" in text_lower
        or "naalai" in text_lower
        or "kal" in text_lower
    ):
        return "tomorrow"

    # Today
    if (
        "today" in text_lower
        or "innaiku" in text_lower
        or "aaj" in text_lower
    ):
        return "today"

    return None


# ============================================================
# TIME EXTRACTION
# ============================================================

def extract_time(text: str):
    """
    Extract travel time preference.

    Returns:
        morning
        afternoon
        evening
        night
    """

    text_lower = text.lower()

    # Morning
    if (
        "morning" in text_lower
        or "morning-a" in text_lower
        or "morning la" in text_lower
        or "subah" in text_lower
        or "kaalai" in text_lower
    ):
        return "morning"

    # Afternoon
    if (
        "afternoon" in text_lower
        or "afternoon-a" in text_lower
        or "afternoon la" in text_lower
    ):
        return "afternoon"

    # Evening
    if (
        "evening" in text_lower
        or "evening-a" in text_lower
        or "maalai" in text_lower
        or "shaam" in text_lower
    ):
        return "evening"

    # Night
    if (
        "night" in text_lower
        or "raathri" in text_lower
        or "raat" in text_lower
    ):
        return "night"

    return None


# ============================================================
# PREFERENCE EXTRACTION
# ============================================================

def extract_preference(text: str):
    """
    Extract ranking preference.

    cheapest:
        cheap
        cheapest
        cheap-a
        low price
        budget

    fastest:
        fast
        fastest
        quick
        earliest
        jaldi
    """

    text_lower = text.lower()

    # --------------------------------------------------------
    # Cheapest
    # --------------------------------------------------------

    cheap_words = [
        "cheap",
        "cheapest",
        "cheap-a",
        "low price",
        "lowest price",
        "kam price",
        "sasti",
        "sasta",
        "budget",
        "affordable",
    ]

    for word in cheap_words:

        if word in text_lower:
            return "cheapest"

    # --------------------------------------------------------
    # Fastest
    # --------------------------------------------------------

    fast_words = [
        "fast",
        "fastest",
        "quick",
        "quickest",
        "earliest",
        "jaldi",
    ]

    for word in fast_words:

        if word in text_lower:
            return "fastest"

    return None


# ============================================================
# TRANSPORT TYPE EXTRACTION
# ============================================================

def extract_transport_type(text: str):
    """
    Identify the preferred transport type.

    Returns:
        train
        bus
        flight
        None
    """

    text_lower = text.lower()

    # Train
    train_words = [
        "train",
        "trains",
        "rail",
        "railway",
        "railway train",
    ]

    for word in train_words:

        if word in text_lower:
            return "train"

    # Bus
    bus_words = [
        "bus",
        "buses",
    ]

    for word in bus_words:

        if word in text_lower:
            return "bus"

    # Flight
    flight_words = [
        "flight",
        "flights",
        "plane",
        "airplane",
        "airways",
    ]

    for word in flight_words:

        if word in text_lower:
            return "flight"

    return None


# ============================================================
# BUDGET EXTRACTION
# ============================================================

def extract_budget(text: str):
    """
    Extract maximum budget.

    Examples:
        under 500
        below 500
        budget 500
        under ₹500
        below Rs 500
        ₹500
    """

    patterns = [

        r"(?:under|below|within|budget)\s*"
        r"(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)",

        r"(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)",

    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            return float(
                match.group(1)
            )

    return None


# ============================================================
# LANGUAGE DETECTION
# ============================================================

def detect_language(text: str):
    """
    Simple detection for:
        English
        Tamil-English
        Hindi-English
    """

    text_lower = text.lower()

    tamil_words = [
        "la",
        "irundhu",
        "ku",
        "naalaiku",
        "naalai",
        "paathu",
        "sollu",
        "venum",
        "enna",
        "cheap-a",
        "morning-a",
        "kaalai",
        "maalai",
    ]

    hindi_words = [
        "se",
        "kal",
        "aaj",
        "mujhe",
        "chahiye",
        "sasti",
        "sasta",
        "batao",
        "subah",
        "shaam",
        "jaldi",
    ]

    tamil_count = sum(
        word in text_lower
        for word in tamil_words
    )

    hindi_count = sum(
        word in text_lower
        for word in hindi_words
    )

    if tamil_count > hindi_count and tamil_count > 0:
        return "ta-en"

    if hindi_count > tamil_count and hindi_count > 0:
        return "hi-en"

    return "en"


# ============================================================
# MAIN INTENT EXTRACTION
# ============================================================

def extract_intent(user_text: str) -> IntentResult:

    text = user_text.strip()

    text_lower = text.lower()

    language = detect_language(text)

    # ========================================================
    # FIRST: TRY TO DETECT TRAVEL ROUTE
    # ========================================================

    origin, destination = extract_origin_destination(text)

    # If two cities are found, strongly consider this travel
    is_route = (
        origin is not None
        and destination is not None
    )

    # ========================================================
    # TRAVEL KEYWORDS
    # ========================================================

    travel_words = [
        "train",
        "trains",
        "bus",
        "buses",
        "flight",
        "flights",
        "plane",
        "travel",
        "ticket",
        "tickets",
        "journey",
        "travelling",
        "traveling",

        "from",
        "to",

        "irundhu",
        "la irundhu",
        "ku",

        "se",

        "tomorrow",
        "today",
        "naalaiku",
        "naalai",
        "innaiku",
        "aaj",
        "kal",

        "morning",
        "morning-a",
        "afternoon",
        "evening",
        "evening-a",
        "night",

        "subah",
        "kaalai",
        "maalai",
        "shaam",
        "raathri",
        "raat",

        "cheap",
        "cheapest",
        "cheap-a",
        "low price",
        "lowest price",

        "sasti",
        "sasta",
        "kam price",

        "fast",
        "fastest",
        "quick",
        "quickest",
        "earliest",
        "jaldi",
    ]

    is_travel_keyword = any(
        word in text_lower
        for word in travel_words
    )

    # Route detection gets priority
    if is_route or is_travel_keyword:

        return IntentResult(
            intent="travel_search",

            origin=origin,
            destination=destination,

            date=extract_date(text),
            time=extract_time(text),

            preference=extract_preference(text),

            transport_type=extract_transport_type(text),

            budget=extract_budget(text),

            language=language,
        )

    # ========================================================
    # PRODUCT SEARCH
    # ========================================================

    product_words = [
        "buy",
        "purchase",
        "product",
        "laptop",
        "phone",
        "mobile",
        "headphones",
        "shoes",
        "watch",
        "camera",
        "looking for",
        "tablet",
        "earbuds",
        "computer",
    ]

    is_product = any(
        word in text_lower
        for word in product_words
    )

    if is_product:

        return IntentResult(
            intent="product_search",

            product=text,

            budget=extract_budget(text),

            preference=extract_preference(text),

            language=language,
        )

    # ========================================================
    # WEB SEARCH
    # ========================================================

    web_words = [
        "search",
        "google",
        "latest",
        "news",
        "current",
        "information",
        "find",
        "what is",
        "who is",
    ]

    is_web = any(
        word in text_lower
        for word in web_words
    )

    if is_web:

        return IntentResult(
            intent="web_search",

            query=text,

            language=language,
        )

    # ========================================================
    # GENERAL CHAT
    # ========================================================

    general_words = [
        "hello",
        "hi",
        "hey",
        "thanks",
        "thank you",
        "good morning",
        "good evening",
        "how are you",
    ]

    is_general = any(
        word in text_lower
        for word in general_words
    )

    if is_general:

        return IntentResult(
            intent="general_chat",

            language=language,
        )

    # ========================================================
    # UNKNOWN
    # ========================================================

    return IntentResult(
        intent="unknown",

        language=language,
    )