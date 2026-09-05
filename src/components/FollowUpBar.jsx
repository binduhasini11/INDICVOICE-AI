import { useState } from "react";
import VoiceButton from "./VoiceButton";

function FollowUpBar({ onFollowUp, activeIntent, loading }) {
  const [typedText, setTypedText] = useState("");

  const getQuickPills = () => {
    const pills = [];

    // General explain pill
    pills.push({
      label: "💡 Why this recommendation?",
      query: "why did you recommend this?",
      tag: "EXPLAIN",
    });

    if (activeIntent?.intent === "travel_search" || activeIntent?.travel) {
      pills.push({
        label: "⚡ Fastest option",
        query: "only the fastest one",
        tag: "PREFERENCE",
      });
      pills.push({
        label: "💰 Under ₹800",
        query: "under 800 budget",
        tag: "BUDGET",
      });
      pills.push({
        label: "🚌 Only buses",
        query: "only buses",
        tag: "FILTER",
      });
      pills.push({
        label: "🚆 Only trains",
        query: "only trains",
        tag: "FILTER",
      });
    } else if (activeIntent?.intent === "product_search" || activeIntent?.product) {
      pills.push({
        label: "💰 Under ₹2,000",
        query: "under 2000",
        tag: "BUDGET",
      });
      pills.push({
        label: "★ Top rated only",
        query: "top rated only",
        tag: "FILTER",
      });
    } else {
      pills.push({
        label: "⚡ Cheapest option",
        query: "cheapest option",
        tag: "PREFERENCE",
      });
    }

    return pills;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (typedText.trim() && !loading) {
      onFollowUp(typedText.trim());
      setTypedText("");
    }
  };

  const pills = getQuickPills();

  return (
    <div className="followup-sticky-bar" id="followup-controls">
      {/* QUICK SUGGESTION PILLS */}
      <div className="followup-pills-row">
        <span className="followup-label">Refine results:</span>
        <div className="followup-pills-scroll">
          {pills.map((pill, i) => (
            <button
              key={i}
              type="button"
              className="followup-chip"
              onClick={() => onFollowUp(pill.query)}
              disabled={loading}
              title={`Ask: "${pill.query}"`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* INPUT CONTROLS: COMPACT MIC + TEXT INPUT */}
      <div className="followup-input-wrapper">
        <VoiceButton
          onTranscript={onFollowUp}
          disabled={loading}
          size="compact"
        />

        <form onSubmit={handleFormSubmit} className="followup-text-form">
          <input
            type="text"
            className="followup-text-input"
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder="Say or type a follow-up: e.g. 'only the fastest one' or 'under 1000'..."
            disabled={loading}
            aria-label="Follow up request"
          />
          <button
            type="submit"
            className="followup-submit-btn"
            disabled={loading || !typedText.trim()}
          >
            Update
          </button>
        </form>
      </div>
    </div>
  );
}

export default FollowUpBar;
