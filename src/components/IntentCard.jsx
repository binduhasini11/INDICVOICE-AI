function IntentCard({ intent }) {
  if (!intent) return null;

  // Format details dynamically from backend intent dictionary
  const getDisplayDetails = () => {
    if (intent.details && Array.isArray(intent.details)) {
      return intent.details;
    }

    const rows = [];
    const type = intent.intent;

    if (type === "travel_search") {
      if (intent.origin) rows.push({ label: "Origin", value: intent.origin });
      if (intent.destination) rows.push({ label: "Destination", value: intent.destination });
      if (intent.transport_type) rows.push({ label: "Transport", value: intent.transport_type });
      if (intent.date) rows.push({ label: "Date", value: intent.date });
      if (intent.time) rows.push({ label: "Time", value: intent.time });
      if (intent.preference) rows.push({ label: "Preference", value: intent.preference });
      if (intent.budget) rows.push({ label: "Max Budget", value: `₹${intent.budget}` });
    } else if (type === "product_search") {
      if (intent.product) rows.push({ label: "Product", value: intent.product });
      if (intent.category) rows.push({ label: "Category", value: intent.category });
      if (intent.budget) rows.push({ label: "Max Budget", value: `₹${intent.budget}` });
      if (intent.preference) rows.push({ label: "Preference", value: intent.preference });
    } else if (type === "web_search") {
      if (intent.query) rows.push({ label: "Query", value: intent.query });
    }

    if (intent.language) {
      const langNames = {
        "ta-en": "Tamil-English (Tanglish)",
        "hi-en": "Hindi-English (Hinglish)",
        "en": "English"
      };
      rows.push({ label: "Language", value: langNames[intent.language] || intent.language });
    }

    return rows;
  };

  const getTitle = () => {
    if (intent.title) return intent.title;
    const type = intent.intent;
    if (type === "travel_search") return "Travel Search Agent";
    if (type === "product_search") return "Product Search Agent";
    if (type === "web_search") return "Web Information Agent";
    if (type === "general_chat") return "Conversational Agent";
    return "Intent Detected";
  };

  const rows = getDisplayDetails();

  return (
    <div className="intent-card" id="intent-card">
      <div className="section-label">CENTRAL AGENT UNDERSTANDING</div>

      <div className="intent-title">
        🧠 {getTitle()}
      </div>

      <div className="intent-details">
        {rows.map((item, index) => (
          <div className="intent-row" key={index}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IntentCard;
