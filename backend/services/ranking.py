import re
from typing import List, Dict, Any, Optional

def parse_time_to_minutes(t: Any) -> Optional[int]:
    """
    Parses time string (e.g. '06:40', '7:30 am', '11pm', 'morning') to minutes from midnight (0..1439).
    """
    if t is None or t == "":
        return None
    if isinstance(t, (int, float)):
        return int(t)

    s = str(t).strip().lower()

    # Named time slots
    if s in ["morning", "kaalai", "subah"]:
        return 7 * 60  # 07:00
    if s in ["afternoon", "madhiyam", "dopahar"]:
        return 13 * 60  # 13:00
    if s in ["evening", "maalai", "shaam"]:
        return 18 * 60  # 18:00
    if s in ["night", "raathri", "raat"]:
        return 21 * 60  # 21:00

    # 12-hour AM/PM format (e.g. '7:30 am', '7 am', '11pm')
    ampm_match = re.match(r"^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$", s)
    if ampm_match:
        h = int(ampm_match.group(1))
        m = int(ampm_match.group(2)) if ampm_match.group(2) else 0
        is_pm = ampm_match.group(3) == "pm"
        if is_pm and h < 12:
            h += 12
        if not is_pm and h == 12:
            h = 0
        return h * 60 + m

    # 24-hour format (e.g. '06:40', '6:40', '13:20')
    match24 = re.match(r"^(\d{1,2}):(\d{2})$", s)
    if match24:
        h = int(match24.group(1))
        m = int(match24.group(2))
        return h * 60 + m

    # Plain hour (e.g. '7', '11')
    match_h = re.match(r"^(\d{1,2})$", s)
    if match_h:
        h = int(match_h.group(1))
        if 0 <= h <= 23:
            return h * 60

    return None

def calculate_duration_minutes(departure_str: Optional[str], arrival_str: Optional[str]) -> int:
    """
    Calculates travel duration in minutes between departure and arrival strings.
    Handles overnight journeys if arrival is on the next day.
    """
    dep = parse_time_to_minutes(departure_str)
    arr = parse_time_to_minutes(arrival_str)
    if dep is None or arr is None:
        return 99999
    diff = arr - dep
    if diff < 0:
        diff += 24 * 60  # spans midnight
    return diff

def rank_travel_results(
    results: List[Dict[str, Any]],
    options: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Ranks travel/train results based on user search preferences, fare, duration, departure, and arrival times.
    """
    if not results or len(results) <= 1:
        return list(results) if results else []

    opts = options or {}
    pref = (opts.get("preference") or "").lower().strip()

    # 1. Explicit Cheapest: prioritize fare heavily and sort by lowest fare first
    if pref in ["cheapest", "lowest_price", "low_price", "budget", "cheap", "sasta", "sasti", "kammi-a"]:
        def get_cheapest_key(x: Dict[str, Any]):
            p = x.get("price") if x.get("price") is not None else float("inf")
            meta = x.get("metadata", {})
            dur = calculate_duration_minutes(meta.get("departure"), meta.get("arrival"))
            dep = meta.get("departure") or "99:99"
            return (p, dur, dep)
        return sorted(results, key=get_cheapest_key)

    # 2. Explicit Fastest: prioritize shortest travel duration
    if pref in ["fastest", "fast", "quick", "fast-a", "shortest_duration", "shortest"]:
        def get_fastest_key(x: Dict[str, Any]):
            meta = x.get("metadata", {})
            dur = calculate_duration_minutes(meta.get("departure"), meta.get("arrival"))
            p = x.get("price") if x.get("price") is not None else float("inf")
            dep = meta.get("departure") or "99:99"
            return (dur, p, dep)
        return sorted(results, key=get_fastest_key)

    # 3. Explicit Earliest: prioritize earliest departure time
    if pref in ["earliest", "early", "jaldi"]:
        def get_earliest_key(x: Dict[str, Any]):
            meta = x.get("metadata", {})
            dep = meta.get("departure") or "99:99"
            dur = calculate_duration_minutes(meta.get("departure"), meta.get("arrival"))
            p = x.get("price") if x.get("price") is not None else float("inf")
            return (dep, dur, p)
        return sorted(results, key=get_earliest_key)

    # 4. Balanced Ranking:
    # Balances fare/amount, travel duration, departure time, and arrival time.
    raw_dep = (
        opts.get("requested_departure_time") or
        opts.get("departure_time") or
        opts.get("time") or
        opts.get("time_preference")
    )
    target_dep = parse_time_to_minutes(raw_dep)

    raw_arr = opts.get("requested_arrival_time") or opts.get("arrival_time")
    target_arr = parse_time_to_minutes(raw_arr)

    stats = []
    for item in results:
        fare = item.get("price") if item.get("price") is not None else 99999
        meta = item.get("metadata", {})
        dep_str = meta.get("departure") or item.get("departure") or ""
        arr_str = meta.get("arrival") or item.get("arrival") or ""
        dur = calculate_duration_minutes(dep_str, arr_str)
        dep_min = parse_time_to_minutes(dep_str) or 0
        arr_min = parse_time_to_minutes(arr_str) or 0

        # Departure diff
        if target_dep is not None:
            dep_diff = abs(dep_min - target_dep)
        else:
            dep_diff = dep_min

        # Arrival diff
        if target_arr is not None:
            arr_diff = abs(arr_min - target_arr)
            if arr_min > target_arr:
                arr_diff += (arr_min - target_arr) * 0.75
        else:
            arr_diff = 0

        stats.append({
            "item": item,
            "fare": fare,
            "dur": dur,
            "dep_min": dep_min,
            "arr_min": arr_min,
            "dep_diff": dep_diff,
            "arr_diff": arr_diff,
        })

    fares = [s["fare"] for s in stats]
    min_fare, max_fare = min(fares), max(fares)
    fare_range = max_fare - min_fare

    durs = [s["dur"] for s in stats]
    min_dur, max_dur = min(durs), max(durs)
    dur_range = max_dur - min_dur

    dep_diffs = [s["dep_diff"] for s in stats]
    min_dep_diff, max_dep_diff = min(dep_diffs), max(dep_diffs)
    dep_range = max_dep_diff - min_dep_diff

    arr_diffs = [s["arr_diff"] for s in stats]
    min_arr_diff, max_arr_diff = min(arr_diffs), max(arr_diffs)
    arr_range = max_arr_diff - min_arr_diff

    # Weights
    if target_arr is not None and target_dep is not None:
        w_fare, w_dur, w_dep, w_arr = 0.30, 0.25, 0.20, 0.25
    elif target_arr is not None:
        w_fare, w_dur, w_dep, w_arr = 0.35, 0.30, 0.05, 0.30
    elif target_dep is not None:
        w_fare, w_dur, w_dep, w_arr = 0.40, 0.35, 0.25, 0.0
    else:
        w_fare, w_dur, w_dep, w_arr = 0.50, 0.45, 0.05, 0.0

    scored = []
    for s in stats:
        norm_fare = (s["fare"] - min_fare) / fare_range if fare_range > 0 else 0.0
        norm_dur = (s["dur"] - min_dur) / dur_range if dur_range > 0 else 0.0
        norm_dep = (s["dep_diff"] - min_dep_diff) / dep_range if dep_range > 0 else 0.0
        norm_arr = (s["arr_diff"] - min_arr_diff) / arr_range if arr_range > 0 else 0.0

        score = (w_fare * norm_fare) + (w_dur * norm_dur) + (w_dep * norm_dep) + (w_arr * norm_arr)
        scored.append((score, s["fare"], s["dur"], s["dep_min"], s["item"]))

    # Sort ascending: lowest score first
    scored.sort(key=lambda x: (x[0], x[1], x[2], x[3]))
    return [x[4] for x in scored]

def rank_results(
    results: List[Dict[str, Any]],
    preference: Optional[str] = None,
    options: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Universal rank_results entry point for travel, products, and web.
    """
    if not results:
        return results

    is_travel = any(
        r.get("type") == "travel" or r.get("metadata", {}).get("transport")
        for r in results
    )

    if is_travel:
        opts = dict(options) if options else {}
        if preference:
            opts["preference"] = preference
        return rank_travel_results(results, opts)

    # Non-travel ranking (e.g. products)
    if not preference:
        return results

    pref = preference.lower().strip()

    if pref in ["cheapest", "lowest_price", "low_price", "budget", "cheap"]:
        return sorted(results, key=lambda x: x.get("price") if x.get("price") is not None else float("inf"))

    if pref in ["rating", "best_rated", "top_rated"]:
        return sorted(results, key=lambda x: x.get("metadata", {}).get("rating", 0), reverse=True)

    return results
