function ResultCard({ result, index }) {
  return (
    <div className="result-card">
      <div className="result-number">
        {index + 1}
      </div>

      <div className="result-main">
        <div className="result-header">
          <div>
            <h3>{result.name}</h3>

            <span className="transport-type">
              {result.type || "Travel"}
            </span>
          </div>

          <div className="price">
            ₹{result.price}
          </div>
        </div>

        <div className="route">
          <div>
            <strong>{result.departure}</strong>
            <span>{result.origin}</span>
          </div>

          <div className="route-line">
            ───────── ✈ ─────────
          </div>

          <div>
            <strong>{result.arrival}</strong>
            <span>{result.destination}</span>
          </div>
        </div>

        <div className="result-footer">
          <span>
            💰 ₹{result.price}
          </span>

          <span>
            📍 {result.source || "IndicVoice"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ResultCard;