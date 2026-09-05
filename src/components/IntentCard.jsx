function IntentCard({ intent }) {
  if (!intent) return null;

  const getLanguageLabel = (lang) => {
    switch (lang) {
      case "ta-en":
        return "தமிழ் + English (Tanglish)";
      case "hi-en":
        return "हिंदी + English (Hinglish)";
      case "en":
        return "English";
      default:
        return lang || "Multilingual";
    }
  };

  const getRows = () => {
    const rows = [];
    const type = intent.intent;

    if (type === "multi_domain_search") {
      if (intent.domains) {
        rows.push({
          label: "Coordinated Domains",
          value: intent.domains.map((d) => d.toUpperCase()).join(" + "),
        });
      }
      if (intent.travel) {
        rows.push({
          label: "Travel Need",
          value: `${intent.travel.origin || "Origin"} → ${intent.travel.destination || "Destination"} (${(intent.travel.transport_type || "Bus").toUpperCase()})`,
        });
        if (intent.travel.date) rows.push({ label: "Date", value: intent.travel.date });
      }
      if (intent.product) {
        rows.push({
          label: "Product Need",
          value: `${intent.product.product || "Product"}${intent.product.budget ? ` (Budget: ₹${intent.product.budget})` : ""}`,
        });
      }
      if (intent.web) {
        rows.push({ label: "Information Need", value: intent.web.query || "Regional places guide" });
      }
    } else if (type === "travel_search") {
      if (intent.origin && intent.destination) {
        rows.push({ label: "Route", value: `${intent.origin} → ${intent.destination}` });
      }
      if (intent.transport_type) {
        rows.push({ label: "Transport", value: intent.transport_type.toUpperCase() });
      }
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
      if (intent.query) rows.push({ label: "Information Query", value: intent.query });
    }

    return rows;
  };

  const rows = getRows();
  const languageLabel = getLanguageLabel(intent.language);

  return (
    <div className="understanding-card" id="intent-understanding-card">
      <div className="understanding-top">
        <div className="understanding-title-row">
          <span className="editorial-label">UNDERSTANDING</span>
          <span className="language-badge">
            🗣 {languageLabel}
          </span>
        </div>
      </div>

      <div className="understanding-chips-grid">
        {rows.map((r, i) => (
          <div key={i} className="understanding-chip">
            <span className="chip-key">{r.label}</span>
            <span className="chip-val">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IntentCard;
