import crypto from "crypto";
import { ChatResponse, Intent, SearchResult } from "./types.js";
import { extractIntent } from "./intent.js";
import { memoryManager } from "./memory.js";
import { searchTravel } from "./tools/travelSearch.js";
import { searchProducts } from "./tools/productSearch.js";
import { searchWeb } from "./tools/webSearch.js";
import { rankResults } from "./ranking.js";
import { generateNaturalResponse } from "./response.js";

export class CentralOrchestrator {
  async processMessage(message: string, sessionId?: string | null): Promise<ChatResponse> {
    const sid = sessionId || crypto.randomUUID();
    const session = memoryManager.getOrCreateSession(sid);

    // 1. Intent & Entity Extraction
    const rawIntent = extractIntent(message);

    // 2. Merge Multi-turn Context Memory
    const intent = memoryManager.mergeIntentContext(sid, rawIntent, message);
    const intentType = intent.intent || "general_chat";

    // 3. Validate Required Parameters
    if (intentType === "travel_search") {
      const origin = intent.origin;
      const destination = intent.destination;

      if (!origin || !destination) {
        const lang = intent.language || "en";
        let clarification = "";

        if (!origin && !destination) {
          clarification =
            lang === "ta-en"
              ? "Enga irundhu enga poganum? (Where are you travelling from and to?)"
              : lang === "hi-en"
              ? "Kahan se kahan jaana chahte hain?"
              : "Where are you travelling from and where would you like to go?";
        } else if (!origin) {
          clarification =
            lang === "ta-en"
              ? `Enga irundhu ${destination} ku poganum? (Which city are you travelling from?)`
              : lang === "hi-en"
              ? `Kis city se ${destination} jaana chahte hain?`
              : `Which city are you travelling from to ${destination}?`;
        } else {
          clarification =
            lang === "ta-en"
              ? `${origin} la irundhu enga poganum? (Where would you like to travel to?)`
              : lang === "hi-en"
              ? `${origin} se kahan jaana chahte hain?`
              : `Where would you like to travel to from ${origin}?`;
        }

        session.updateIntent(intent);
        session.addMessage("user", message);
        session.addMessage("assistant", clarification);

        return {
          status: "needs_clarification",
          message: clarification,
          intent,
          results: [],
          result_type: null,
          session_id: sid,
          needs_clarification: true,
        };
      }
    }

    // 4. Route and Execute Specialist
    let results: SearchResult[] = [];
    let resultType: string | null = null;

    try {
      if (intentType === "travel_search") {
        const rawResults = searchTravel({
          origin: intent.origin!,
          destination: intent.destination!,
          travel_date: intent.date,
          time_preference: intent.time,
          max_price: intent.budget,
          preference: intent.preference,
          transport_type: intent.transport_type,
        });
        results = rankResults(rawResults, intent.preference);
        resultType = "travel";
      } else if (intentType === "product_search") {
        const rawResults = searchProducts({
          query: intent.product || intent.query,
          category: intent.category,
          max_price: intent.budget,
          preference: intent.preference,
        });
        results = rankResults(rawResults, intent.preference);
        resultType = "product";
      } else if (intentType === "web_search") {
        results = await searchWeb(intent.query || intent.message || message);
        resultType = "web";
      } else if (intentType === "general_chat") {
        results = [];
        resultType = "chat";
      } else {
        results = [];
        resultType = "unknown";
      }
    } catch (e: any) {
      console.error(`Error in specialist agent '${intentType}':`, e);
      const errResponse = "I encountered an issue retrieving results right now. Please try again.";
      session.addMessage("user", message);
      session.addMessage("assistant", errResponse);
      return {
        status: "error",
        message: errResponse,
        error_code: "SPECIALIST_EXECUTION_ERROR",
        intent,
        results: [],
        result_type: resultType || intentType.replace("_search", ""),
        session_id: sid,
        needs_clarification: false,
      };
    }

    // 5. Generate Natural Multilingual Response
    const naturalResponse = generateNaturalResponse(intent, results);

    // 6. Save Turn in Memory
    session.updateIntent(intent);
    session.addMessage("user", message);
    session.addMessage("assistant", naturalResponse);

    return {
      status: "success",
      message: naturalResponse,
      intent,
      results,
      result_type: resultType,
      session_id: sid,
      needs_clarification: false,
    };
  }
}

export const orchestrator = new CentralOrchestrator();
