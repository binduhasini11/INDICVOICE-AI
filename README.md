# 🎙️ IndicVoice AI — Oral-First Multilingual Assistant for India

> **Live Demo:** [https://indicvoice-ai-us2y.onrender.com/](https://indicvoice-ai-us2y.onrender.com/)  
> **Repository:** [https://github.com/binduhasini11/INDICVOICE-AI](https://github.com/binduhasini11/INDICVOICE-AI)

IndicVoice AI is an oral-first, voice-driven AI assistant engineered specifically for Indian users speaking **English**, **Tamil-English (Tanglish)**, **Hindi-English (Hinglish)**, and colloquial code-switched dialects. Instead of requiring users to navigate complex forms, multiple apps, or type out structured queries, IndicVoice AI understands conversational requests and coordinates searches across travel, e-commerce, and regional information in a single turn.

---

## 🌟 Live Application & Demo

| Resource | Link |
|---|---|
| **Production Web App** | [https://indicvoice-ai-us2y.onrender.com/](https://indicvoice-ai-us2y.onrender.com/) |
| **Source Code** | [https://github.com/binduhasini11/INDICVOICE-AI](https://github.com/binduhasini11/INDICVOICE-AI) |
| **API Health Check** | `https://indicvoice-ai-us2y.onrender.com/health` |

---

## 💡 What Makes IndicVoice AI Different?

- **Oral-First, Code-Switching Architecture**: Understands natural colloquialisms like *"Chennai la irundhu Bangalore ku naalaiku morning cheap-a train paathu sollu"* (Tanglish) or *"Delhi se Jaipur kal subah cheap bus chahiye"* (Hinglish).
- **Multi-Domain Intelligence (1 Request → 3 Needs)**: A single query can coordinate travel bookings, product comparisons, and local sightseeing simultaneously (e.g. *"Chennai to Bangalore bus, a power bank under ₹1500, and places to visit"*).
- **Direct Official Booking & Store Links**: Deep links directly to verified booking channels (RedBus, IRCTC, MakeMyTrip) and verified marketplaces (Amazon, Flipkart).
- **"Why This One?" Explainability**: Every recommended card includes reasoning based on price, departure timings, user budget limits, ratings, and verified seat availability.
- **Session Memory & Conversational Refinement**: Contextually updates travel dates, transport types, or budget constraints without re-asking for already provided parameters.

---

## 🚀 Key Features

1. **Voice & Text Input Modes**
   - Single-tap microphone with acoustic waveform indicator and fallback audio transcription.
   - Low-friction text input for noisy environments or typing preference.
2. **Specialized Search Coordinators**
   - **Travel Specialist**: Intercity bus, train, and flight routes with departure/arrival timings, durations, seat availability, and operator verification.
   - **Product Specialist**: Multi-store price comparison with budget thresholds, buyer review scores, and category tags.
   - **Web & Local Specialist**: Real-time guides, regional sightseeing suggestions, and web intelligence.
3. **Conversational Feedback**
   - Spoken audio output (TTS) with read-aloud controls and native localized replies.
   - Understanding cards outlining extracted slots (origin, destination, date, transport type, budget, detected language).
4. **Contextual Refinement Bar**
   - Quick one-tap follow-up chips: *“⚡ Fastest option”*, *“💰 Under ₹800”*, *“🚌 Only buses”*, *“💡 Why this recommendation?”*.

---

## 🏛️ System Architecture

```text
                               ┌────────────────────────┐
                               │   User Voice / Text    │
                               └───────────┬────────────┘
                                           │
                                           ▼
                               ┌────────────────────────┐
                               │     Frontend (React)   │
                               │  - Audio Capture / TTS │
                               │  - State & Memory Sync │
                               │  - Multi-Domain View   │
                               └───────────┬────────────┘
                                           │ POST /agent/chat
                                           ▼
                   ┌───────────────────────────────────────────────┐
                   │          Central Agent Orchestrator           │
                   │  - Speech-to-Intent Extraction                │
                   │  - Multi-Turn Session Memory (UUID)           │
                   │  - Missing Parameter Validation               │
                   │  - Response Localization & TTS Formulation    │
                   └───────┬───────────────┬───────────────┬───────┘
                           │               │               │
            ┌──────────────┘               │               └──────────────┐
            ▼                              ▼                              ▼
 ┌─────────────────────┐        ┌─────────────────────┐        ┌─────────────────────┐
 │  Travel Specialist  │        │ Product Specialist  │        │   Web Specialist    │
 │  - Bus / Train / Air│        │ - Multi-Store Search│        │ - Knowledge & News  │
 │  - RedBus / IRCTC   │        │ - Price Comparison  │        │ - Local Sightseeing │
 └──────────┬──────────┘        └──────────┬──────────┘        └──────────┬──────────┘
            │                              │                              │
            └──────────────────────────────┼──────────────────────────────┘
                                           ▼
                               ┌────────────────────────┐
                               │ Normalization & Ranking│
                               │  - Standard Schema     │
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

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, DM Sans Typography, Responsive Tailwind & CSS Systems, Web Speech API.
- **Backend / Server**: Node.js / Express (or FastAPI Python service), Multer audio buffer handling.
- **AI & Language Processing**: Indic Code-Switching NLU, Sarvam AI / Gemini / Tavily integration.
- **Deployment Platform**: Render ([https://indicvoice-ai-us2y.onrender.com/](https://indicvoice-ai-us2y.onrender.com/)).

---

## 📋 Example Queries to Try

| Query Type | Example Sentence | Dialect |
|---|---|---|
| **Multi-Domain (Signature)** | *"Chennai la irundhu Bangalore ku tomorrow cheap bus venum, oru power bank 1500 kulla venum, and Bangalore la enna places visit panna mudiyum?"* | Tanglish |
| **Travel (Train)** | *"Chennai la irundhu Bangalore ku naalaiku morning cheap-a train paathu sollu"* | Tanglish |
| **Travel (Bus)** | *"Delhi se Jaipur kal subah cheapest bus chahiye"* | Hinglish |
| **Shopping** | *"50000 kulla coding-ku laptop venum"* | Tanglish |
| **Refinement** | *"Only the fastest one"* or *"Under 800 budget"* | English / Mixed |

---

## 💻 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/binduhasini11/INDICVOICE-AI.git
cd INDICVOICE-AI
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Add your service keys:
```env
SARVAM_API_KEY=your_sarvam_key
TAVILY_API_KEY=your_tavily_key
VITE_API_BASE_URL=
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Dev Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 📡 API Reference

### `POST /agent/chat`
Processes conversational voice or text prompts and coordinates specialized searches.

**Request Payload:**
```json
{
  "message": "Chennai la irundhu Bangalore ku tomorrow cheap bus venum",
  "session_id": "c165d21a-428a-40a2-9426-302a39219b10"
}
```

**Response Payload:**
```json
{
  "status": "success",
  "message": "Naan Chennai la irundhu Bangalore ku 2 bus options kandupidichuten!",
  "intent": {
    "intent": "travel_search",
    "origin": "Chennai",
    "destination": "Bangalore",
    "transport_type": "bus",
    "date": "tomorrow",
    "language": "ta-en"
  },
  "results": [
    {
      "type": "travel",
      "title": "KSRTC Airavat Club Class",
      "price": 650,
      "currency": "INR",
      "source": "RedBus",
      "url": "https://www.redbus.in/bus-tickets/chennai-to-bangalore",
      "metadata": {
        "origin": "Chennai",
        "destination": "Bangalore",
        "transport": "bus",
        "departure": "21:30",
        "arrival": "04:30",
        "duration": "7h 00m",
        "available_seats": 14
      }
    }
  ],
  "result_type": "travel",
  "session_id": "c165d21a-428a-40a2-9426-302a39219b10",
  "needs_clarification": false
}
```

---

## 👥 Team TECHTONIC

Built collaboratively by **TECHTONIC** with a focus on oral-first accessibility for the next billion digital users in India.
