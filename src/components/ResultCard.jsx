function ResultCard({ result, index }) {
  if (!result) return null;

  const resultType = result.type || (result.metadata?.transport ? "travel" : "travel");
  const meta = result.metadata || {};
  const isDemo = meta.is_demo || (result.source && result.source.toLowerCase().includes("demo"));

  // 1. TRAVEL RESULT CARD
  if (resultType === "travel") {
    const origin = meta.origin || result.origin || "Origin";
    const destination = meta.destination || result.destination || "Destination";
    const departure = meta.departure || result.departure || "--:--";
    const arrival = meta.arrival || result.arrival || "--:--";
    const transport = meta.transport || result.transport || result.type || "train";
    const transportIcon = transport === "flight" ? "✈" : transport === "bus" ? "🚌" : "🚆";

    return (
      <div className="result-card travel-card" id={`result-${index}`}>
        <div className="result-number">{index + 1}</div>

        <div className="result-main">
          <div className="result-header">
            <div>
              <h3>{result.title || result.name || "Travel Option"}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <span className="transport-type">
                  {transportIcon} {transport.toUpperCase()}
                </span>
                {isDemo && (
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#f59e0b", background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "4px", padding: "2px 6px" }}>
                    DEMO DATA
                  </span>
                )}
              </div>
            </div>

            <div className="price">
              ₹{result.price != null ? result.price : "N/A"}
            </div>
          </div>

          <div className="route">
            <div>
              <strong>{departure}</strong>
              <span>{origin}</span>
            </div>

            <div className="route-line">
              ────── {transportIcon} ──────
            </div>

            <div>
              <strong>{arrival}</strong>
              <span>{destination}</span>
            </div>
          </div>

          <div className="result-footer">
            <span>💰 ₹{result.price}</span>
            <span>📍 {result.source || "IRCTC / IndicVoice"}</span>
            {result.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#a78bfa", textDecoration: "none", marginLeft: "auto" }}
              >
                View Details →
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. PRODUCT RESULT CARD
  if (resultType === "product") {
    const meta = result.metadata || {};
    const rating = meta.rating || result.rating;

    return (
      <div className="result-card product-card" id={`result-${index}`}>
        <div className="result-number">{index + 1}</div>

        {result.image && (
          <img
            src={result.image}
            alt={result.title}
            referrerPolicy="no-referrer"
            style={{
              width: "72px",
              height: "72px",
              objectFit: "cover",
              borderRadius: "10px",
              alignSelf: "center",
              flexShrink: 0
            }}
          />
        )}

        <div className="result-main">
          <div className="result-header">
            <div>
              <h3>{result.title}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                {rating && (
                  <span className="transport-type" style={{ color: "#f59e0b" }}>
                    ⭐ {rating} / 5
                  </span>
                )}
                {isDemo && (
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#f59e0b", background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "4px", padding: "2px 6px" }}>
                    DEMO DATA
                  </span>
                )}
              </div>
            </div>

            <div className="price">
              ₹{result.price != null ? result.price : "Check store"}
            </div>
          </div>

          {result.description && (
            <p style={{ margin: "10px 0 0", color: "#9ca3af", fontSize: "13px", lineHeight: "1.5" }}>
              {result.description}
            </p>
          )}

          <div className="result-footer">
            <span>🏷️ {meta.category || "Product"}</span>
            <span>🏪 {result.source || "Online Store"}</span>
            {result.url && result.url !== "#" && (
              <a
                href={result.url}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#a78bfa", textDecoration: "none", marginLeft: "auto" }}
              >
                View Offer →
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. WEB SEARCH RESULT CARD
  return (
    <div className="result-card web-card" id={`result-${index}`}>
      <div className="result-number">{index + 1}</div>

      <div className="result-main">
        <div className="result-header">
          <div>
            <h3>{result.title}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              <span className="transport-type">🌐 WEB UPDATE</span>
              {isDemo && (
                <span style={{ fontSize: "11px", fontWeight: "600", color: "#f59e0b", background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "4px", padding: "2px 6px" }}>
                  DEMO DATA
                </span>
              )}
            </div>
          </div>
        </div>

        {result.description && (
          <p style={{ margin: "10px 0 0", color: "#9ca3af", fontSize: "13px", lineHeight: "1.5" }}>
            {result.description}
          </p>
        )}

        <div className="result-footer">
          <span>📰 {result.source || "Web"}</span>
          {result.url && (
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#a78bfa", textDecoration: "none", marginLeft: "auto" }}
            >
              Read Article →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultCard;
