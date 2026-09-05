import { useState } from "react";
import VoiceButton from "./VoiceButton";

function VoiceHome({ onQuerySubmit, loading }) {
  const [typedInput, setTypedInput] = useState("");
  const [isListening, setIsListening] = useState(false);

  const samplePrompts = [
    {
      category: "Signature Multi-Domain",
      text: "Chennai la irundhu Bangalore ku tomorrow cheap bus venum, oru power bank 1500 kulla venum, and Bangalore la enna places visit panna mudiyum?",
      highlight: true,
      lang: "Tanglish (Tamil + English)",
    },
    {
      category: "Travel",
      text: "Chennai la irundhu Bangalore ku tomorrow cheap bus venum",
      lang: "Tanglish",
    },
    {
      category: "Shopping",
      text: "50000 kulla coding-ku laptop venum",
      lang: "Tanglish",
    },
    {
      category: "Information",
      text: "Bangalore la enna places visit panna mudiyum?",
      lang: "Tanglish",
    },
    {
      category: "Hindi Travel",
      text: "Delhi se Jaipur kal subah cheap bus chahiye",
      lang: "Hinglish",
    },
  ];

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (typedInput.trim() && !loading) {
      onQuerySubmit(typedInput.trim());
    }
  };

  return (
    <div className="voice-home-container" id="voice-home-screen">
      {/* BRAND & HEADLINE */}
      <div className="home-hero-block">
        <div className="brand-badge-home">
          <span className="brand-dot"></span>
          <span className="brand-name-text">INDICVOICE</span>
        </div>

        <h1 className="home-headline">Just tell me what you need.</h1>

        <p className="home-subheadline">
          Travel, shopping, and everyday information in the language you speak.
        </p>
      </div>

      {/* CENTRAL VOICE INTERACTION */}
      <div className="home-mic-section">
        <VoiceButton
          onTranscript={onQuerySubmit}
          disabled={loading}
          size="large"
          onStateChange={setIsListening}
        />
      </div>

      {/* NATURAL SUGGESTION CHIPS */}
      <div className="home-suggestions-section">
        <span className="suggestions-label">Try saying</span>

        <div className="suggestions-grid">
          {samplePrompts.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className={`suggestion-chip ${item.highlight ? "chip-signature" : ""}`}
              onClick={() => onQuerySubmit(item.text)}
              disabled={loading}
              title={`Click to test: "${item.text}"`}
            >
              {item.highlight && (
                <span className="chip-tag">✨ Multi-Domain</span>
              )}
              <span className="chip-text">“{item.text}”</span>
            </button>
          ))}
        </div>
      </div>

      {/* TEXT FALLBACK INPUT */}
      <div className="home-text-fallback">
        <form onSubmit={handleTextSubmit} className="text-fallback-form">
          <input
            type="text"
            className="text-fallback-input"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder="Or type your request in Tanglish, Hinglish, or English..."
            disabled={loading}
            aria-label="Search query input"
          />
          <button
            type="submit"
            className="text-fallback-submit"
            disabled={loading || !typedInput.trim()}
          >
            Ask →
          </button>
        </form>
      </div>
    </div>
  );
}

export default VoiceHome;
