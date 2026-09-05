import fs from "fs";
import path from "path";
import { SearchResult } from "../types.js";
import { calculateDurationMinutes, rankTravelResults } from "../ranking.js";

const FALLBACK_DATA_PATHS = [
  path.resolve(process.cwd(), "data", "fallback_travel.json"),
  path.resolve(process.cwd(), "backend", "data", "fallback_travel.json"),
];

const CITY_ALIASES: Record<string, string> = {
  bangalore: "bengaluru",
  blr: "bengaluru",
  madras: "chennai",
  maa: "chennai",
  bombay: "mumbai",
  bom: "mumbai",
  calcutta: "kolkata",
  ccu: "kolkata",
};

export function normalizeCity(city?: string | null): string {
  if (!city) return "";
  const clean = city.trim().toLowerCase();
  return CITY_ALIASES[clean] || clean;
}

export function loadTravelData(): any[] {
  for (const p of FALLBACK_DATA_PATHS) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, "utf-8");
        return JSON.parse(raw);
      } catch (e) {
        console.warn(`Warning: failed to read ${p}:`, e);
      }
    }
  }
  return [];
}

export function searchTravel({
  origin,
  destination,
  travel_date,
  time_preference,
  max_price,
  preference,
  transport_type,
  requested_departure_time,
  requested_arrival_time,
}: {
  origin: string;
  destination: string;
  travel_date?: string | null;
  time_preference?: string | null;
  max_price?: number | null;
  preference?: string | null;
  transport_type?: string | null;
  requested_departure_time?: string | null;
  requested_arrival_time?: string | null;
}): SearchResult[] {
  const data = loadTravelData();
  const normOrigin = normalizeCity(origin);
  const normDestination = normalizeCity(destination);

  const filtered: any[] = [];

  for (const item of data) {
    const itemOrigin = normalizeCity(item.origin || "");
    const itemDestination = normalizeCity(item.destination || "");

    if (itemOrigin !== normOrigin || itemDestination !== normDestination) {
      continue;
    }

    if (transport_type) {
      const itemTransport = (item.type || "").toLowerCase();
      if (itemTransport !== transport_type.toLowerCase()) {
        continue;
      }
    }

    if (max_price !== undefined && max_price !== null) {
      const price = item.price || 0;
      if (price > max_price) {
        continue;
      }
    }

    if (time_preference) {
      const dep = item.departure || "";
      if (dep && dep.includes(":")) {
        try {
          const depHour = parseInt(dep.split(":")[0], 10);
          const tp = time_preference.toLowerCase();
          if (tp === "morning" && !(depHour >= 5 && depHour < 12)) continue;
          if (tp === "afternoon" && !(depHour >= 12 && depHour < 17)) continue;
          if (tp === "evening" && !(depHour >= 17 && depHour < 21)) continue;
          if (tp === "night" && !(depHour >= 21 || depHour < 5)) continue;
        } catch (e) {
          // ignore parse failure
        }
      }
    }

    filtered.push(item);
  }

  // Return normalized result format with duration calculated from actual fields
  const normalizedResults: SearchResult[] = [];
  for (const item of filtered) {
    const transType = item.type || "train";
    const orig = item.origin || origin;
    const dest = item.destination || destination;
    const dep = item.departure || "";
    const arr = item.arrival || "";
    const name = item.name || `${transType.charAt(0).toUpperCase() + transType.slice(1)} Option`;
    const price = item.price || 0;

    const durationMinutes = calculateDurationMinutes(dep, arr);
    const durHours = Math.floor(durationMinutes / 60);
    const durMins = durationMinutes % 60;
    const formattedDuration = durHours > 0
      ? `${durHours}h ${durMins > 0 ? durMins + "m" : ""}`.trim()
      : `${durMins}m`;

    normalizedResults.push({
      type: "travel",
      title: name,
      description: `${transType.charAt(0).toUpperCase() + transType.slice(1)} from ${orig} to ${dest} (${dep} - ${arr})`,
      price,
      currency: item.currency || "INR",
      source: item.source || (transType === "bus" ? (item.operator || "Bus Operator") : (transType === "flight" ? (item.operator || "Airlines") : "IRCTC")),
      url: item.url || null,
      image: null,
      metadata: {
        id: item.id,
        transport: transType,
        origin: orig,
        destination: dest,
        departure: dep,
        arrival: arr,
        duration: item.duration || formattedDuration,
        duration_minutes: durationMinutes,
        date: travel_date || "tomorrow",
        operator: item.operator || item.source || name,
        bus_type: item.bus_type || null,
        boarding_point: item.boarding_point || null,
        dropping_point: item.dropping_point || null,
        available_seats: item.available_seats != null ? item.available_seats : null,
        service_id: item.service_id || item.train_number || item.id,
      },
    });
  }

  // Apply ranking system (cheapest, fastest, earliest, or balanced ranking)
  return rankTravelResults(normalizedResults, {
    preference,
    time_preference,
    requested_departure_time,
    requested_arrival_time,
  });
}
