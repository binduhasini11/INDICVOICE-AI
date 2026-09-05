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
    const operator = meta.operator || result.source;
    const duration = meta.duration || result.duration;

    return (
      <div className="result-card travel-card" id={`result-${index}`}>
        <div className="result-number">{index + 1}</div>

        <div className="result-main">
          <div className="result-header">
            <div>
              <h3>{result.title || result.name || `${transport.toUpperCase()} Option`}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                <span className="transport-type">
                  {transportIcon} {transport.toUpperCase()}
                </span>
                {meta.bus_type && (
                  <span
                    className="bus-type-tag"
                    style={{
                      fontSize: "11px",
                      color: "#94a3b8",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "4px",
                      padding: "2px 6px"
                    }}
                  >
                    {meta.bus_type}
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

            <div className="route-line" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {duration && (
                <span style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "2px" }}>
                  {duration}
                </span>
              )}
              <span>────── {transportIcon} ──────</span>
            </div>

            <div>
              <strong>{arrival}</strong>
              <span>{destination}</span>
            </div>
          </div>

          {(meta.boarding_point || meta.dropping_point) && (
            <div
              className="bus-points"
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                fontSize: "12px",
                color: "#94a3b8",
                marginTop: "8px",
                padding: "6px 10px",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "6px",
                flexWrap: "wrap"
              }}
            >
              {meta.boarding_point && <span>📍 Boarding: {meta.boarding_point}</span>}
              {meta.dropping_point && <span>🏁 Dropping: {meta.dropping_point}</span>}
            </div>
          )}

          <div className="result-footer">
            <span>💰 ₹{result.price}</span>
            {operator && <span>🏢 {operator}</span>}
            {meta.available_seats != null && <span>💺 {meta.available_seats} seats left</span>}
            {result.url && result.url !== "#" ? (
              <a
                href={result.url}
                target="_blank"
                rel="noreferrer"
                id={`details-link-${meta.id || result.id || index}`}
                style={{ color: "#a78bfa", textDecoration: "none", marginLeft: "auto", fontWeight: "600" }}
              >
                View Details →
              </a>
            ) : (
              <span
                id={`details-unavailable-${meta.id || result.id || index}`}
                style={{ color: "#64748b", fontSize: "12px", marginLeft: "auto", fontStyle: "italic" }}
              >
                Details unavailable
              </span>
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
