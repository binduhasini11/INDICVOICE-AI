import { Intent, SearchResult, DomainResult, BookingDetails } from "./types.js";

export function generateNaturalResponse(
  intent: Intent,
  results: SearchResult[],
  needsClarification = false,
  clarificationQuestion?: string | null,
  domains?: DomainResult[],
  booking?: BookingDetails | null
): string {
  const lang = intent.language || "en";
  const intentType = intent.intent || "general_chat";

  if (needsClarification && clarificationQuestion) {
    return clarificationQuestion;
  }

  // Booking action response
  if (intentType === "booking_action") {
    if (intent.action === "explain") {
      const topItem = results[0];
      if (topItem) {
        const reason = topItem.recommendation_reason || "it offers the best combination of price and reliability";
        if (lang === "ta-en") {
          return `Indha option yen recommend pannen na: ${reason}. Fare: ₹${topItem.price || "N/A"}, operator: ${topItem.source || "Verified"}.`;
        } else if (lang === "hi-en") {
          return `Maine ye option isliye recommend kiya kyunki: ${reason}. Fare ₹${topItem.price || "N/A"} aur timings best hain.`;
        } else {
          return `I recommended this option because: ${reason}. It provides optimal value on this route.`;
        }
      }
      return "I selected the top recommendation based on price efficiency, duration, and verified ratings.";
    }

    if (intent.action === "book") {
      const topItem = results[0];
      if (topItem) {
        if (lang === "ta-en") {
          return `Ungaloda option: ${topItem.title} (₹${topItem.price || "N/A"}). Official ${topItem.source || "portal"} booking link keela ready-a irukku, adhai click panni ticket book pannikonga!`;
        } else if (lang === "hi-en") {
          return `Aapki selected option: ${topItem.title} (₹${topItem.price || "N/A"}). Neeche diye gaye official ${topItem.source || "portal"} booking link par click karke direct book karein.`;
        } else {
          return `Here is your booking option for ${topItem.title} (₹${topItem.price || "N/A"}). Click the official booking link below to proceed with your booking on ${topItem.source || "the provider portal"}.`;
        }
      }
      return "Click the booking link on your chosen option below to book directly.";
    }
  }

  // Multi-Domain Response (Travel + Product + Web)
  if (intentType === "multi_domain_search" && domains && domains.length > 0) {
    const travelDomain = domains.find((d) => d.domain === "travel");
    const productDomain = domains.find((d) => d.domain === "product");
    const webDomain = domains.find((d) => d.domain === "web");

    if (lang === "ta-en") {
      const parts: string[] = [];
      if (travelDomain && travelDomain.results.length > 0) {
        const t = travelDomain.results[0];
        parts.push(`Travel-ku ${travelDomain.results.length} options iruku, top pick ${t.title} (₹${t.price})`);
      }
      if (productDomain && productDomain.results.length > 0) {
        const p = productDomain.results[0];
        parts.push(`Product-ku ${p.title} (₹${p.price}) nalla choice`);
      }
      if (webDomain && webDomain.results.length > 0) {
        parts.push(`Aprom visit panna best spots and web updates eduthuten`);
      }
      return `Super! Unga multi-domain query-ku ellam ready: ${parts.join("; ")}. Keela ellathayum check pannunga!`;
    } else if (lang === "hi-en") {
      const parts: string[] = [];
      if (travelDomain && travelDomain.results.length > 0) {
        const t = travelDomain.results[0];
        parts.push(`Travel ke liye ${travelDomain.results.length} options mile, best choice: ${t.title} (₹${t.price})`);
      }
      if (productDomain && productDomain.results.length > 0) {
        const p = productDomain.results[0];
        parts.push(`Product ke liye ${p.title} (₹${p.price}) sabse accha option hai`);
      }
      if (webDomain && webDomain.results.length > 0) {
        parts.push(`Aur places to visit ki details bhi dhundh li hain`);
      }
      return `Badhiya! Aapki combined query ke saare results ready hain: ${parts.join("; ")}. Neeche details dekhein!`;
    } else {
      const parts: string[] = [];
      if (travelDomain && travelDomain.results.length > 0) {
        const t = travelDomain.results[0];
        parts.push(`Travel: ${travelDomain.results.length} options found (Top pick: ${t.title} at ₹${t.price})`);
      }
      if (productDomain && productDomain.results.length > 0) {
        const p = productDomain.results[0];
        parts.push(`Product: ${p.title} (₹${p.price})`);
      }
      if (webDomain && webDomain.results.length > 0) {
        parts.push(`Web: ${webDomain.results.length} attractions & guides retrieved`);
      }
      return `I've coordinated your multi-domain request across Travel, Products, and Web Search: ${parts.join(" • ")}. Explore each section below!`;
    }
  }

  // Single Domain Responses
  if (intentType === "travel_search") {
    const origin = intent.origin || "origin";
    const destination = intent.destination || "destination";
    const transport = intent.transport_type || "travel";
    const count = results.length;

    if (count === 0) {
      const transLabel = transport === "bus" ? "buses" : transport === "train" ? "trains" : transport === "flight" ? "flights" : "travel options";
      if (lang === "ta-en") {
        return `Mannikavum, ${origin} la irundhu ${destination} ku ${transport} options kedaikala.`;
      } else if (lang === "hi-en") {
        return `Maaf kijiye, ${origin} se ${destination} ke liye koi ${transport} option nahi mila.`;
      } else {
        return `Sorry, I couldn't find any ${transLabel} from ${origin} to ${destination}. No ${transLabel} found for ${origin} → ${destination}.`;
      }
    }

    if (lang === "ta-en") {
      return `Naan ${origin} la irundhu ${destination} ku ${count} ${transport} options kandupidichuten. Keela check pannunga!`;
    } else if (lang === "hi-en") {
      return `Maine ${origin} se ${destination} ke liye ${count} ${transport} options dhundhe hain. Neeche details dekhein.`;
    } else {
      return `I found ${count} ${transport} options from ${origin} to ${destination} matching your preferences.`;
    }
  } else if (intentType === "product_search") {
    const itemName = intent.product || "products";
    const count = results.length;

    if (count === 0) {
      if (lang === "hi-en") {
        return `Maaf kijiye, aapke budget mein koi ${itemName} nahi mila.`;
      } else if (lang === "ta-en") {
        return `Unga budget kulla ${itemName} kedaikala.`;
      } else {
        return `I couldn't find any ${itemName} within the specified criteria.`;
      }
    }

    if (lang === "hi-en") {
      return `Aapke liye ${count} badhiya ${itemName} options mile hain. Neeche check karein.`;
    } else if (lang === "ta-en") {
      return `Ungalukaga ${count} nalla ${itemName} options iruku. Keela paarunga.`;
    } else {
      return `I found ${count} great ${itemName} options for you.`;
    }
  } else if (intentType === "web_search") {
    const q = intent.query || "topic";
    const count = results.length;
    if (count === 0) {
      return `No recent web updates found for '${q}'.`;
    }
    return `Here is the latest information regarding '${q}'.`;
  } else if (intentType === "general_chat") {
    if (lang === "ta-en") {
      return "Vanakkam! Naan unga IndicVoice AI assistant. Travel tickets, products, or web updates keka ungalukku naan help panren.";
    } else if (lang === "hi-en") {
      return "Namaste! Main aapka IndicVoice AI assistant hoon. Travel tickets, products ya news ke bare mein batayein, main madad karunga.";
    } else {
      return "Hello! I am your IndicVoice AI assistant. You can ask me about travel bookings, products, or search information in English, Tamil, or Hindi.";
    }
  }

  return "How else may I help you today?";
}

