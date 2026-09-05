import { Intent, SearchResult } from "./types.js";

export function generateNaturalResponse(
  intent: Intent,
  results: SearchResult[],
  needsClarification = false,
  clarificationQuestion?: string | null
): string {
  const lang = intent.language || "en";
  const intentType = intent.intent || "general_chat";

  if (needsClarification && clarificationQuestion) {
    return clarificationQuestion;
  }

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
