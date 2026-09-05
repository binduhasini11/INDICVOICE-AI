import { useState } from "react";
import { getVerifiedTravelUrl } from "../utils/travelLinks";

function TravelResult({ result, index, totalResults = 1 }) {
  const [whyExpanded, setWhyExpanded] = useState(false);

  if (!result) return null;

  const meta = result.metadata || {};
  const origin = meta.origin || result.origin || "Origin";
  const destination = meta.destination || result.destination || "Destination";
  const departure = meta.departure || result.departure || "--:--";
  const arrival = meta.arrival || result.arrival || "--:--";
  const duration = meta.duration || result.duration || "";
  const transportRaw = (meta.transport || result.transport || result.type || "travel").toLowerCase();
  
  // Strict rule: Display EXACT transport from backend
  const transportLabel = transportRaw === "flight" ? "FLIGHT" : transportRaw === "bus" ? "BUS" : transportRaw === "train" ? "TRAIN" : transportRaw.toUpperCase();
  const operator = meta.operator || result.source || "";
  const busType = meta.bus_type || "";
  const availableSeats = meta.available_seats;
  const verifiedUrl = getVerifiedTravelUrl(result);
  const reason = result.recommendation_reason || "";

  // Dynamic ranking badges based strictly on backend values
  const isTopRanked = index === 0;
  const badgeLabel = isTopRanked ? (result.price != null && result.price < 600 ? "BEST VALUE" : "RECOMMENDED") : null;

  // Build real bullet points for "Why this one?" without fabrication
  const reasonsList = [];
  if (reason) {
    reasonsList.push(reason);
  }
  if (meta.departure) {
    reasonsList.push(`Scheduled departure at ${meta.departure}`);
  }
  if (duration) {
    reasonsList.push(`Estimated journey time: ${duration}`);
  }
  if (availableSeats != null) {
    reasonsList.push(`${availableSeats} verified seats currently available`);
  }
  if (operator) {
    reasonsList.push(`Operated by ${operator}`);
  }

  const providerName = transportLabel === "BUS" ? "RedBus" : transportLabel === "TRAIN" ? "IRCTC" : "Booking Portal";

  return (
    <article className="travel-card" id={`travel-result-${index}`}>
      {/* CARD TOP HEADER */}
      <div className="travel-card-header">
        <div className="travel-badges">
          <span className="transport-pill transport-pill-travel">
            {transportLabel}
          </span>
          {badgeLabel && (
            <span className="curated-badge badge-terracotta">
              {badgeLabel}
            </span>
          )}
          {operator && (
            <span className="operator-label">
              {operator} {busType ? `· ${busType}` : ""}
            </span>
          )}
        </div>

        <div className="travel-price-wrap">
          <span className="price-currency">₹</span>
          <span className="price-number">{result.price != null ? result.price.toLocaleString("en-IN") : "—"}</span>
        </div>
      </div>

      {/* TITLE */}
      <h3 className="travel-title">{result.title || `${origin} to ${destination}`}</h3>

      {/* ROUTE LINE VISUALIZATION */}
      <div className="route-viz" aria-label={`Route from ${origin} at ${departure} to ${destination} at ${arrival}`}>
        <div className="route-point origin-point">
          <span className="route-time">{departure}</span>
          <span className="route-city">{origin}</span>
        </div>

        <div className="route-path-container">
          <div className="route-line-bar">
            <span className="route-start-dot"></span>
            <span className="route-line-fill"></span>
            <span className="route-end-arrow">→</span>
          </div>
          {duration && <span className="route-duration-pill">{duration}</span>}
        </div>

        <div className="route-point destination-point">
          <span className="route-time">{arrival}</span>
          <span className="route-city">{destination}</span>
        </div>
      </div>

      {/* "WHY THIS ONE?" EXPANDABLE ACCORDION */}
      {reasonsList.length > 0 && (
        <div className="why-toggle-wrap">
          <button
            type="button"
            className="why-toggle-btn"
            onClick={() => setWhyExpanded(!whyExpanded)}
            aria-expanded={whyExpanded}
          >
            <span>Why this one?</span>
            <span className="why-toggle-icon">{whyExpanded ? "−" : "+"}</span>
          </button>

          {whyExpanded && (
            <ul className="why-reasons-list">
              {reasonsList.map((r, i) => (
                <li key={i} className="why-reason-item">
                  <span className="check-mark">✓</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* CARD FOOTER WITH OFFICIAL ACTION */}
      <div className="travel-card-footer">
        {availableSeats != null && (
          <span className="seats-tag">
            💺 {availableSeats} seats left
          </span>
        )}

        <div className="travel-actions-right">
          {verifiedUrl ? (
            <a
              href={verifiedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn action-btn-travel"
              id={`book-travel-btn-${index}`}
            >
              Book on {providerName} ↗
            </a>
          ) : (
            <span className="link-unavailable">Official link unavailable</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default TravelResult;
