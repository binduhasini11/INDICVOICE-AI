import { Intent } from "./types.js";

export const KNOWN_CITIES = [
  "Bengaluru", "Bangalore", "Chennai", "Mumbai", "Delhi", "New Delhi",
  "Hyderabad", "Secunderabad", "Kolkata", "Pune", "Ahmedabad", "Jaipur",
  "Coimbatore", "Madurai", "Salem", "Trichy", "Tiruchirappalli", "Kochi", "Cochin",
  "Mysore", "Mysuru", "Goa", "Chandigarh", "Lucknow", "Varanasi", "Patna",
  "Bhopal", "Indore", "Nagpur", "Visakhapatnam", "Vizag", "Vijayawada",
  "Thiruvananthapuram", "Trivandrum", "Kozhikode", "Calicut", "Mangalore", "Mangaluru",
  "Surat", "Vadodara", "Agra", "Kanpur", "Amritsar", "Pondicherry", "Puducherry",
  "Tirupati", "Vellore", "Hubli", "Belgaum", "Udaipur", "Jodhpur", "Gwalior",
  "Jabalpur", "Raipur", "Ranchi", "Bhubaneswar", "Dehradun", "Shimla"
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
    "cheap-a", "fast-a", "iruku", "epdi", "idha", "pannu", "kudunga", "pannunga"
  ];
  const hindiMarkers = [
    " se ", " tak ", "kal ", " aaj", "subah", "shaam", "raat", "sasta", "sasti",
    "chahiye", "dikhao", "ke andar", "karo", "kya", "accha", "batao", "mujhe", "mera",
    "isko", "kardo", "kijiye"
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
    "tickets", "chahiye", "venum", "options", "cheap", "sasta", "travel", "fastest",
    "cheapest", "quick", "show", "me", "find", "between"
  ]);

  // Pattern 1: Tamil "Chennai la irundhu Bangalore ku"
  const mTa = text.match(/\b([a-zA-Z]+)\s+(?:la\s+irundhu|lerundhu|lendhu)\s+([a-zA-Z]+)\s+ku\b/i);
  if (mTa) {
    const c1 = capitalize(mTa[1]);
    const c2 = capitalize(mTa[2]);
    const orig = NON_CITIES.has(c1.toLowerCase()) ? null : c1;
    const dest = NON_CITIES.has(c2.toLowerCase()) ? null : c2;
    if (orig && dest) return [orig, dest];
  }

  // Pattern 2: Hindi "Delhi se Mumbai"
  const mHi = text.match(/\b([a-zA-Z]+)\s+se\s+([a-zA-Z]+)(?:\s+tak|\s+ke\s+liye)?\b/i);
  if (mHi) {
    const c1 = capitalize(mHi[1]);
    const c2 = capitalize(mHi[2]);
    const orig = NON_CITIES.has(c1.toLowerCase()) ? null : c1;
    const dest = NON_CITIES.has(c2.toLowerCase()) ? null : c2;
    if (orig && dest) return [orig, dest];
  }

  // Pattern 3: English "between Chennai and Bangalore/Bengaluru"
  const mBetween = text.match(/\bbetween\s+([a-zA-Z]+)\s+and\s+([a-zA-Z]+)\b/i);
  if (mBetween) {
    const c1 = capitalize(mBetween[1]);
    const c2 = capitalize(mBetween[2]);
    const orig = NON_CITIES.has(c1.toLowerCase()) ? null : c1;
    const dest = NON_CITIES.has(c2.toLowerCase()) ? null : c2;
    if (orig && dest) return [orig, dest];
  }

  // Pattern 4: Inverted "to Bengaluru from Chennai"
  const mInverted = text.match(/\bto\s+([a-zA-Z]+)\s+from\s+([a-zA-Z]+)\b/i);
  if (mInverted) {
    const dest = capitalize(mInverted[1]);
    const orig = capitalize(mInverted[2]);
    const cOrig = NON_CITIES.has(orig.toLowerCase()) ? null : orig;
    const cDest = NON_CITIES.has(dest.toLowerCase()) ? null : dest;
    if (cOrig && cDest) return [cOrig, cDest];
  }

  // Pattern 5: English "from Chennai to Bangalore"
  const mEn = text.match(/\bfrom\s+([a-zA-Z]+)\s+to\s+([a-zA-Z]+)\b/i);
  if (mEn) {
    const c1 = capitalize(mEn[1]);
    const c2 = capitalize(mEn[2]);
    const orig = NON_CITIES.has(c1.toLowerCase()) ? null : c1;
    const dest = NON_CITIES.has(c2.toLowerCase()) ? null : c2;
    if (orig && dest) return [orig, dest];
  }

  // Pattern 6: "Chennai to Bangalore" (ensure first word is not a non-city keyword)
  const mTo = text.match(/\b([a-zA-Z]+)\s+to\s+([a-zA-Z]+)\b/i);
  if (mTo) {
    const firstWord = mTo[1].toLowerCase();
    const secondWord = mTo[2].toLowerCase();
    if (!NON_CITIES.has(firstWord) && !NON_CITIES.has(secondWord)) {
      const known1 = KNOWN_CITIES.find((c) => c.toLowerCase() === firstWord);
      const known2 = KNOWN_CITIES.find((c) => c.toLowerCase() === secondWord);
      const c1 = known1 || capitalize(mTo[1]);
      const c2 = known2 || capitalize(mTo[2]);
      return [c1, c2];
    }
  }

  // Pattern 7: Look for known cities in text and check surrounding prepositions
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
    const lower = text.toLowerCase();
    const city1 = found[0].city;
    const city2 = found[1].city;
    const c1Lower = city1.toLowerCase();
    const c2Lower = city2.toLowerCase();

    // Check if inverted: e.g. "to Bengaluru ... from Chennai"
    const hasTo1 = new RegExp(`\\b(?:to|ku)\\s+${c1Lower}\\b`, "i").test(lower) || lower.includes(`${c1Lower} ku`);
    const hasFrom2 = new RegExp(`\\b(?:from|se)\\s+${c2Lower}\\b`, "i").test(lower) || lower.includes(`${c2Lower} la irundhu`) || lower.includes(`${c2Lower} se`);
    if (hasTo1 && hasFrom2) {
      return [city2, city1];
    }

    const hasFrom1 = new RegExp(`\\b(?:from|se)\\s+${c1Lower}\\b`, "i").test(lower) || lower.includes(`${c1Lower} la irundhu`) || lower.includes(`${c1Lower} se`);
    const hasTo2 = new RegExp(`\\b(?:to|ku)\\s+${c2Lower}\\b`, "i").test(lower) || lower.includes(`${c2Lower} ku`);
    if (hasFrom1 && hasTo2) {
      return [city1, city2];
    }

    return [found[0].city, found[1].city];
  } else if (found.length === 1) {
    const lower = text.toLowerCase();
    const cName = found[0].city.toLowerCase();
    if (new RegExp(`\\b(?:to|ku)\\s+${cName}\\b`, "i").test(lower) || lower.includes(`${cName} ku`)) {
      return [null, found[0].city];
    }
    if (new RegExp(`\\b(?:from|se)\\s+${cName}\\b`, "i").test(lower) || lower.includes(`${cName} la irundhu`) || lower.includes(`${cName} se`)) {
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

export function extractDepartureAndArrivalTimes(text: string): {
  requestedDepartureTime: string | null;
  requestedArrivalTime: string | null;
  timeSlot: string | null;
} {
  const lower = text.toLowerCase();
  let requestedDepartureTime: string | null = null;
  let requestedArrivalTime: string | null = null;
  let timeSlot: string | null = null;

  if (["morning", "kaalai", "subah"].some((k) => lower.includes(k))) {
    timeSlot = "morning";
  } else if (["afternoon", "madhiyam", "dopahar"].some((k) => lower.includes(k))) {
    timeSlot = "afternoon";
  } else if (["evening", "maalai", "shaam"].some((k) => lower.includes(k))) {
    timeSlot = "evening";
  } else if (["night", "raathri", "raat"].some((k) => lower.includes(k))) {
    timeSlot = "night";
  }

  // 1. Arrival time patterns: e.g. "reach by 11", "reaching before 12", "arrive around 10:30"
  const arrRegex1 = /(?:reach(?:ing)?|arriv(?:e|ing|al)|pahunch(?:na|e|te)?)\s+(?:(?:to|in|at)\s+[a-z\s]+\s+)?(?:by|before|around|at|till|tak)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const arrMatch1 = lower.match(arrRegex1);
  if (arrMatch1) {
    let h = parseInt(arrMatch1[1], 10);
    const m = arrMatch1[2] ? parseInt(arrMatch1[2], 10) : 0;
    const ampm = arrMatch1[3];
    if (ampm === "pm" && h < 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    requestedArrivalTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  } else {
    const arrRegex2 = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:kulla|varaikkum|kulle|baje tak|tak)?\s*(?:reach|poganum|pahunch)/i;
    const arrMatch2 = lower.match(arrRegex2);
    if (arrMatch2) {
      let h = parseInt(arrMatch2[1], 10);
      const m = arrMatch2[2] ? parseInt(arrMatch2[2], 10) : 0;
      const ampm = arrMatch2[3];
      if (ampm === "pm" && h < 12) h += 12;
      if (ampm === "am" && h === 12) h = 0;
      requestedArrivalTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }

  // 2. Departure time patterns: e.g. "departing at 7", "leaves at 6:30", "around 7 am"
  const depRegex1 = /(?:depart(?:ing|ure)?|leaves?|start(?:ing)?)\s+(?:at|around|after|by)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const depMatch1 = lower.match(depRegex1);
  if (depMatch1) {
    let h = parseInt(depMatch1[1], 10);
    const m = depMatch1[2] ? parseInt(depMatch1[2], 10) : 0;
    const ampm = depMatch1[3];
    if (ampm === "pm" && h < 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    requestedDepartureTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  } else {
    const depRegex2 = /(?:around|at|subah|kaalai)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje|manikku)?/i;
    const depMatch2 = lower.match(depRegex2);
    if (depMatch2 && !requestedArrivalTime) {
      let h = parseInt(depMatch2[1], 10);
      const m = depMatch2[2] ? parseInt(depMatch2[2], 10) : 0;
      const modifier = depMatch2[3];
      if (modifier === "pm" && h < 12) h += 12;
      if (modifier === "am" && h === 12) h = 0;
      if (["subah", "kaalai"].some((w) => lower.includes(w)) && h <= 12) {
        if (h === 12) h = 0;
      }
      if (["shaam", "maalai"].some((w) => lower.includes(w)) && h < 12) {
        h += 12;
      }
      requestedDepartureTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }

  if (!timeSlot && requestedDepartureTime) {
    const depHour = parseInt(requestedDepartureTime.split(":")[0], 10);
    if (depHour >= 5 && depHour < 12) timeSlot = "morning";
    else if (depHour >= 12 && depHour < 17) timeSlot = "afternoon";
    else if (depHour >= 17 && depHour < 21) timeSlot = "evening";
    else timeSlot = "night";
  }

  return { requestedDepartureTime, requestedArrivalTime, timeSlot };
}

export function extractTransportType(text: string): string | null {
  const lower = text.toLowerCase();
  // 1. Bus markers (including bus operators)
  if (/\b(bus|buses|ksrtc|setc|volvo|redbus|sleeper\s*bus)\b/i.test(lower)) {
    return "bus";
  }
  // 2. Flight markers
  if (/\b(flight|flights|plane|airplane|indigo|air\s*india)\b/i.test(lower)) {
    return "flight";
  }
  // 3. Train markers
  if (/\b(train|trains|rail|railway|shatabdi|vande\s*bharat|irctc|intercity)\b/i.test(lower)) {
    return "train";
  }
  // 4. Cab / Taxi markers
  if (/\b(cab|cabs|taxi|taxis|uber|ola)\b/i.test(lower)) {
    return "cab";
  }
  // 5. Express keyword as train (only if no bus was mentioned)
  if (/\bexpress\b/i.test(lower)) {
    return "train";
  }
  return null;
}

export function extractPreference(text: string): string | null {
  const lower = text.toLowerCase();
  if (["cheap", "cheapest", "kammi-a", "sasta", "sasti", "low price", "lowest price", "budget"].some((w) => lower.includes(w))) {
    return "cheapest";
  }
  if (["fast", "fastest", "quick", "fast-a", "shortest", "shortest duration", "minimum duration"].some((w) => lower.includes(w))) {
    return "fastest";
  }
  if (["earliest", "early", "jaldi"].some((w) => lower.includes(w))) {
    return "earliest";
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

  // 0. Check for Booking and Follow-up Actions
  const isBooking = /\b(book|reserve|booking)\b/i.test(lower) && !/\b(search|find|show|paathu|dikhao)\b/i.test(lower);
  const isBookingAction =
    isBooking ||
    /\b(confirm\s+booking|book\s+karo|book\s+pannu|ticket\s+book|book\s+this|book\s+it)\b/i.test(lower);

  if (isBookingAction) {
    let targetIndex = 0;
    if (/\b(second|2nd|rendavathu|dusra)\b/i.test(lower)) targetIndex = 1;
    else if (/\b(third|3rd|moonravathu|teesra)\b/i.test(lower)) targetIndex = 2;

    let itemType: "bus" | "train" | "flight" | "cab" | "product" = "bus";
    if (/\btrain\b/i.test(lower)) itemType = "train";
    else if (/\bflight\b/i.test(lower)) itemType = "flight";
    else if (/\b(cab|taxi)\b/i.test(lower)) itemType = "cab";
    else if (/\b(product|item|headphone|shoes|watch|laptop)\b/i.test(lower)) itemType = "product";

    return {
      intent: "booking_action",
      action: "book",
      target_item_index: targetIndex,
      item_type: itemType,
      language,
      message: cleanText,
    };
  }

  // Check for Explainability request: e.g. "Why did you recommend this?" / "Why this option?"
  if (
    /\b(why\s+(?:did\s+you\s+)?recommend|why\s+this|yen\s+idha|kyun\s+ye|explain\s+(?:this|recommendation))\b/i.test(lower)
  ) {
    return {
      intent: "booking_action",
      action: "explain",
      language,
      message: cleanText,
    };
  }

  // Check for general greetings
  if (["hi", "hello", "hey", "vanakkam", "namaste", "good morning", "good evening", "how are you"].includes(lower)) {
    return {
      intent: "general_chat",
      message: cleanText,
      language,
    };
  }

  // -------------------------------------------------------------
  // MULTI-DOMAIN DECOMPOSITION DETECTION
  // Check if the query asks for Travel + Product + Web, or any 2-domain pair.
  // -------------------------------------------------------------
  const [citiesOrig, citiesDest] = extractCities(cleanText);
  const hasCities = Boolean(citiesOrig && citiesDest);
  const hasTravelMarkers = hasCities || /\b(train|bus|flight|ticket|tickets|journey|from\s+[a-zA-Z]+\s+to\s+[a-zA-Z]+|la\s+irundhu\s+[a-zA-Z]+\s+ku|se\s+[a-zA-Z]+\s+tak)\b/i.test(lower);

  const productRegex = /\b(power\s*bank|headphones?|earphones?|earbuds|smart\s*watch|shoes?|sneakers?|running\s+shoes|laptop|laptops|charger|mobile|phone)\b/i;
  const hasProduct = productRegex.test(lower) || (/\b(buy|purchase|order)\b/i.test(lower) && !hasTravelMarkers);

  const webRegex = /\b(places\s+to\s+visit|tourist\s+(?:places|spots)|things\s+to\s+do|what\s+are\s+the\s+best\s+places|sightseeing|good\s+for\s+coding|which\s+laptops\s+are\s+good|latest\s+news|what\s+happened|who\s+is|weather\s+in|enna\s+places\s+visit\s+panna\s+mudiyum|best\s+places)\b/i;
  const hasWeb = webRegex.test(lower) || (cleanText.includes("?") && (hasTravelMarkers || hasProduct));

  // Count active domains
  const activeDomains: ("travel" | "product" | "web")[] = [];
  if (hasTravelMarkers) activeDomains.push("travel");
  if (hasProduct) activeDomains.push("product");
  if (hasWeb) activeDomains.push("web");

  if (activeDomains.length >= 2) {
    // We have a multi-domain query!
    const result: Intent = {
      intent: "multi_domain_search",
      domains: activeDomains,
      language,
      message: cleanText,
    };

    // 1. Decompose Travel Sub-Intent
    if (activeDomains.includes("travel")) {
      const travelTransport = extractTransportType(cleanText);
      const [travelDate, travelTime] = extractDateAndTime(cleanText);
      const travelPref = extractPreference(cleanText);

      // Extract travel-specific budget (e.g. "bus under 1000")
      let travelBudget: number | null = null;
      const travelBudgetMatch = lower.match(/(?:bus|train|flight|ticket)[^,.]*?(?:under|kulla|below|less\s+than|budget)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i) ||
                                lower.match(/(?:under|kulla|below)\s*(?:rs\.?|inr|₹)?\s*(\d+)[^,.]*?(?:bus|train|flight|ticket)/i);
      if (travelBudgetMatch) {
        travelBudget = parseFloat(travelBudgetMatch[1]);
      }

      result.travel = {
        origin: citiesOrig || "Chennai",
        destination: citiesDest || "Bengaluru",
        transport_type: travelTransport || (lower.includes("bus") ? "bus" : lower.includes("train") ? "train" : null),
        date: travelDate || "tomorrow",
        time: travelTime,
        preference: travelPref || (lower.includes("cheap") || lower.includes("sasta") ? "cheapest" : null),
        budget: travelBudget,
      };

      // Set top-level legacy travel fields for backward compatibility
      result.origin = result.travel.origin;
      result.destination = result.travel.destination;
      result.transport_type = result.travel.transport_type;
      result.date = result.travel.date;
    }

    // 2. Decompose Product Sub-Intent
    if (activeDomains.includes("product")) {
      let prodName = "power bank";
      const pMatch = lower.match(productRegex);
      if (pMatch) {
        prodName = pMatch[0];
      }

      // Extract product-specific budget (e.g. "power bank 1500 kulla" or "laptop under 50000")
      let prodBudget: number | null = null;
      const prodBudgetMatch =
        lower.match(/(?:power\s*bank|headphones?|laptop|smart\s*watch|shoes?)[^,.]*?(?:under|kulla|below|ke\s+andar|less\s+than)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i) ||
        lower.match(/(?:under|kulla|below|ke\s+andar)\s*(?:rs\.?|inr|₹)?\s*(\d+)[^,.]*?(?:power\s*bank|headphones?|laptop|smart\s*watch|shoes?)/i) ||
        lower.match(/(\d+)\s*(?:kulla|ke\s+andar|rupees|rs)\b[^,.]*?(?:power\s*bank|headphones?|laptop|smart\s*watch|shoes?)/i) ||
        lower.match(/(?:power\s*bank|headphones?|laptop|smart\s*watch|shoes?)[^,.]*?(\d+)\s*(?:kulla|ke\s+andar)/i);

      if (prodBudgetMatch) {
        prodBudget = parseFloat(prodBudgetMatch[1]);
      } else {
        // General budget fallback if not captured by travel
        const genBudget = extractBudget(cleanText);
        if (genBudget && (!result.travel || result.travel.budget !== genBudget)) {
          prodBudget = genBudget;
        }
      }

      result.product = {
        product: prodName,
        category: ["shoes", "sneakers"].includes(prodName) ? "fashion" : "electronics",
        budget: prodBudget,
        preference: lower.includes("cheap") || lower.includes("sasta") ? "cheapest" : null,
      };
      result.product_name = prodName;
    }

    // 3. Decompose Web Sub-Intent
    if (activeDomains.includes("web")) {
      let webQuery = "";
      const destCity = result.travel?.destination || "Bangalore";

      if (/places\s+to\s+visit|tourist|things\s+to\s+do|enna\s+places\s+visit/i.test(lower)) {
        webQuery = `Best places to visit in ${destCity}`;
      } else if (/which\s+laptops\s+are\s+good\s+for\s+coding/i.test(lower) || /good\s+for\s+coding/i.test(lower)) {
        webQuery = "Best laptops for coding and programming in India";
      } else {
        // Extract the web portion
        const parts = cleanText.split(/[,;&]|\band\b|\baprom\b|\baur\b/i);
        const webPart = parts.find((p) => webRegex.test(p) || p.includes("?"));
        if (webPart) {
          webQuery = webPart.trim().replace(/^and\s+/i, "");
          if (webQuery.toLowerCase().includes("there") && destCity) {
            webQuery = webQuery.replace(/there/gi, `in ${destCity}`);
          }
        } else {
          webQuery = `Latest information and tourist guide for ${destCity}`;
        }
      }

      result.web = {
        query: webQuery,
      };
      result.query = webQuery;
    }

    return result;
  }

  // -------------------------------------------------------------
  // SINGLE DOMAIN DETECTION (Legacy / Fallback flows)
  // -------------------------------------------------------------

  // 1. Travel Search Detection
  const [origin, destination] = extractCities(cleanText);
  const transport = extractTransportType(cleanText);
  const [date, rawTimePref] = extractDateAndTime(cleanText);
  const timeDetails = extractDepartureAndArrivalTimes(cleanText);
  const timePref = rawTimePref || timeDetails.timeSlot;
  const budget = extractBudget(cleanText);
  const pref = extractPreference(cleanText);

  const isTravelKeywords = [
    "train", "trains", "flight", "flights", "bus", "buses", "cab", "cabs", "taxi", "taxis", "uber", "ola",
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
      transport_type: transport || null,
      budget,
      language,
      requested_departure_time: timeDetails.requestedDepartureTime,
      requested_arrival_time: timeDetails.requestedArrivalTime,
    };
  }

  // 2. Product Search Detection
  const productKeywords = [
    "buy", "purchase", "headphones", "headphone", "earbuds", "earphones",
    "shoes", "smartwatch", "watch", "mobile", "phone", "laptop", "sneakers",
    "air max", "nike", "adidas", "puma", "boat", "sony", "apple", "iphone",
    "samsung", "oneplus", "gadget", "t-shirt", "shirt", "jeans", "power bank"
  ];
  const hasProductKeyword = productKeywords.some((k) => lower.includes(k));
  const isFindProduct = /^(?:find|search|show\s+me|get|order|shop|looking\s+for)\b/i.test(lower) && !isTravelKeywords && !origin && !destination;

  const isProductIntent =
    hasProductKeyword ||
    isFindProduct ||
    (lower.includes("chahiye") && ["ek", "accha", "under", "ke andar"].some((w) => lower.includes(w))) ||
    (lower.includes("dikhao") && budget !== null) ||
    (lower.includes("under") && ["shoes", "watch", "phone", "headphones", "sneakers", "laptop"].some((p) => lower.includes(p)));

  if (isProductIntent) {
    let productName = cleanText
      .replace(/^(?:find\s+me|find|search\s+for|search|show\s+me|buy\s+me|buy|purchase|get\s+me|get|order|tell\s+me\s+price\s+of|shop\s+for|view)\s+/i, "")
      .replace(/\b(?:under|ke\s+andar|below|budget|less\s+than)\s+(?:rs\.?|inr|₹)?\s*\d+\b/gi, "")
      .replace(/\b(?:cheap-?a?|sasta|sasti|accha|best|good|chahiye|paathu\s+sollu|dikhao|batao|karo)\b/gi, "")
      .trim();

    if (!productName) {
      for (const kw of ["power bank", "headphones", "headphone", "earbuds", "running shoes", "shoes", "smart watch", "watch", "phone", "laptop"]) {
        if (lower.includes(kw)) {
          productName = kw;
          break;
        }
      }
    }
    if (!productName) {
      productName = cleanText;
    }

    const isElectronics = ["power bank", "headphones", "headphone", "watch", "smartwatch", "phone", "mobile", "laptop", "earbuds", "earphones", "apple", "iphone", "samsung", "oneplus", "sony", "boat"].some((e) => lower.includes(e));
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
    "today", "information", "tell me about", "update", "updates", "karo", "places to visit", "things to do"
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
