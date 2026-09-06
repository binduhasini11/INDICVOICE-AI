import crypto from "crypto";
import { BookingDetails, ChatResponse, DomainResult, Intent, SearchResult } from "./types.js";
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

    // 2. Handle Booking and Explainability Actions
    if (rawIntent.intent === "booking_action") {
      const lastResults = session.getLastResults();

      if (rawIntent.action === "explain") {
        const topItem = lastResults[0];
        const naturalMsg = generateNaturalResponse(rawIntent, lastResults);
        session.addMessage("user", message);
        session.addMessage("assistant", naturalMsg);
        return {
          status: "success",
          message: naturalMsg,
          intent: rawIntent,
          results: lastResults,
          result_type: "explain",
          session_id: sid,
          needs_clarification: false,
        };
      }

      if (rawIntent.action === "book") {
        if (lastResults.length === 0) {
          const noOptionMsg =
            rawIntent.language === "ta-en"
              ? "Book panradhuku munnaadi, travel or product option search pannunga."
              : rawIntent.language === "hi-en"
              ? "Book karne se pehle kripya travel ya product option search karein."
              : "Please search for travel options or products before initiating a booking.";

          session.addMessage("user", message);
          session.addMessage("assistant", noOptionMsg);
          return {
            status: "needs_clarification",
            message: noOptionMsg,
            intent: rawIntent,
            results: [],
            result_type: "booking",
            session_id: sid,
            needs_clarification: true,
          };
        }

        const targetIdx = Math.min(rawIntent.target_item_index ?? 0, lastResults.length - 1);
        const bookedItem = lastResults[targetIdx] || lastResults[0];

        const confirmationMsg = generateNaturalResponse(rawIntent, [bookedItem]);
        session.addMessage("user", message);
        session.addMessage("assistant", confirmationMsg);

        return {
          status: "success",
          message: confirmationMsg,
          intent: rawIntent,
          results: [bookedItem],
          result_type: bookedItem.type || "travel",
          session_id: sid,
          needs_clarification: false,
        };
      }
    }

    // 3. Multi-Domain Execution Pipeline
    if (rawIntent.intent === "multi_domain_search") {
      session.addMessage("user", message);
      const activeDomains = rawIntent.domains || ["travel", "product", "web"];
      const domainResultsList: DomainResult[] = [];
      const aggregatedResults: SearchResult[] = [];

      const promises: Promise<any>[] = [];

      // A. Travel search task
      if (activeDomains.includes("travel") && rawIntent.travel) {
        promises.push(
          (async () => {
            try {
              const raw = searchTravel({
                origin: rawIntent.travel!.origin || "Chennai",
                destination: rawIntent.travel!.destination || "Bengaluru",
                travel_date: rawIntent.travel!.date,
                time_preference: rawIntent.travel!.time,
                max_price: rawIntent.travel!.budget,
                preference: rawIntent.travel!.preference,
                transport_type: rawIntent.travel!.transport_type,
              });
              const ranked = rankResults(raw, rawIntent.travel!.preference, rawIntent.travel);
              const topPick = ranked[0];
              const summary = `${ranked.length} options found (Lowest: ₹${topPick?.price ?? "N/A"})`;
              domainResultsList.push({
                domain: "travel",
                title: `Travel: ${rawIntent.travel!.origin} → ${rawIntent.travel!.destination}`,
                summary,
                why_recommended: topPick?.recommendation_reason || "Selected for optimal fare & route",
                results: ranked.slice(0, 4),
              });
              aggregatedResults.push(...ranked.slice(0, 3));
            } catch (err) {
              console.error("Multi-domain Travel specialist error:", err);
            }
          })()
        );
      }

      // B. Product search task
      if (activeDomains.includes("product") && rawIntent.product) {
        const prodObj = typeof rawIntent.product === "object" ? rawIntent.product : { product: rawIntent.product };
        promises.push(
          (async () => {
            try {
              const raw = searchProducts({
                query: prodObj.product || "power bank",
                category: prodObj.category,
                max_price: prodObj.budget,
                preference: prodObj.preference,
              });
              const ranked = rankResults(raw, prodObj.preference);
              const topPick = ranked[0];
              const summary = `${ranked.length} picks found (Top: ₹${topPick?.price ?? "N/A"})`;
              domainResultsList.push({
                domain: "product",
                title: `Products: ${prodObj.product || "Recommendations"}`,
                summary,
                why_recommended: topPick?.recommendation_reason || "Best rated value under budget",
                results: ranked.slice(0, 4),
              });
              aggregatedResults.push(...ranked.slice(0, 3));
            } catch (err) {
              console.error("Multi-domain Product specialist error:", err);
            }
          })()
        );
      }

      // C. Web search task
      if (activeDomains.includes("web") && rawIntent.web) {
        promises.push(
          (async () => {
            try {
              const raw = await searchWeb(rawIntent.web!.query || `Places to visit in ${rawIntent.travel?.destination || "Bangalore"}`);
              const ranked = rankResults(raw, "rating");
              domainResultsList.push({
                domain: "web",
                title: `Web Insights & Highlights`,
                summary: `${ranked.length} articles and guides retrieved`,
                why_recommended: "Verified travel and visitor guide",
                results: ranked.slice(0, 4),
              });
              aggregatedResults.push(...ranked.slice(0, 3));
            } catch (err) {
              console.error("Multi-domain Web specialist error:", err);
            }
          })()
        );
      }

      await Promise.allSettled(promises);

      // Order domains consistently: travel, product, web
      const order = ["travel", "product", "web"];
      domainResultsList.sort((a, b) => order.indexOf(a.domain) - order.indexOf(b.domain));

      const naturalResponse = generateNaturalResponse(rawIntent, aggregatedResults, false, null, domainResultsList);

      session.updateIntent(rawIntent);
      session.updateResults(aggregatedResults, domainResultsList);
      session.addMessage("assistant", naturalResponse);

      return {
        status: "success",
        message: naturalResponse,
        intent: rawIntent,
        domains: domainResultsList,
        results: aggregatedResults,
        result_type: "multi_domain",
        session_id: sid,
        needs_clarification: false,
      };
    }

    // 4. Merge Multi-turn Context Memory for Single-domain flows
    const intent = memoryManager.mergeIntentContext(sid, rawIntent, message);
    const intentType = intent.intent || "general_chat";

    // 5. Validate Required Parameters
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

    // 6. Route and Execute Single Specialist
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
          requested_departure_time: intent.requested_departure_time,
          requested_arrival_time: intent.requested_arrival_time,
        });
        results = rankResults(rawResults, intent.preference, intent);
        resultType = "travel";
      } else if (intentType === "product_search") {
        const prodQuery = typeof intent.product === "string" ? intent.product : intent.product?.product || intent.query || "products";
        const rawResults = searchProducts({
          query: prodQuery,
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

    // 7. Generate Natural Multilingual Response
    const naturalResponse = generateNaturalResponse(intent, results);

    // 8. Save Turn in Memory
    session.updateIntent(intent);
    session.updateResults(results);
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

