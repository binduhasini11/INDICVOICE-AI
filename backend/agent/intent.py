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
    NON_CITIES = {"train", "trains", "bus", "buses", "flight", "flights", "plane", "ticket", "tickets", "chahiye", "venum", "options", "cheap", "sasta", "travel"}

    # Pattern 1: Tamil "Chennai la irundhu Bangalore ku"
    m_ta = re.search(r'\b([a-zA-Z]+)\s+(?:la\s+irundhu|lerundhu|lendhu)\s+([a-zA-Z]+)\s+ku\b', text, re.IGNORECASE)
    if m_ta:
        c1, c2 = m_ta.group(1).capitalize(), m_ta.group(2).capitalize()
        return (None if c1.lower() in NON_CITIES else c1), (None if c2.lower() in NON_CITIES else c2)

    # Pattern 2: Hindi "Delhi se Mumbai"
    m_hi = re.search(r'\b([a-zA-Z]+)\s+se\s+([a-zA-Z]+)(?:\s+tak|\s+ke\s+liye)?\b', text, re.IGNORECASE)
    if m_hi:
        c1, c2 = m_hi.group(1).capitalize(), m_hi.group(2).capitalize()
        return (None if c1.lower() in NON_CITIES else c1), (None if c2.lower() in NON_CITIES else c2)

    # Pattern 3: English "from Chennai to Bangalore"
    m_en = re.search(r'\bfrom\s+([a-zA-Z]+)\s+to\s+([a-zA-Z]+)\b', text, re.IGNORECASE)
    if m_en:
        c1, c2 = m_en.group(1).capitalize(), m_en.group(2).capitalize()
        return (None if c1.lower() in NON_CITIES else c1), (None if c2.lower() in NON_CITIES else c2)

    # Pattern 4: "Chennai to Bangalore"
    m_to = re.search(r'\b([a-zA-Z]+)\s+to\s+([a-zA-Z]+)\b', text, re.IGNORECASE)
    if m_to:
        c1 = next((c for c in KNOWN_CITIES if c.lower() == m_to.group(1).lower()), m_to.group(1).capitalize())
        c2 = next((c for c in KNOWN_CITIES if c.lower() == m_to.group(2).lower()), m_to.group(2).capitalize())
        return (None if c1.lower() in NON_CITIES else c1), (None if c2.lower() in NON_CITIES else c2)

    # Pattern 5: Look for two known cities
    found = []
    for c in KNOWN_CITIES:
        if re.search(rf'\b{c}\b', text, re.IGNORECASE):
            # preserve appearance order
            pos = text.lower().find(c.lower())
            if not any(fc[0].lower() == c.lower() for fc in found):
                found.append((c, pos))
    found.sort(key=lambda x: x[1])
    if len(found) >= 2:
        return found[0][0], found[1][0]
    elif len(found) == 1:
        # Check if origin or destination
        lower = text.lower()
        if "to " + found[0][0].lower() in lower or found[0][0].lower() + " ku" in lower:
            return None, found[0][0]
        if "from " + found[0][0].lower() in lower or found[0][0].lower() + " la irundhu" in lower or found[0][0].lower() + " se" in lower:
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

def extract_transport_type(text: str) -> Optional[str]:
    lower = text.lower()
    if any(w in lower for w in ["train", "rail", "railway", "trains", "shatabdi", "vande bharat", "express"]):
        return "train"
    if any(w in lower for w in ["bus", "buses", "ksrtc", "setc"]):
        return "bus"
    if any(w in lower for w in ["flight", "flights", "plane", "airplane", "air"]):
        return "flight"
    return None

def extract_preference(text: str) -> Optional[str]:
    lower = text.lower()
    if any(w in lower for w in ["cheap", "cheapest", "kammi-a", "sasta", "sasti", "low price", "lowest price", "budget"]):
        return "cheapest"
    if any(w in lower for w in ["fast", "fastest", "quick", "earliest", "jaldi", "fast-a", "early"]):
        return "fastest"
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
    date, time_pref = extract_date_and_time(clean_text)
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
