import re
import os
import json
from typing import Dict, Any, Optional, Tuple

KNOWN_CITIES = [
    "Bengaluru", "Bangalore", "Chennai", "Mumbai", "Delhi", "New Delhi",
    "Hyderabad", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Coimbatore",
    "Madurai", "Salem", "Trichy", "Tiruchirappalli", "Kochi", "Cochin",
    "Mysore", "Mysuru", "Goa", "Chandigarh", "Lucknow", "Varanasi", "Patna"
]

def detect_language(text: str) -> str:
    """Detect natural Indic code-switched dialect or English."""
    lower = text.lower()
    tamil_markers = [
        "la irundhu", "lendhu", "lerundhu", " ku ", "naalaiku", "naalai", "innaiku",
        "kaalai", "maalai", "raathri", "paathu", "sollu", "venum", "kulla", "kammi-a",
        "cheap-a", "fast-a", "iruku", "epdi"
    ]
    hindi_markers = [
        " se ", " tak ", "kal ", " aaj", "subah", "shaam", "raat", "sasta", "sasti",
        "chahiye", "dikhao", "ke andar", "karo", "kya", "accha", "batao", "mujhe", "mera"
    ]

    if any(m in lower for m in tamil_markers):
        return "ta-en"
    if any(m in lower for m in hindi_markers):
        return "hi-en"
    return "en"

def extract_budget(text: str) -> Optional[float]:
    """Extract budget amount from phrases like 'under 2000', '5000 ke andar', '2000 kulla', 'rs 500'."""
    lower = text.lower()
    patterns = [
        r'(?:under|below|within|budget|less\s+than|upto|up\s+to|max)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)?(?:\.\d+)?)',
        r'(?:rs\.?|inr|₹)\s*(\d+(?:,\d+)?(?:\.\d+)?)',
        r'(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:ke\s+andar|kulla|kulle|rupees|rs|inr|₹)',
    ]
    for pattern in patterns:
        m = re.search(pattern, lower)
        if m:
            val_str = m.group(1).replace(",", "")
            try:
                return float(val_str)
            except ValueError:
                pass
    return None

def extract_cities(text: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract origin and destination with multilingual Indic pattern support."""
    NON_CITIES = {
        "train", "trains", "bus", "buses", "flight", "flights", "plane", "ticket",
        "tickets", "chahiye", "venum", "options", "cheap", "sasta", "travel", "fastest",
        "cheapest", "quick", "show", "me", "find", "between"
    }

    # Pattern 1: Tamil "Chennai la irundhu Bangalore ku"
    m_ta = re.search(r'\b([a-zA-Z]+)\s+(?:la\s+irundhu|lerundhu|lendhu)\s+([a-zA-Z]+)\s+ku\b', text, re.IGNORECASE)
    if m_ta:
        c1, c2 = m_ta.group(1).capitalize(), m_ta.group(2).capitalize()
        orig = None if c1.lower() in NON_CITIES else c1
        dest = None if c2.lower() in NON_CITIES else c2
        if orig and dest:
            return orig, dest

    # Pattern 2: Hindi "Delhi se Mumbai"
    m_hi = re.search(r'\b([a-zA-Z]+)\s+se\s+([a-zA-Z]+)(?:\s+tak|\s+ke\s+liye)?\b', text, re.IGNORECASE)
    if m_hi:
        c1, c2 = m_hi.group(1).capitalize(), m_hi.group(2).capitalize()
        orig = None if c1.lower() in NON_CITIES else c1
        dest = None if c2.lower() in NON_CITIES else c2
        if orig and dest:
            return orig, dest

    # Pattern 3: English "between Chennai and Bangalore/Bengaluru"
    m_between = re.search(r'\bbetween\s+([a-zA-Z]+)\s+and\s+([a-zA-Z]+)\b', text, re.IGNORECASE)
    if m_between:
        c1, c2 = m_between.group(1).capitalize(), m_between.group(2).capitalize()
        orig = None if c1.lower() in NON_CITIES else c1
        dest = None if c2.lower() in NON_CITIES else c2
        if orig and dest:
            return orig, dest

    # Pattern 4: Inverted "to Bengaluru from Chennai"
    m_inverted = re.search(r'\bto\s+([a-zA-Z]+)\s+from\s+([a-zA-Z]+)\b', text, re.IGNORECASE)
    if m_inverted:
        dest = m_inverted.group(1).capitalize()
        orig = m_inverted.group(2).capitalize()
        c_orig = None if orig.lower() in NON_CITIES else orig
        c_dest = None if dest.lower() in NON_CITIES else dest
        if c_orig and c_dest:
            return c_orig, c_dest

    # Pattern 5: English "from Chennai to Bangalore"
    m_en = re.search(r'\bfrom\s+([a-zA-Z]+)\s+to\s+([a-zA-Z]+)\b', text, re.IGNORECASE)
    if m_en:
        c1, c2 = m_en.group(1).capitalize(), m_en.group(2).capitalize()
        orig = None if c1.lower() in NON_CITIES else c1
        dest = None if c2.lower() in NON_CITIES else c2
        if orig and dest:
            return orig, dest

    # Pattern 6: "Chennai to Bangalore" (ensure first word is not a non-city keyword)
    m_to = re.search(r'\b([a-zA-Z]+)\s+to\s+([a-zA-Z]+)\b', text, re.IGNORECASE)
    if m_to:
        first_word = m_to.group(1).lower()
        second_word = m_to.group(2).lower()
        if first_word not in NON_CITIES and second_word not in NON_CITIES:
            c1 = next((c for c in KNOWN_CITIES if c.lower() == first_word), m_to.group(1).capitalize())
            c2 = next((c for c in KNOWN_CITIES if c.lower() == second_word), m_to.group(2).capitalize())
            return c1, c2

    # Pattern 7: Look for known cities and prepositions
    found = []
    for c in KNOWN_CITIES:
        match = re.search(rf'\b{c}\b', text, re.IGNORECASE)
        if match:
            if not any(fc[0].lower() == c.lower() for fc in found):
                found.append((c, match.start()))
    found.sort(key=lambda x: x[1])

    if len(found) >= 2:
        lower = text.lower()
        city1 = found[0][0]
        city2 = found[1][0]
        c1_lower = city1.lower()
        c2_lower = city2.lower()

        # Check if inverted: e.g. "to Bengaluru ... from Chennai"
        has_to1 = bool(re.search(rf'\b(?:to|ku)\s+{c1_lower}\b', lower)) or f"{c1_lower} ku" in lower
        has_from2 = bool(re.search(rf'\b(?:from|se)\s+{c2_lower}\b', lower)) or f"{c2_lower} la irundhu" in lower or f"{c2_lower} se" in lower
        if has_to1 and has_from2:
            return city2, city1

        has_from1 = bool(re.search(rf'\b(?:from|se)\s+{c1_lower}\b', lower)) or f"{c1_lower} la irundhu" in lower or f"{c1_lower} se" in lower
        has_to2 = bool(re.search(rf'\b(?:to|ku)\s+{c2_lower}\b', lower)) or f"{c2_lower} ku" in lower
        if has_from1 and has_to2:
            return city1, city2

        return city1, city2
    elif len(found) == 1:
        lower = text.lower()
        c_name = found[0][0].lower()
        if bool(re.search(rf'\b(?:to|ku)\s+{c_name}\b', lower)) or f"{c_name} ku" in lower:
            return None, found[0][0]
        if bool(re.search(rf'\b(?:from|se)\s+{c_name}\b', lower)) or f"{c_name} la irundhu" in lower or f"{c_name} se" in lower:
            return found[0][0], None
        return found[0][0], None

    return None, None

def extract_date_and_time(text: str) -> Tuple[Optional[str], Optional[str]]:
    lower = text.lower()
    date = None
    time = None

    if any(k in lower for k in ["tomorrow", "naalaiku", "naalai", "kal"]):
        date = "tomorrow"
    elif any(k in lower for k in ["today", "innaiku", "indru", "aaj"]):
        date = "today"

    if any(k in lower for k in ["morning", "kaalai", "subah"]):
        time = "morning"
    elif any(k in lower for k in ["afternoon", "madhiyam", "dopahar"]):
        time = "afternoon"
    elif any(k in lower for k in ["evening", "maalai", "shaam"]):
        time = "evening"
    elif any(k in lower for k in ["night", "raathri", "raat"]):
        time = "night"

    return date, time

def extract_departure_and_arrival_times(text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    lower = text.lower()
    requested_departure_time = None
    requested_arrival_time = None
    time_slot = None

    if any(k in lower for k in ["morning", "kaalai", "subah"]):
        time_slot = "morning"
    elif any(k in lower for k in ["afternoon", "madhiyam", "dopahar"]):
        time_slot = "afternoon"
    elif any(k in lower for k in ["evening", "maalai", "shaam"]):
        time_slot = "evening"
    elif any(k in lower for k in ["night", "raathri", "raat"]):
        time_slot = "night"

    # 1. Arrival time patterns
    arr_match1 = re.search(r"(?:reach(?:ing)?|arriv(?:e|ing|al)|pahunch(?:na|e|te)?)\s+(?:(?:to|in|at)\s+[a-z\s]+\s+)?(?:by|before|around|at|till|tak)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?", lower)
    if arr_match1:
        h = int(arr_match1.group(1))
        m = int(arr_match1.group(2)) if arr_match1.group(2) else 0
        ampm = arr_match1.group(3)
        if ampm == "pm" and h < 12:
            h += 12
        if ampm == "am" and h == 12:
            h = 0
        requested_arrival_time = f"{h:02d}:{m:02d}"
    else:
        arr_match2 = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:kulla|varaikkum|kulle|baje tak|tak)?\s*(?:reach|poganum|pahunch)", lower)
        if arr_match2:
            h = int(arr_match2.group(1))
            m = int(arr_match2.group(2)) if arr_match2.group(2) else 0
            ampm = arr_match2.group(3)
            if ampm == "pm" and h < 12:
                h += 12
            if ampm == "am" and h == 12:
                h = 0
            requested_arrival_time = f"{h:02d}:{m:02d}"

    # 2. Departure time patterns
    dep_match1 = re.search(r"(?:depart(?:ing|ure)?|leaves?|start(?:ing)?)\s+(?:at|around|after|by)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?", lower)
    if dep_match1:
        h = int(dep_match1.group(1))
        m = int(dep_match1.group(2)) if dep_match1.group(2) else 0
        ampm = dep_match1.group(3)
        if ampm == "pm" and h < 12:
            h += 12
        if ampm == "am" and h == 12:
            h = 0
        requested_departure_time = f"{h:02d}:{m:02d}"
    else:
        dep_match2 = re.search(r"(?:around|at|subah|kaalai)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje|manikku)?", lower)
        if dep_match2 and not requested_arrival_time:
            h = int(dep_match2.group(1))
            m = int(dep_match2.group(2)) if dep_match2.group(2) else 0
            modifier = dep_match2.group(3)
            if modifier == "pm" and h < 12:
                h += 12
            if modifier == "am" and h == 12:
                h = 0
            if any(w in lower for w in ["subah", "kaalai"]) and h <= 12:
                if h == 12:
                    h = 0
            if any(w in lower for w in ["shaam", "maalai"]) and h < 12:
                h += 12
            requested_departure_time = f"{h:02d}:{m:02d}"

    if not time_slot and requested_departure_time:
        dep_hour = int(requested_departure_time.split(":")[0])
        if 5 <= dep_hour < 12:
            time_slot = "morning"
        elif 12 <= dep_hour < 17:
            time_slot = "afternoon"
        elif 17 <= dep_hour < 21:
            time_slot = "evening"
        else:
            time_slot = "night"

    return requested_departure_time, requested_arrival_time, time_slot

def extract_transport_type(text: str) -> Optional[str]:
    lower = text.lower()
    # 1. Bus markers (including bus operators)
    if bool(re.search(r'\b(bus|buses|ksrtc|setc|volvo|redbus|sleeper\s*bus)\b', lower)):
        return "bus"
    # 2. Flight markers
    if bool(re.search(r'\b(flight|flights|plane|airplane|indigo|air\s*india)\b', lower)):
        return "flight"
    # 3. Train markers
    if bool(re.search(r'\b(train|trains|rail|railway|shatabdi|vande\s*bharat|irctc|intercity)\b', lower)):
        return "train"
    # 4. Express keyword as train (only if no bus was mentioned)
    if bool(re.search(r'\bexpress\b', lower)):
        return "train"
    return None

def extract_preference(text: str) -> Optional[str]:
    lower = text.lower()
    if any(w in lower for w in ["cheap", "cheapest", "kammi-a", "sasta", "sasti", "low price", "lowest price", "budget"]):
        return "cheapest"
    if any(w in lower for w in ["fast", "fastest", "quick", "fast-a", "shortest", "shortest duration", "minimum duration"]):
        return "fastest"
    if any(w in lower for w in ["earliest", "early", "jaldi"]):
        return "earliest"
    if any(w in lower for w in ["best", "top rated", "accha", "rating", "top-rated"]):
        return "rating"
    if any(w in lower for w in ["wireless", "bluetooth", "cordless"]):
        return "wireless"
    return None

def extract_intent(text: str) -> Dict[str, Any]:
    """
    Unified intent and entity extraction for travel, product, web, and general chat.
    Supports English, Tamil-English (ta-en), Hindi-English (hi-en).
    """
    clean_text = text.strip()
    lower = clean_text.lower()
    language = detect_language(clean_text)

    # Check for general greetings
    if lower in ["hi", "hello", "hey", "vanakkam", "namaste", "good morning", "good evening", "how are you"]:
        return {
            "intent": "general_chat",
            "message": clean_text,
            "language": language,
        }

    # 1. Travel Search Detection
    origin, destination = extract_cities(clean_text)
    transport = extract_transport_type(clean_text)
    date, raw_time_pref = extract_date_and_time(clean_text)
    req_dep, req_arr, time_slot = extract_departure_and_arrival_times(clean_text)
    time_pref = raw_time_pref or time_slot
    budget = extract_budget(clean_text)
    pref = extract_preference(clean_text)

    is_travel_keywords = any(w in lower for w in [
        "train", "trains", "flight", "flights", "bus", "buses",
        "ticket", "tickets", "travel", "journey", "trip",
        "la irundhu", "lendhu", "lerundhu", " se ", "naalaiku", "kal subah"
    ])

    if (origin and destination) or (origin and is_travel_keywords) or (destination and is_travel_keywords) or (transport and (origin or destination or is_travel_keywords)):
        return {
            "intent": "travel_search",
            "origin": origin,
            "destination": destination,
            "date": date,
            "time": time_pref,
            "preference": pref,
            "transport_type": transport or "train",
            "budget": budget,
            "language": language,
            "requested_departure_time": req_dep,
            "requested_arrival_time": req_arr,
        }

    # 2. Product Search Detection
    product_keywords = ["buy", "purchase", "headphones", "headphone", "earbuds", "earphones",
                        "shoes", "smartwatch", "watch", "mobile", "phone", "laptop", "sneakers"]
    is_product_intent = (
        any(k in lower for k in product_keywords) or
        ("chahiye" in lower and any(w in lower for w in ["ek", "accha", "under", "ke andar"])) or
        ("dikhao" in lower and budget is not None) or
        ("under" in lower and any(p in lower for p in ["shoes", "watch", "phone", "headphones"]))
    )

    if is_product_intent:
        # identify specific product item
        product_name = clean_text
        for kw in ["headphones", "headphone", "earbuds", "running shoes", "shoes", "smart watch", "watch", "phone", "laptop"]:
            if kw in lower:
                product_name = kw
                break

        return {
            "intent": "product_search",
            "product": product_name,
            "category": "electronics" if any(e in lower for e in ["headphones", "watch", "phone", "laptop", "earbuds"]) else "fashion",
            "budget": budget,
            "preference": pref,
            "language": language,
        }

    # 3. Web Search Detection
    web_keywords = ["search", "latest", "news", "what happened", "who is", "isro", "weather",
                    "today", "information", "tell me about", "update", "updates", "karo"]
    is_web = any(k in lower for k in web_keywords) or clean_text.endswith("?")

    if is_web:
        clean_q = re.sub(r'\b(search karo|search|batao|tell me)\b', '', clean_text, flags=re.IGNORECASE).strip()
        return {
            "intent": "web_search",
            "query": clean_q or clean_text,
            "language": language,
        }

    # 4. General fallback
    return {
        "intent": "general_chat",
        "message": clean_text,
        "language": language,
    }
