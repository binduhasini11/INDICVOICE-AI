# IndicVoice AI — Central Agent Architecture & Documentation

IndicVoice AI is an oral-first, multilingual AI assistant designed for Indian users speaking English, Tamil-English (Tanglish), Hindi-English (Hinglish), and code-switched dialects.

---

## 1. System Architecture

```
                               ┌────────────────────────┐
                               │   User Voice / Text    │
                               └───────────┬────────────┘
                                           │
                                           ▼
                               ┌────────────────────────┐
                               │     Frontend (React)   │
                               │  - Audio Capture / TTS │
                               │  - Client State Sync   │
                               │  - Session ID Store    │
                               └───────────┬────────────┘
                                           │ POST /agent/chat
                                           ▼
                   ┌───────────────────────────────────────────────┐
                   │          Central Agent Orchestrator           │
                   │  - Speech-to-Intent Extraction                │
                   │  - Multi-Turn Session Memory                  │
                   │  - Missing Parameter Validation               │
                   │  - Response Generation & Localization         │
                   └───────┬───────────────┬───────────────┬───────┘
                           │               │               │
            ┌──────────────┘               │               └──────────────┐
            ▼                              ▼                              ▼
 ┌─────────────────────┐        ┌─────────────────────┐        ┌─────────────────────┐
 │  Travel Specialist  │        │ Product Specialist  │        │   Web Specialist    │
 │  - Bus/Train/Flight │        │ - Multi-Store Search│        │ - Knowledge & News  │
 │  - IRCTC/Demo Data  │        │ - Price Comparison  │        │ - DuckDuckGo / Live │
 └──────────┬──────────┘        └──────────┬──────────┘        └──────────┬──────────┘
            │                              │                              │
            └──────────────────────────────┼──────────────────────────────┘
                                           ▼
                               ┌────────────────────────┐
                               │ Normalization & Ranking│
                               │  - Standard Contract   │
                               │  - Price / Time Sort   │
                               └───────────┬────────────┘
                                           │
                                           ▼
                               ┌────────────────────────┐
                               │ Natural Oral Response  │
                               │ (Tanglish/Hinglish/En) │
                               └────────────────────────┘
```

---

## 2. Agent Workflow

1. **User Input:** User speaks into microphone or types natural language in English, Tanglish, or Hinglish.
2. **Audio Transcription:** Audio is transcribed via Web Speech API or backend `/speech/transcribe`.
3. **API Dispatch:** Frontend sends `{ message, session_id }` to `POST /agent/chat`.
4. **Intent & Entity Extraction:**
   - Detects intent: `travel_search`, `product_search`, `web_search`, or `general_chat`.
   - Extracts origin, destination, transport type, date, time preference, budget, and language.
5. **Context Merging:** Checks `SessionMemory` for previous intent context.
   - If same topic: merges missing slots (e.g., user says "naalaiku morning" in turn 2).
   - If topic changes (e.g., from travel to headphones): clears previous context cleanly.
6. **Slot Validation:**
   - If required parameters are missing (e.g., origin or destination for travel), returns `status: "needs_clarification"` with a natural clarifying question.
7. **Specialist Delegation:** Calls the dedicated specialist tool (`TravelSpecialist`, `ProductSpecialist`, `WebSpecialist`).
8. **Result Normalization & Ranking:** Formats all results into standard schema, ranked by price, time, or rating.
9. **Localized Oral Response:** Crafts a friendly conversational reply matching the user's dialect.
10. **Memory Persistence:** Updates conversational history and intent state for the session.

---

## 3. Routing Table

| Intent | Triggers & Markers | Specialist Tool | Result Type |
|---|---|---|---|
| `travel_search` | `train`, `bus`, `flight`, `ticket`, `Chennai la irundhu`, `Delhi se`, `to`, `naalaiku` | `TravelSpecialist` | `travel` |
| `product_search` | `buy`, `headphones`, `shoes`, `smartwatch`, `under 5000`, `ke andar`, `sasta` | `ProductSpecialist` | `product` |
| `web_search` | `news`, `latest`, `ISRO`, `update`, `search karo`, `what is`, `who is` | `WebSpecialist` | `web` |
| `general_chat` | `vanakkam`, `namaste`, `hello`, `hi`, `how are you` | `CentralOrchestrator` | `chat` |

---

## 4. Normalized Result Schema

All specialist search tools return normalized items adhering to this contract:

```json
{
  "type": "travel | product | web",
  "title": "Shatabdi Express",
  "description": "Train from Chennai to Bengaluru (06:00 - 10:30)",
  "price": 450.0,
  "currency": "INR",
  "source": "IRCTC",
  "url": "https://www.irctc.co.in",
  "image": "https://... (optional for products)",
  "metadata": {
    "origin": "Chennai",
    "destination": "Bengaluru",
    "transport": "train",
    "departure": "06:00",
    "arrival": "10:30"
  }
}
```

---

## 5. Multi-turn Memory Behavior

- **Session Isolation:** Each client session has an isolated `SessionMemory` state keyed by UUID.
- **Context Merging:** If a user follows up with slot details (e.g. `naalaiku morning` or `only buses`), slots merge into the active intent without re-prompting for existing information.
- **Topic Switching:** If the user switches topics (e.g., asking for headphones after searching trains), the orchestrator resets travel entities to avoid corrupting product searches with city names.
- **Expiry:** In-memory sessions automatically expire after 1 hour of inactivity.

---

## 6. Code-Switching & Multilingual Support

IndicVoice AI natively processes code-switched queries:

1. **Tamil-English (Tanglish):**
   - *"Chennai la irundhu Bangalore ku naalaiku morning cheap-a train paathu sollu"*
   - Extracted: `origin: Chennai`, `destination: Bangalore`, `date: tomorrow`, `time: morning`, `preference: cheapest`, `transport: train`, `lang: ta-en`.
   - Response: *"Naan Chennai la irundhu Bangalore ku 2 train options kandupidichuten!"*

2. **Hindi-English (Hinglish):**
   - *"Delhi se Mumbai kal subah cheapest flight chahiye"*
   - Extracted: `origin: Delhi`, `destination: Mumbai`, `date: tomorrow`, `time: morning`, `preference: cheapest`, `transport: flight`, `lang: hi-en`.
   - Response: *"Maine Delhi se Mumbai ke liye 1 flight option dhundha hai."*

3. **English:**
   - *"Find me wireless headphones under 5000"*
   - Extracted: `product: headphones`, `budget: 5000`, `category: electronics`, `lang: en`.

---

## 7. API Contract (`POST /agent/chat`)

### Request
```json
{
  "message": "Chennai la irundhu Bangalore ku naalaiku morning cheap-a train paathu sollu",
  "session_id": "c165d21a-428a-40a2-9426-302a39219b10"
}
```

### Response (Success)
```json
{
  "status": "success",
  "message": "Naan Chennai la irundhu Bangalore ku 2 train options kandupidichuten!",
  "intent": {
    "intent": "travel_search",
    "origin": "Chennai",
    "destination": "Bengaluru",
    "transport_type": "train",
    "date": "tomorrow",
    "time": "morning",
    "preference": "cheapest",
    "language": "ta-en"
  },
  "results": [ ... ],
  "result_type": "travel",
  "session_id": "c165d21a-428a-40a2-9426-302a39219b10",
  "needs_clarification": false
}
```

### Response (Needs Clarification)
```json
{
  "status": "needs_clarification",
  "message": "Enga irundhu Bangalore ku poganum? (Which city are you travelling from?)",
  "intent": {
    "intent": "travel_search",
    "destination": "Bengaluru",
    "language": "ta-en"
  },
  "results": [],
  "result_type": null,
  "session_id": "c165d21a-428a-40a2-9426-302a39219b10",
  "needs_clarification": true
}
```

---

## 8. Verification & Running Commands

### Running Type-Check & Linter:
```bash
npm run lint
```

### Running the Full-Stack Dev Server:
```bash
npm run dev
```

### Building for Production:
```bash
npm run build
```
