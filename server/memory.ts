import { Intent, SearchResult } from "./types.js";
import { extractCities } from "./intent.js";

export class SessionMemory {
  sessionId: string;
  messages: { role: string; content: string }[] = [];
  lastIntent: Intent | null = null;
  lastResults: SearchResult[] = [];
  lastDomains: any[] = [];

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  addMessage(role: string, content: string) {
    this.messages.push({ role, content });
  }

  updateIntent(intent: Intent) {
    this.lastIntent = intent;
  }

  updateResults(results: SearchResult[], domains?: any[]) {
    this.lastResults = results || [];
    if (domains) this.lastDomains = domains;
  }

  getContext(): Intent | null {
    return this.lastIntent;
  }

  getLastResults(): SearchResult[] {
    return this.lastResults;
  }
}

export class MemoryManager {
  private sessions: Map<string, SessionMemory> = new Map();

  getOrCreateSession(sessionId: string): SessionMemory {
    const sid = sessionId || "default";
    if (!this.sessions.has(sid)) {
      this.sessions.set(sid, new SessionMemory(sid));
    }
    return this.sessions.get(sid)!;
  }

  mergeIntentContext(sessionId: string, currentIntent: Intent, rawMessage: string): Intent {
    const session = this.getOrCreateSession(sessionId);
    const prevIntent = session.getContext();

    if (!prevIntent) {
      return currentIntent;
    }

    const currType = currentIntent.intent;
    const prevType = prevIntent.intent;

    // Check if user explicitly switched to a distinct intent
    if (["travel_search", "product_search", "web_search"].includes(currType)) {
      if (["travel_search", "product_search", "web_search"].includes(prevType) && currType !== prevType) {
        return currentIntent;
      }
    }

    // If current intent is general_chat or same intent, check if message provides missing slots
    if (currType === "general_chat" && ["travel_search", "product_search"].includes(prevType)) {
      const merged: Intent = { ...prevIntent };
      const lower = rawMessage.toLowerCase();

      if (prevType === "travel_search") {
        if (lower.includes("bus")) {
          merged.transport_type = "bus";
        } else if (lower.includes("train")) {
          merged.transport_type = "train";
        } else if (lower.includes("flight")) {
          merged.transport_type = "flight";
        }

        if (["tomorrow", "naalaiku", "kal"].some((w) => lower.includes(w))) {
          merged.date = "tomorrow";
        } else if (["today", "innaiku", "aaj"].some((w) => lower.includes(w))) {
          merged.date = "today";
        }

        if (["morning", "kaalai", "subah"].some((w) => lower.includes(w))) {
          merged.time = "morning";
        } else if (["evening", "maalai", "shaam"].some((w) => lower.includes(w))) {
          merged.time = "evening";
        } else if (["night", "raathri", "raat"].some((w) => lower.includes(w))) {
          merged.time = "night";
        }

        if (["cheap", "cheapest", "sasta", "kammi-a"].some((w) => lower.includes(w))) {
          merged.preference = "cheapest";
        } else if (["fast", "fastest", "early", "earliest"].some((w) => lower.includes(w))) {
          merged.preference = "fastest";
        }

        const [o, d] = extractCities(rawMessage);
        if (o && !merged.origin) {
          merged.origin = o;
        }
        if (d && !merged.destination) {
          merged.destination = d;
        }

        return merged;
      } else if (prevType === "product_search") {
        if (["wireless", "bluetooth", "wired", "best", "cheap"].some((w) => lower.includes(w))) {
          merged.preference = rawMessage.trim();
        }
        return merged;
      }
    }

    // If same intent type, inherit un-filled fields from previous turn
    if (currType === prevType) {
      const merged: Intent = { ...prevIntent };
      for (const [k, v] of Object.entries(currentIntent)) {
        if (v !== undefined && v !== null) {
          merged[k] = v;
        }
      }
      return merged;
    }

    return currentIntent;
  }
}

export const memoryManager = new MemoryManager();
