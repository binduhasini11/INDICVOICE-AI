function SearchStatus({ status }) {
  if (!status) return null;

  return (
    <div className="search-status">
      <div className="status-spinner">
        {status === "Searching..." ? "🔎" : "✓"}
      </div>

      <div>
        <div className="status-title">{status}</div>

        <div className="status-subtitle">
          IndicVoice AI is finding the best options for you
        </div>
      </div>
    </div>
  );
}

export default SearchStatus;