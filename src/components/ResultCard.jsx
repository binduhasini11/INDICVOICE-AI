const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatRedBusDate(travelDate) {
  if (!travelDate || typeof travelDate !== "string") return null;
  const dStr = travelDate.trim().toLowerCase();
  if (!dStr || dStr === "null" || dStr === "undefined") return null;

  const now = new Date();
  let targetDate = null;

  if (dStr === "today" || dStr === "innaiku" || dStr === "indru" || dStr === "aaj") {
    targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (dStr === "tomorrow" || dStr === "naalaiku" || dStr === "naalai" || dStr === "kal") {
    targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (dStr === "day after tomorrow" || dStr === "naalanniki" || dStr === "parson") {
    targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
  } else {
    // Check YYYY-MM-DD
    const isoMatch = dStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      targetDate = new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
    } else {
      // Check DD-MM-YYYY or DD/MM/YYYY
      const dmyMatch = dStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (dmyMatch) {
        targetDate = new Date(parseInt(dmyMatch[3], 10), parseInt(dmyMatch[2], 10) - 1, parseInt(dmyMatch[1], 10));
      } else {
        const parsed = new Date(travelDate);
        if (!isNaN(parsed.getTime())) {
          targetDate = parsed;
        }
      }
    }
  }

  if (!targetDate || isNaN(targetDate.getTime())) {
    return null;
  }

  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
  const dd = String(targetDate.getDate()).padStart(2, "0");
  const monName = MONTHS_SHORT[targetDate.getMonth()];

  return {
    doj: `${dd}-${monName}-${yyyy}`,
    dateParam: `${yyyy}${mm}${dd}`,
  };
}

function getVerifiedTravelUrl(result) {
  if (!result) return null;
  const meta = result.metadata || {};
  const transport = (meta.transport || result.transport || result.type || "").toLowerCase();
  const rawUrl = result.url;
  const journeyDate = meta.date || result.date || meta.travel_date || result.travel_date;

  if (transport === "bus") {
    const origin = meta.origin || result.origin || "";
    const destination = meta.destination || result.destination || "";
    const operator = meta.operator || result.source || "";
    const busType = meta.bus_type || "";

    // Check if url is invalid, placeholder, localhost, or has broken .do/serviceDetails/tripDetails patterns that cause 404
    const isInvalidOrBroken =
      !rawUrl ||
      typeof rawUrl !== "string" ||
      rawUrl === "#" ||
      rawUrl === "null" ||
      rawUrl.includes("localhost") ||
      rawUrl.includes("example.com") ||
      rawUrl.includes(".do?") ||
      rawUrl.includes("/serviceDetails") ||
      rawUrl.includes("/tripDetails") ||
      rawUrl.includes("SETC-GEN") ||
      rawUrl.includes("KSRTC-GEN") ||
      rawUrl.includes("TSRTC-GEN") ||
      rawUrl.includes("APSRTC-GEN");

    if (isInvalidOrBroken) {
      if (origin && destination) {
        const getSlug = (name) => {
          const c = (name || "").toLowerCase().trim();
          if (c === "bengaluru" || c === "bangalore") return "bangalore";
          if (c === "secunderabad" || c === "hyderabad") return "hyderabad";
          if (c === "visakhapatnam" || c === "vizag") return "visakhapatnam";
          if (c === "mysuru" || c === "mysore") return "mysore";
          return c.replace(/\s+/g, "-");
        };

        const origSlug = getSlug(origin);
        const destSlug = getSlug(destination);
        const base = `https://www.redbus.in/bus-tickets/${origSlug}-to-${destSlug}`;
        const params = [];

        // Pre-fill journey date
        const dateFmt = formatRedBusDate(journeyDate);
        if (dateFmt) {
          params.push(`doj=${encodeURIComponent(dateFmt.doj)}`);
        }

        if (operator && operator !== "State RTC" && operator !== "Private Express") {
          params.push(`operator=${encodeURIComponent(operator)}`);
        }
        if (busType) {
          params.push(`busType=${encodeURIComponent(busType)}`);
        }
        return params.length > 0 ? `${base}?${params.join("&")}` : base;
      }
      return null;
    }

    // If url is already an official redBus route URL, ensure journey date is prefilled if not already present
    if (journeyDate && rawUrl.includes("redbus.in/bus-tickets") && !rawUrl.includes("doj=")) {
      const dateFmt = formatRedBusDate(journeyDate);
      if (dateFmt) {
        const sep = rawUrl.includes("?") ? "&" : "?";
        return `${rawUrl}${sep}doj=${encodeURIComponent(dateFmt.doj)}`;
      }
    }

    return rawUrl;
  }

  // Train / flight / web
  if (rawUrl && typeof rawUrl === "string" && rawUrl !== "#" && rawUrl !== "null") {
    return rawUrl;
  }
  return null;
}

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
    const verifiedUrl = getVerifiedTravelUrl(result);

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
                {transport === "bus" && verifiedUrl && (
                  <span
                    className="verified-bus-link-badge"
                    title="Verified official operator booking search page"
                    style={{
                      fontSize: "11px",
                      color: "#4ade80",
                      background: "rgba(34, 197, 94, 0.08)",
                      border: "1px solid rgba(34, 197, 94, 0.2)",
                      borderRadius: "4px",
                      padding: "2px 6px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px"
                    }}
                  >
                    ✓ Official Booking
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
            {verifiedUrl ? (
              <a
                href={verifiedUrl}
                target="_blank"
                rel="noopener noreferrer"
                id={`details-link-${meta.id || result.id || index}`}
                title={`Open official booking page for ${origin} → ${destination}`}
                style={{
                  color: "#a78bfa",
                  textDecoration: "none",
                  marginLeft: "auto",
                  fontWeight: "600",
                  fontSize: "13px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
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
