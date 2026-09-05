function SearchStatus({ status, query = "" }) {
  if (!status) return null;

  const isMulti = query.toLowerCase().includes("power bank") || query.toLowerCase().includes("laptop") || (query.toLowerCase().includes("bus") && query.toLowerCase().includes("places"));

  return (
    <div className="discovery-status-card" id="search-status-box" aria-live="polite">
      <div className="status-header">
        <span className="status-pulse-dot"></span>
        <span className="status-headline">
          {status === "Understanding..."
            ? "Understanding your request..."
            : status === "Searching..."
            ? "Finding the best options for you..."
            : status}
        </span>
      </div>

      {isMulti && (
        <div className="status-domain-pipeline">
          <span className="pipeline-item active">✓ Travel</span>
          <span className="pipeline-item active">✓ Shopping</span>
          <span className="pipeline-item active">✓ Information</span>
        </div>
      )}
    </div>
  );
}

export default SearchStatus;
