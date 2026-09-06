import { useState, useRef } from "react";
import VoiceHome from "./components/VoiceHome";
import Transcript from "./components/Transcript";
import IntentCard from "./components/IntentCard";
import SearchStatus from "./components/SearchStatus";
import ResultCard from "./components/ResultCard";
import MultiDomainResults from "./components/MultiDomainResults";
import FollowUpBar from "./components/FollowUpBar";
import { sendAgentMessage } from "./api";
import "./App.css";

function App() {
  // Session ID management- persisted in sessionStorage
  const [sessionId] = useState(() => {
    try {
      const stored = sessionStorage.getItem("indicvoice_session_id");
      if (stored) return stored;
      const newId = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem("indicvoice_session_id", newId);
      return newId;
    } catch (e) {
      return `session_${Date.now()}`;
    }
  });

  // Main UI State: 'home' (clean discovery) vs 'results' (workspace)
  const [viewMode, setViewMode] = useState("home");
  const [transcript, setTranscript] = useState("");
  const [assistantMessage, setAssistantMessage] = useState("");
  const [intent, setIntent] = useState(null);
  const [domains, setDomains] = useState([]);
  const [results, setResults] = useState([]);
  const [resultType, setResultType] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [preferenceNotice, setPreferenceNotice] = useState("");

  const resultsTopRef = useRef(null);

  // Text-To-Speech for oral-first experience
  const speakText = (text) => {
    if (!ttsEnabled || !text) return;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("TTS playback note:", err);
      }
    }
  };

  /**
   * Process request through the existing Central AI Agent Orchestrator.
   * STRICT: Backend is treated as an untouched black box.
   */
  const processRequest = async (text) => {
    if (!text || !text.trim() || loading) return;

    const userQuery = text.trim();
    setTranscript(userQuery);
    setError("");
    setViewMode("results");
    setLoading(true);
    setStatus("Understanding...");

    // Check if user is refining a preference (e.g. "fastest", "under 1000", "only buses")
    const lower = userQuery.toLowerCase();
    if (lower.includes("fastest") || lower.includes("speed")) {
      setPreferenceNotice("PREFERENCE UPDATED · FASTEST");
    } else if (lower.includes("under") || lower.includes("budget") || lower.includes("sasta")) {
      setPreferenceNotice("BUDGET UPDATED");
    } else if (lower.includes("bus")) {
      setPreferenceNotice("FILTER APPLIED · BUSES");
    } else if (lower.includes("train")) {
      setPreferenceNotice("FILTER APPLIED · TRAINS");
    } else {
      setPreferenceNotice("");
    }

    try {
      const response = await sendAgentMessage({
        message: userQuery,
        sessionId,
      });

      setStatus("Searching...");

      if (response.status === "error") {
        setError(response.message || "Failed to process request");
        setAssistantMessage(response.message || "I encountered an issue processing your request.");
        setStatus("");
        setLoading(false);
        return;
      }

      setIntent(response.intent || null);
      setDomains(response.domains || []);
      setResults(response.results || []);
      setResultType(response.result_type || null);

      const reply = response.message || "Here is what I found for you.";
      setAssistantMessage(reply);
      speakText(reply);

      setStatus("");
      if (resultsTopRef.current) {
        resultsTopRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      console.error("Agent communication error:", err);
      setError(err.message || "Could not connect to IndicVoice AI backend. Please verify your connection.");
      setAssistantMessage("I couldn't reach the agent backend. Please try again.");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const handleResetToHome = () => {
    setViewMode("home");
    setTranscript("");
    setAssistantMessage("");
    setIntent(null);
    setDomains([]);
    setResults([]);
    setResultType(null);
    setStatus("");
    setError("");
    setPreferenceNotice("");
  };

  const handleStartFreshSession = () => {
    try {
      const newId = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `session_${Date.now()}`;
      sessionStorage.setItem("indicvoice_session_id", newId);
    } catch (e) {}
    handleResetToHome();
  };

  return (
    <div className="indicvoice-app-root" id="indicvoice-app">
      {/* TOP MINIMAL APP BAR */}
      <header className="app-topbar" id="app-topbar">
        <div className="topbar-left">
          <button
            type="button"
            className="brand-logo-btn"
            onClick={handleResetToHome}
            title="Go to Voice Discovery Home"
          >
            <span className="brand-dot-indicator"></span>
            <span className="brand-title-main">INDICVOICE</span>
          </button>
          <span className="brand-tagline-sub">Oral Multilingual Assistant</span>
        </div>

        <div className="topbar-right">
          <button
            type="button"
            className={`tts-toggle-btn ${ttsEnabled ? "active" : ""}`}
            onClick={() => setTtsEnabled(!ttsEnabled)}
            title={ttsEnabled ? "Audio output active" : "Audio muted"}
          >
            {ttsEnabled ? "🔊 Voice Output" : "🔇 Muted"}
          </button>

          {viewMode === "results" && (
            <button
              type="button"
              className="new-query-btn"
              onClick={handleStartFreshSession}
              title="Start a brand new search session"
            >
              ↺ New Session
            </button>
          )}
        </div>
      </header>

      {/* SCREEN 1: VOICE-FIRST DISCOVERY HOME */}
      {viewMode === "home" ? (
        <main className="main-home-viewport">
          <VoiceHome onQuerySubmit={processRequest} loading={loading} />
        </main>
      ) : (
        /* SCREEN 2: RESULTS WORKSPACE TRANSFORMATION */
        <main className="main-results-workspace" ref={resultsTopRef}>
          {/* USER REQUEST TRANSCRIPT BANNER */}
          <Transcript text={transcript} onReset={handleResetToHome} />

          {/* PREFERENCE UPDATE PILL IF APPLIED */}
          {preferenceNotice && (
            <div className="preference-notice-pill" aria-live="polite">
              <span className="notice-icon">✓</span>
              <span>{preferenceNotice}</span>
            </div>
          )}

          {/* UNDERSTANDING BREAKDOWN & LANGUAGE */}
          {intent && <IntentCard intent={intent} />}

          {/* SEARCH PROGRESS INDICATOR */}
          {status && <SearchStatus status={status} query={transcript} />}

          {/* ERROR NOTIFICATION */}
          {error && (
            <div className="human-error-banner" id="error-banner">
              <span className="error-icon">⚠️</span>
              <div className="error-body">
                <h4>Something went wrong while finding your results</h4>
                <p>{error}</p>
                <button
                  type="button"
                  className="error-retry-btn"
                  onClick={() => processRequest(transcript)}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* ASSISTANT ORAL RESPONSE SUMMARY */}
          {assistantMessage && !loading && (
            <div className="oral-response-card" id="assistant-oral-response">
              <div className="oral-card-top">
                <span className="oral-badge">ORAL RESPONSE</span>
                <button
                  type="button"
                  className="listen-again-btn"
                  onClick={() => speakText(assistantMessage)}
                  title="Listen to this response again"
                >
                  🔊 Read Aloud
                </button>
              </div>
              <p className="oral-text">{assistantMessage}</p>
            </div>
          )}

          {/* WORKSPACE RESULTS: MULTI-DOMAIN OR SINGLE-DOMAIN */}
          {domains && domains.length > 0 ? (
            <MultiDomainResults domains={domains} intent={intent} />
          ) : results.length > 0 ? (
            <section className="single-domain-section" id="single-domain-results">
              <div className="section-title-wrap">
                <span className="section-eyebrow">
                  {resultType === "travel"
                    ? "TRAVEL"
                    : resultType === "product"
                    ? "PRODUCT"
                    : resultType === "web"
                    ? "INFORMATION"
                    : "FOUND FOR YOU"}
                </span>
                <h3 className="section-heading">
                  {resultType === "travel"
                    ? "Recommended Travel Options"
                    : resultType === "product"
                    ? "Product Recommendations"
                    : resultType === "web"
                    ? "Places & Insights"
                    : "Best Matching Options"}
                </h3>
              </div>

              <div className="results-vertical-stack">
                {results.map((res, index) => (
                  <ResultCard
                    key={res.id || res.metadata?.id || index}
                    result={res}
                    index={index}
                    intentBudget={intent?.budget}
                  />
                ))}
              </div>
            </section>
          ) : (
            !loading && !error && (
              <div className="empty-state-card" id="empty-state-notice">
                <span className="empty-glyph">🔎</span>
                <h3>I couldn't find a matching option</h3>
                <p>Try saying or typing your request with a different budget, city, or date.</p>
                <div className="empty-actions">
                  <button
                    type="button"
                    className="empty-action-btn"
                    onClick={handleResetToHome}
                  >
                    ← Try Another Query
                  </button>
                </div>
              </div>
            )
          )}

          {/* CONTEXTUAL FOLLOW-UP REFINEMENT BAR */}
          <FollowUpBar
            onFollowUp={processRequest}
            activeIntent={intent}
            loading={loading}
          />
        </main>
      )}

      {/* FOOTER */}
      <footer className="app-minimal-footer" id="app-footer">
        <div className="footer-left">
          <span>IndicVoice AI</span>
          <span className="footer-dot">·</span>
          <span>Oral-First Multilingual Assistant</span>
        </div>
        <div className="footer-right">
          <span>English · Tanglish · Hinglish</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
