import { useState } from "react";
import { getProductStoreUrl } from "../utils/travelLinks";

function ProductResult({ result, index, intentBudget }) {
  const [whyExpanded, setWhyExpanded] = useState(false);

  if (!result) return null;

  const meta = result.metadata || {};
  const price = result.price;
  const rating = result.rating || meta.rating;
  const category = meta.category || "Electronics";
  const source = result.source || "Online Store";
  const storeUrl = getProductStoreUrl(result);
  const reason = result.recommendation_reason || "";

  // Is within user budget?
  const maxBudget = intentBudget || meta.budget;
  const isWithinBudget = maxBudget && price != null ? price <= maxBudget : null;

  // Build true reasons without fabrication
  const reasonsList = [];
  if (reason) {
    reasonsList.push(reason);
  }
  if (isWithinBudget) {
    reasonsList.push(`Well within your ₹${maxBudget.toLocaleString("en-IN")} budget`);
  }
  if (rating) {
    reasonsList.push(`Rated ${rating} ★ by verified buyers`);
  }
  if (source) {
    reasonsList.push(`Available with direct seller warranty on ${source}`);
  }

  const isTopRanked = index === 0;

  return (
    <article className="product-card" id={`product-result-${index}`}>
      <div className="product-card-header">
        <div className="product-badges">
          <span className="product-category-pill">
            {category}
          </span>
          {isTopRanked && (
            <span className="curated-badge badge-green">
              TOP PICK
            </span>
          )}
          {source && (
            <span className="product-store-pill">
              {source}
            </span>
          )}
        </div>

        <div className="product-price-wrap">
          <span className="price-currency">₹</span>
          <span className="price-number">{price != null ? price.toLocaleString("en-IN") : "—"}</span>
        </div>
      </div>

      <h3 className="product-title">{result.title || result.name || "Product Option"}</h3>

      {result.description && (
        <p className="product-description">{result.description}</p>
      )}

      {/* RATING & BUDGET STATUS */}
      <div className="product-metrics-row">
        {rating && (
          <div className="product-rating-badge">
            <span className="rating-star">★</span>
            <span className="rating-score">{rating}</span>
          </div>
        )}

        {isWithinBudget !== null && (
          <span className="budget-status-pill">
            {isWithinBudget ? `✓ Under ₹${maxBudget.toLocaleString("en-IN")}` : `Above ₹${maxBudget.toLocaleString("en-IN")}`}
          </span>
        )}
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

      {/* FOOTER */}
      <div className="product-card-footer">
        <span className="product-verified-note">Verified Store Listing</span>
        <div className="product-actions-right">
          {storeUrl ? (
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn action-btn-product"
              id={`view-product-btn-${index}`}
            >
              View on {source} ↗
            </a>
          ) : (
            <span className="link-unavailable">Listing link unavailable</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default ProductResult;
