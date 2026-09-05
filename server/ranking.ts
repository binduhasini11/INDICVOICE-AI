import { SearchResult } from "./types.js";

export interface TravelRankOptions {
  preference?: string | null;
  time?: string | null;
  time_preference?: string | null;
  requested_departure_time?: string | null;
  requested_arrival_time?: string | null;
  arrival_time?: string | null;
  departure_time?: string | null;
}

/**
 * Parses time string (e.g. "06:40", "7:30 am", "11pm", "morning") to minutes from midnight (0..1439).
 */
export function parseTimeToMinutes(t?: string | number | null): number | null {
  if (t === null || t === undefined || t === "") return null;
  if (typeof t === "number") return t;

  const str = String(t).trim().toLowerCase();

  // Named time slots
  if (["morning", "kaalai", "subah"].includes(str)) return 7 * 60; // 07:00
  if (["afternoon", "madhiyam", "dopahar"].includes(str)) return 13 * 60; // 13:00
  if (["evening", "maalai", "shaam"].includes(str)) return 18 * 60; // 18:00
  if (["night", "raathri", "raat"].includes(str)) return 21 * 60; // 21:00

  // 12-hour AM/PM format (e.g. "7:30 am", "7 am", "11pm")
  const ampmMatch = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const isPm = ampmMatch[3] === "pm";
    if (isPm && h < 12) h += 12;
    if (!isPm && h === 12) h = 0;
    return h * 60 + m;
  }

  // 24-hour format (e.g. "06:40", "6:40", "13:20")
  const match24 = str.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = parseInt(match24[2], 10);
    return h * 60 + m;
  }

  // Plain hour (e.g. "7", "11")
  const matchH = str.match(/^(\d{1,2})$/);
  if (matchH) {
    const h = parseInt(matchH[1], 10);
    if (h >= 0 && h <= 23) {
      return h * 60;
    }
  }

  return null;
}

/**
 * Calculates travel duration in minutes between departure and arrival strings.
 * Handles overnight journeys if arrival is on the next day.
 */
export function calculateDurationMinutes(departureStr?: string | null, arrivalStr?: string | null): number {
  const dep = parseTimeToMinutes(departureStr);
  const arr = parseTimeToMinutes(arrivalStr);
  if (dep === null || arr === null) return 99999;
  let diff = arr - dep;
  if (diff < 0) {
    diff += 24 * 60; // Journey spans midnight into the next day
  }
  return diff;
}

/**
 * Ranks travel/train results based on user search preferences, fare, duration, departure, and arrival times.
 */
export function rankTravelResults(
  results: SearchResult[],
  options: TravelRankOptions = {}
): SearchResult[] {
  if (!results || results.length <= 1) {
    return results ? [...results] : [];
  }

  const pref = (options.preference || "").toLowerCase().trim();

  // 1. Explicit Cheapest: prioritize fare heavily and sort by lowest fare first
  if (["cheapest", "lowest_price", "low_price", "budget", "cheap", "sasta", "sasti", "kammi-a"].includes(pref)) {
    return [...results].sort((a, b) => {
      const priceA = a.price != null ? a.price : Infinity;
      const priceB = b.price != null ? b.price : Infinity;
      if (priceA !== priceB) {
        return priceA - priceB;
      }
      // Tie breaker 1: duration (shorter journey first)
      const durA = calculateDurationMinutes(a.metadata?.departure, a.metadata?.arrival);
      const durB = calculateDurationMinutes(b.metadata?.departure, b.metadata?.arrival);
      if (durA !== durB) {
        return durA - durB;
      }
      // Tie breaker 2: earlier departure time
      const depA = a.metadata?.departure || "99:99";
      const depB = b.metadata?.departure || "99:99";
      return depA.localeCompare(depB);
    });
  }

  // 2. Explicit Fastest: prioritize shortest travel duration
  if (["fastest", "fast", "quick", "fast-a", "shortest_duration", "shortest"].includes(pref)) {
    return [...results].sort((a, b) => {
      const durA = calculateDurationMinutes(a.metadata?.departure, a.metadata?.arrival);
      const durB = calculateDurationMinutes(b.metadata?.departure, b.metadata?.arrival);
      if (durA !== durB) {
        return durA - durB;
      }
      // Tie breaker 1: fare (cheaper option first)
      const priceA = a.price != null ? a.price : Infinity;
      const priceB = b.price != null ? b.price : Infinity;
      if (priceA !== priceB) {
        return priceA - priceB;
      }
      // Tie breaker 2: earlier departure time
      const depA = a.metadata?.departure || "99:99";
      const depB = b.metadata?.departure || "99:99";
      return depA.localeCompare(depB);
    });
  }

  // 3. Explicit Earliest: prioritize earliest departure time
  if (["earliest", "early", "jaldi"].includes(pref)) {
    return [...results].sort((a, b) => {
      const depA = a.metadata?.departure || "99:99";
      const depB = b.metadata?.departure || "99:99";
      if (depA !== depB) {
        return depA.localeCompare(depB);
      }
      const durA = calculateDurationMinutes(a.metadata?.departure, a.metadata?.arrival);
      const durB = calculateDurationMinutes(b.metadata?.departure, b.metadata?.arrival);
      return durA - durB;
    });
  }

  // 4. Balanced Ranking:
  // Balances fare/amount, travel duration, departure time, and arrival time.
  const rawDep = options.requested_departure_time || options.departure_time || options.time || options.time_preference;
  const targetDep = parseTimeToMinutes(rawDep);

  const rawArr = options.requested_arrival_time || options.arrival_time;
  const targetArr = parseTimeToMinutes(rawArr);

  const stats = results.map((item) => {
    const fare = item.price != null ? item.price : 99999;
    const depStr = item.metadata?.departure || (item as any).departure || "";
    const arrStr = item.metadata?.arrival || (item as any).arrival || "";
    const dur = calculateDurationMinutes(depStr, arrStr);
    const depMin = parseTimeToMinutes(depStr) ?? 0;
    const arrMin = parseTimeToMinutes(arrStr) ?? 0;

    // Departure diff: distance from target departure time
    let depDiff = 0;
    if (targetDep != null) {
      depDiff = Math.abs(depMin - targetDep);
    } else {
      // Natural slight preference for earlier morning/daytime departures
      depDiff = depMin;
    }

    // Arrival diff: distance from target arrival time
    let arrDiff = 0;
    if (targetArr != null) {
      arrDiff = Math.abs(arrMin - targetArr);
      // Penalize arriving after requested time
      if (arrMin > targetArr) {
        arrDiff += (arrMin - targetArr) * 0.75;
      }
    }

    return { item, fare, dur, depMin, arrMin, depDiff, arrDiff };
  });

  const fares = stats.map((s) => s.fare);
  const minFare = Math.min(...fares);
  const maxFare = Math.max(...fares);
  const fareRange = maxFare - minFare;

  const durs = stats.map((s) => s.dur);
  const minDur = Math.min(...durs);
  const maxDur = Math.max(...durs);
  const durRange = maxDur - minDur;

  const depDiffs = stats.map((s) => s.depDiff);
  const minDepDiff = Math.min(...depDiffs);
  const maxDepDiff = Math.max(...depDiffs);
  const depRange = maxDepDiff - minDepDiff;

  const arrDiffs = stats.map((s) => s.arrDiff);
  const minArrDiff = Math.min(...arrDiffs);
  const maxArrDiff = Math.max(...arrDiffs);
  const arrRange = maxArrDiff - minArrDiff;

  // Determine weights based on specified constraints
  let wFare = 0.40;
  let wDur = 0.35;
  let wDep = 0.25;
  let wArr = 0.0;

  if (targetArr != null && targetDep != null) {
    wFare = 0.30;
    wDur = 0.25;
    wDep = 0.20;
    wArr = 0.25;
  } else if (targetArr != null) {
    wFare = 0.35;
    wDur = 0.30;
    wDep = 0.05;
    wArr = 0.30;
  } else if (targetDep != null) {
    wFare = 0.40;
    wDur = 0.35;
    wDep = 0.25;
  } else {
    // General search: balance fare and duration
    wFare = 0.50;
    wDur = 0.45;
    wDep = 0.05;
  }

  const scored = stats.map((s) => {
    const normFare = fareRange > 0 ? (s.fare - minFare) / fareRange : 0;
    const normDur = durRange > 0 ? (s.dur - minDur) / durRange : 0;
    const normDep = depRange > 0 ? (s.depDiff - minDepDiff) / depRange : 0;
    const normArr = arrRange > 0 ? (s.arrDiff - minArrDiff) / arrRange : 0;

    const score = (wFare * normFare) + (wDur * normDur) + (wDep * normDep) + (wArr * normArr);
    return { item: s.item, score, fare: s.fare, dur: s.dur, depMin: s.depMin };
  });

  scored.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 0.0001) {
      return a.score - b.score;
    }
    if (a.fare !== b.fare) {
      return a.fare - b.fare;
    }
    if (a.dur !== b.dur) {
      return a.dur - b.dur;
    }
    return a.depMin - b.depMin;
  });

  return scored.map((s) => s.item);
}

/**
 * Universal rankResults entry point supporting travel, products, and web.
 */
export function rankResults(
  results: SearchResult[],
  preference?: string | null,
  options?: any
): SearchResult[] {
  if (!results || results.length === 0) {
    return results;
  }

  const isTravel = results.some((r) => r.type === "travel" || r.metadata?.transport);

  if (isTravel) {
    const rankOpts: TravelRankOptions = {
      preference: preference || options?.preference,
      time: options?.time,
      time_preference: options?.time_preference || options?.time,
      requested_departure_time: options?.requested_departure_time || options?.departure_time,
      requested_arrival_time: options?.requested_arrival_time || options?.arrival_time,
    };
    return rankTravelResults(results, rankOpts);
  }

  // Non-travel rankings (product search, etc.)
  if (!preference) {
    return results;
  }

  const pref = preference.toLowerCase().trim();

  if (["cheapest", "lowest_price", "low_price", "budget", "cheap"].includes(pref)) {
    return [...results].sort((a, b) => {
      const pA = a.price != null ? a.price : Infinity;
      const pB = b.price != null ? b.price : Infinity;
      return pA - pB;
    });
  }

  if (["rating", "best_rated", "top_rated"].includes(pref)) {
    return [...results].sort((a, b) => {
      const rA = a.metadata?.rating || 0;
      const rB = b.metadata?.rating || 0;
      return rB - rA;
    });
  }

  return results;
}
