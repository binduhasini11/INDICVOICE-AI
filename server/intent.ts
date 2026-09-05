import { Intent } from "./types.js";

export const KNOWN_CITIES = [
  "Bengaluru", "Bangalore", "Chennai", "Mumbai", "Delhi", "New Delhi",
  "Hyderabad", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Coimbatore",
  "Madurai", "Salem", "Trichy", "Tiruchirappalli", "Kochi", "Cochin",
  "Mysore", "Mysuru", "Goa", "Chandigarh", "Lucknow", "Varanasi", "Patna"
];

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function detectLanguage(text: string): "ta-en" | "hi-en" | "en" {
  const lower = text.toLowerCase();
  const tamilMarkers = [
    "la irundhu", "lendhu", "lerundhu", " ku ", "naalaiku", "naalai", "innaiku",
    "kaalai", "maalai", "raathri", "paathu", "sollu", "venum", "kulla", "kammi-a",
    "cheap-a", "fast-a", "iruku", "epdi"
  ];
  const hindiMarkers = [
    " se ", " tak ", "kal ", " aaj", "subah", "shaam", "raat", "sasta", "sasti",
    "chahiye", "dikhao", "ke andar", "karo", "kya", "accha", "batao", "mujhe", "mera"
  ];

  if (tamilMarkers.some((m) => lower.includes(m))) {
    return "ta-en";
  }
  if (hindiMarkers.some((m) => lower.includes(m))) {
    return "hi-en";
  }
  return "en";
}

export function extractBudget(text: string): number | null {
  const lower = text.toLowerCase();
  const patterns = [
    /(?:under|below|within|budget|less\s+than|upto|up\s+to|max)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)?(?:\.\d+)?)/i,
    /(?:rs\.?|inr|₹)\s*(\d+(?:,\d+)?(?:\.\d+)?)/i,
    /(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:ke\s+andar|kulla|kulle|rupees|rs|inr|₹)/i,
  ];

  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match) {
      const valStr = match[1].replace(/,/g, "");
      const num = parseFloat(valStr);
      if (!isNaN(num)) {
        return num;
      }
    }
  }
  return null;
}

export function extractCities(text: string): [string | null, string | null] {
  const NON_CITIES = new Set([
    "train", "trains", "bus", "buses", "flight", "flights", "plane", "ticket",
    "tickets", "chahiye", "venum", "options", "cheap", "sasta", "travel"
  ]);

  // Pattern 1: Tamil "Chennai la irundhu Bangalore ku"
  const mTa = text.match(/\b([a-zA-Z]+)\s+(?:la\s+irundhu|lerundhu|lendhu)\s+([a-zA-Z]+)\s+ku\b/i);
  if (mTa) {
    const c1 = capitalize(mTa[1]);
    const c2 = capitalize(mTa[2]);
    return [
      NON_CITIES.has(c1.toLowerCase()) ? null : c1,
      NON_CITIES.has(c2.toLowerCase()) ? null : c2
    ];
  }

  // Pattern 2: Hindi "Delhi se Mumbai"
  const mHi = text.match(/\b([a-zA-Z]+)\s+se\s+([a-zA-Z]+)(?:\s+tak|\s+ke\s+liye)?\b/i);
  if (mHi) {
    const c1 = capitalize(mHi[1]);
    const c2 = capitalize(mHi[2]);
    return [
      NON_CITIES.has(c1.toLowerCase()) ? null : c1,
      NON_CITIES.has(c2.toLowerCase()) ? null : c2
    ];
  }

  // Pattern 3: English "from Chennai to Bangalore"
  const mEn = text.match(/\bfrom\s+([a-zA-Z]+)\s+to\s+([a-zA-Z]+)\b/i);
  if (mEn) {
    const c1 = capitalize(mEn[1]);
    const c2 = capitalize(mEn[2]);
    return [
      NON_CITIES.has(c1.toLowerCase()) ? null : c1,
      NON_CITIES.has(c2.toLowerCase()) ? null : c2
    ];
  }

  // Pattern 4: "Chennai to Bangalore"
  const mTo = text.match(/\b([a-zA-Z]+)\s+to\s+([a-zA-Z]+)\b/i);
  if (mTo) {
    const known1 = KNOWN_CITIES.find((c) => c.toLowerCase() === mTo[1].toLowerCase());
    const known2 = KNOWN_CITIES.find((c) => c.toLowerCase() === mTo[2].toLowerCase());
    const c1 = known1 || capitalize(mTo[1]);
    const c2 = known2 || capitalize(mTo[2]);
    return [
      NON_CITIES.has(c1.toLowerCase()) ? null : c1,
      NON_CITIES.has(c2.toLowerCase()) ? null : c2
    ];
  }

  // Pattern 5: Look for two known cities
  const found: { city: string; pos: number }[] = [];
  for (const c of KNOWN_CITIES) {
    const regex = new RegExp(`\\b${c}\\b`, "i");
    const match = regex.exec(text);
    if (match) {
      if (!found.some((fc) => fc.city.toLowerCase() === c.toLowerCase())) {
        found.push({ city: c, pos: match.index });
      }
    }
  }
  found.sort((a, b) => a.pos - b.pos);

  if (found.length >= 2) {
    return [found[0].city, found[1].city];
  } else if (found.length === 1) {
    const lower = text.toLowerCase();
    const cName = found[0].city.toLowerCase();
    if (lower.includes(`to ${cName}`) || lower.includes(`${cName} ku`)) {
      return [null, found[0].city];
    }
    if (lower.includes(`from ${cName}`) || lower.includes(`${cName} la irundhu`) || lower.includes(`${cName} se`)) {
      return [found[0].city, null];
    }
    return [found[0].city, null];
  }

  return [null, null];
}

export function extractDateAndTime(text: string): [string | null, string | null] {
  const lower = text.toLowerCase();
  let date: string | null = null;
  let time: string | null = null;

  if (["tomorrow", "naalaiku", "naalai", "kal"].some((k) => lower.includes(k))) {
    date = "tomorrow";
  } else if (["today", "innaiku", "indru", "aaj"].some((k) => lower.includes(k))) {
    date = "today";
  }

  if (["morning", "kaalai", "subah"].some((k) => lower.includes(k))) {
    time = "morning";
  } else if (["afternoon", "madhiyam", "dopahar"].some((k) => lower.includes(k))) {
    time = "afternoon";
  } else if (["evening", "maalai", "shaam"].some((k) => lower.includes(k))) {
    time = "evening";
  } else if (["night", "raathri", "raat"].some((k) => lower.includes(k))) {
    time = "night";
  }

  return [date, time];
}

export function extractTransportType(text: string): string | null {
  const lower = text.toLowerCase();
  if (["train", "rail", "railway", "trains", "shatabdi", "vande bharat", "express"].some((w) => lower.includes(w))) {
    return "train";
  }
  if (["bus", "buses", "ksrtc", "setc"].some((w) => lower.includes(w))) {
    return "bus";
  }
  if (["flight", "flights", "plane", "airplane", "air"].some((w) => lower.includes(w))) {
    return "flight";
  }
  return null;
}

export function extractPreference(text: string): string | null {
  const lower = text.toLowerCase();
  if (["cheap", "cheapest", "kammi-a", "sasta", "sasti", "low price", "lowest price", "budget"].some((w) => lower.includes(w))) {
    return "cheapest";
  }
  if (["fast", "fastest", "quick", "earliest", "jaldi", "fast-a", "early"].some((w) => lower.includes(w))) {
    return "fastest";
  }
  if (["best", "top rated", "accha", "rating", "top-rated"].some((w) => lower.includes(w))) {
    return "rating";
  }
  if (["wireless", "bluetooth", "cordless"].some((w) => lower.includes(w))) {
    return "wireless";
  }
  return null;
}

export function extractIntent(text: string): Intent {
  const cleanText = text.trim();
  const lower = cleanText.toLowerCase();
  const language = detectLanguage(cleanText);

  // Check for general greetings
  if (["hi", "hello", "hey", "vanakkam", "namaste", "good morning", "good evening", "how are you"].includes(lower)) {
    return {
      intent: "general_chat",
      message: cleanText,
      language,
    };
  }

  // 1. Travel Search Detection
  const [origin, destination] = extractCities(cleanText);
  const transport = extractTransportType(cleanText);
  const [date, timePref] = extractDateAndTime(cleanText);
  const budget = extractBudget(cleanText);
  const pref = extractPreference(cleanText);

  const isTravelKeywords = [
    "train", "trains", "flight", "flights", "bus", "buses",
    "ticket", "tickets", "travel", "journey", "trip",
    "la irundhu", "lendhu", "lerundhu", " se ", "naalaiku", "kal subah"
  ].some((w) => lower.includes(w));

  if (
    (origin && destination) ||
    (origin && isTravelKeywords) ||
    (destination && isTravelKeywords) ||
    (transport && (origin || destination || isTravelKeywords))
  ) {
    return {
      intent: "travel_search",
      origin,
      destination,
      date,
      time: timePref,
      preference: pref,
      transport_type: transport || "train",
      budget,
      language,
    };
  }

  // 2. Product Search Detection
  const productKeywords = [
    "buy", "purchase", "headphones", "headphone", "earbuds", "earphones",
    "shoes", "smartwatch", "watch", "mobile", "phone", "laptop", "sneakers"
  ];
  const isProductIntent =
    productKeywords.some((k) => lower.includes(k)) ||
    (lower.includes("chahiye") && ["ek", "accha", "under", "ke andar"].some((w) => lower.includes(w))) ||
    (lower.includes("dikhao") && budget !== null) ||
    (lower.includes("under") && ["shoes", "watch", "phone", "headphones"].some((p) => lower.includes(p)));

  if (isProductIntent) {
    let productName = cleanText;
    for (const kw of ["headphones", "headphone", "earbuds", "running shoes", "shoes", "smart watch", "watch", "phone", "laptop"]) {
      if (lower.includes(kw)) {
        productName = kw;
        break;
      }
    }

    const isElectronics = ["headphones", "watch", "phone", "laptop", "earbuds"].some((e) => lower.includes(e));
    return {
      intent: "product_search",
      product: productName,
      category: isElectronics ? "electronics" : "fashion",
      budget,
      preference: pref,
      language,
    };
  }

  // 3. Web Search Detection
  const webKeywords = [
    "search", "latest", "news", "what happened", "who is", "isro", "weather",
    "today", "information", "tell me about", "update", "updates", "karo"
  ];
  const isWeb = webKeywords.some((k) => lower.includes(k)) || cleanText.endsWith("?");

  if (isWeb) {
    const cleanQ = cleanText.replace(/\b(search karo|search|batao|tell me)\b/gi, "").trim();
    return {
      intent: "web_search",
      query: cleanQ || cleanText,
      language,
    };
  }

  // 4. General fallback
  return {
    intent: "general_chat",
    message: cleanText,
    language,
  };
}
