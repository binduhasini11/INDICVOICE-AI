import fs from "fs";
import path from "path";
import { SearchResult } from "../types.js";

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
  const possiblePaths = [
    path.resolve(process.cwd(), "data", "fallback_travel.json"),
    path.resolve(process.cwd(), "backend", "data", "fallback_travel.json"),
  ];

  for (const p of possiblePaths) {
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
}: {
  origin: string;
  destination: string;
  travel_date?: string | null;
  time_preference?: string | null;
  max_price?: number | null;
  preference?: string | null;
  transport_type?: string | null;
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

  // Apply ranking preference
  if (preference) {
    const pref = preference.toLowerCase();
    if (["cheapest", "lowest_price", "low_price", "budget"].includes(pref)) {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (["earliest", "early", "fastest", "quick"].includes(pref)) {
      filtered.sort((a, b) => (a.departure || "99:99").localeCompare(b.departure || "99:99"));
    }
  }

  // Return normalized result format
  const normalizedResults: SearchResult[] = [];
  for (const item of filtered) {
    const transType = item.type || "train";
    const orig = item.origin || origin;
    const dest = item.destination || destination;
    const dep = item.departure || "";
    const arr = item.arrival || "";
    const name = item.name || `${transType.charAt(0).toUpperCase() + transType.slice(1)} Option`;
    const price = item.price || 0;

    normalizedResults.push({
      type: "travel",
      title: name,
      description: `${transType.charAt(0).toUpperCase() + transType.slice(1)} from ${orig} to ${dest} (${dep} - ${arr})`,
      price,
      currency: item.currency || "INR",
      source: "Demo Travel Data (IRCTC Dataset)",
      url: item.url || "https://www.irctc.co.in",
      image: null,
      metadata: {
        id: item.id,
        transport: transType,
        origin: orig,
        destination: dest,
        departure: dep,
        arrival: arr,
        date: travel_date || "tomorrow",
        is_demo: true,
      },
    });
  }

  return normalizedResults;
}
