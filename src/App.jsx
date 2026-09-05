import { useState, useEffect, useRef } from "react";
import VoiceButton from "./components/VoiceButton";
import Transcript from "./components/Transcript";
import IntentCard from "./components/IntentCard";
import SearchStatus from "./components/SearchStatus";
import ResultCard from "./components/ResultCard";
import ChatMessage from "./components/ChatMessage";
import { sendAgentMessage } from "./api";
import "./App.css";

function App() {
  // Session ID management - persisted in sessionStorage
  const [sessionId] = useState(() => {
    try {
      const stored = sessionStorage.getItem("indicvoice_session_id");
      if (stored) return stored;
      const newId = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem("indicvoice_session_id", newId);
      return newId;
    } catch (e) {
      return `session_${Date.now()}`;
    }
  });

  // Central Agent State Workflow
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Vanakkam & Namaste! I am IndicVoice AI. Speak naturally in Tamil-English, Hindi-English, or English for travel bookings, products, or web queries.",
    },
  ]);
  const [intent, setIntent] = useState(null);
  const [results, setResults] = useState([]);
  const [resultType, setResultType] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputQuery, setInputQuery] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const messagesEndRef = useRef(null);

  // Optional Text-To-Speech for oral-first experience
  const speakText = (text) => {
    if (!ttsEnabled) return;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("TTS playback error:", err);
      }
    }
  };

  /**
   * Process request through the Central AI Agent Orchestration layer.
   * NO local intent extraction or routing is performed in the frontend.
   */
  const processRequest = async (text) => {
    if (!text || !text.trim() || loading) return;

    const userMessage = text.trim();
    setTranscript(userMessage);
    setInputQuery("");
    setError("");

    // Add user turn to conversation history
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    setLoading(true);
    setStatus("Understanding...");

    try {
      // Step 1: Central agent pipeline executes on backend
      const response = await sendAgentMessage({
        message: userMessage,
        sessionId,
      });

      setStatus("Searching...");

      if (response.status === "error") {
        setError(response.message || "Failed to process request");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.message || "I encountered an issue processing your request.",
          },
        ]);
        setStatus("");
        setLoading(false);
        return;
      }

      // Step 2: Update state with normalized data from central agent
      setIntent(response.intent || null);
      setResults(response.results || []);
      setResultType(response.result_type || null);

      const assistantMsg = response.message || "I have processed your request.";
      setMessages((prev) => [...prev, { role: "assistant", content: assistantMsg }]);

      speakText(assistantMsg);
      setStatus(response.status === "needs_clarification" ? "Awaiting your response" : "Search complete");
    } catch (err) {
      console.error("Central agent communication error:", err);
      setError(err.message || "Could not connect to IndicVoice AI backend.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't reach the agent backend. Please try again.",
        },
      ]);
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const resetConversation = () => {
    try {
      const newId = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : `session_${Date.now()}`;
      sessionStorage.setItem("indicvoice_session_id", newId);
    } catch (e) {}
    setTranscript("");
    setIntent(null);
    setResults([]);
    setResultType(null);
    setStatus("");
    setError("");
    setMessages([
      {
        role: "assistant",
        content: "Session reset! What would you like to search today?",
      },
    ]);
  };

  const samplePrompts = [
    {
      label: "Tamil Travel",
      query: "Chennai la irundhu Bangalore ku naalaiku morning cheap-a train paathu sollu",
    },
    {
      label: "Hindi Travel",
      query: "Delhi se Mumbai kal subah cheapest flight chahiye",
    },
    {
      label: "Product Search",
      query: "5000 ke andar wireless headphones dikhao",
    },
    {
      label: "Web Search",
      query: "latest AI news search karo",
    },
  ];

  return (
    <div className="app" id="indicvoice-app">
      {/* HEADER */}
      <header className="header" id="app-header">
        <div className="brand">
          <div className="brand-icon">◉</div>
          <div>
            <h1>IndicVoice AI</h1>
            <p>Multilingual Voice-First Central Agent</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            style={{
              background: "transparent",
              border: "1px solid #333644",
              color: ttsEnabled ? "#a78bfa" : "#666",
              padding: "6px 12px",
              borderRadius: "16px",
              cursor: "pointer",
              fontSize: "12px",
            }}
            title="Toggle Voice Output"
          >
            {ttsEnabled ? "🔊 Voice ON" : "🔇 Voice OFF"}
          </button>

          <button
            onClick={resetConversation}
            style={{
              background: "transparent",
              border: "1px solid #333644",
              color: "#9ca3af",
              padding: "6px 12px",
              borderRadius: "16px",
              cursor: "pointer",
              fontSize: "12px",
            }}
            title="Start new conversation session"
          >
            ↺ New Session
          </button>

          <div className="status-pill">● AGENT CONNECTED</div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="main" id="app-main">
        {/* HERO SECTION */}
        <section className="hero">
          <div className="eyebrow">ORAL-FIRST • MULTILINGUAL • AGENTIC</div>
          <h2>
            Speak in your language.
            <br />
            <span>AI orchestrates the rest.</span>
          </h2>

          <p className="hero-description">
            Ask naturally in Tamil-English (Tanglish), Hindi-English (Hinglish), or English.
            The central agent detects intent, manages context, and delegates to specialist search agents.
          </p>

          {/* VOICE INPUT BUTTON */}
          <div style={{ margin: "20px 0" }}>
            <VoiceButton onTranscript={processRequest} disabled={loading} />
          </div>

          {/* TEXT FALLBACK INPUT */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              processRequest(inputQuery);
            }}
            style={{
              display: "flex",
              maxWidth: "540px",
              margin: "15px auto 25px",
              gap: "8px",
            }}
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Or type here: e.g. Chennai to Bangalore train..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px 16px",
                background: "#141620",
                border: "1px solid #282b3a",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              style={{
                padding: "12px 20px",
                background: "#7c4dff",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading || !inputQuery.trim() ? 0.6 : 1,
              }}
            >
              Send
            </button>
          </form>

          {/* PROMPT SAMPLES */}
          <div className="example">
            <strong>Try sample queries (click to run):</strong>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                justifyContent: "center",
                marginTop: "10px",
              }}
            >
              {samplePrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => processRequest(item.query)}
                  disabled={loading}
                  style={{
                    background: "#14151f",
                    border: "1px solid #2b2e40",
                    color: "#c4b5fd",
                    padding: "6px 14px",
                    borderRadius: "16px",
                    fontSize: "12px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "border-color 0.2s",
                  }}
                  title={item.query}
                >
                  <span style={{ color: "#777", marginRight: "6px" }}>{item.label}:</span>
                  “{item.query.length > 36 ? item.query.substring(0, 36) + "..." : item.query}”
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* RESULTS & AGENT CONVERSATION AREA */}
        <section className="results-section" id="results-section">
          {/* CONVERSATION HISTORY CHAT */}
          {messages.length > 0 && (
            <div
              className="chat-history"
              style={{
                marginBottom: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div className="section-label" style={{ marginBottom: "6px" }}>
                CONVERSATION HISTORY
              </div>
              {messages.map((m, idx) => (
                <ChatMessage key={idx} message={m.content} type={m.role} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* TRANSCRIPT DISPLAY */}
          {transcript && <Transcript text={transcript} />}

          {/* INTENT UNDERSTANDING CARD */}
          {intent && <IntentCard intent={intent} />}

          {/* SEARCH STATUS SPINNER */}
          {status && <SearchStatus status={status} />}

          {/* ERROR DISPLAY */}
          {error && (
            <div className="error-box" id="error-box">
              ⚠️ {error}
            </div>
          )}

          {/* SPECIALIST RESULT CARDS */}
          {results.length > 0 ? (
            <div className="results-list" id="results-list">
              <div className="results-heading">
                {resultType === "travel"
                  ? "TRAVEL OPTIONS FOUND"
                  : resultType === "product"
                  ? "PRODUCT RECOMMENDATIONS"
                  : resultType === "web"
                  ? "WEB SEARCH RESULTS"
                  : "RESULTS"}
              </div>

              {results.map((res, index) => (
                <ResultCard key={res.id || res.metadata?.id || index} result={res} index={index} />
              ))}
            </div>
          ) : (
            intent?.intent === "travel_search" && !loading && !error && !intent.needs_clarification && (
              <div className="results-list" id="results-empty">
                <div
                  className="result-card"
                  id="empty-travel-state"
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: "var(--text-muted, #94a3b8)",
                    fontSize: "14px"
                  }}
                >
                  <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>
                    {intent.transport_type === "bus" ? "🚌" : intent.transport_type === "flight" ? "✈️" : "🚆"}
                  </span>
                  No {intent.transport_type === "bus" ? "buses" : intent.transport_type === "train" ? "trains" : "travel options"} found for {intent.origin || "Origin"} → {intent.destination || "Destination"}
                </div>
              </div>
            )
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer" id="app-footer">
        <span>IndicVoice AI • Central Agent Orchestration</span>
        <span>Multilingual • Voice-First • Oral Assistant</span>
      </footer>
    </div>
  );
}

export default App;
