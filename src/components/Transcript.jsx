function Transcript({ text, onReset }) {
  if (!text) return null;

  return (
    <div className="user-request-bar" id="user-request-transcript">
      <div className="request-bar-header">
        <span className="editorial-label">YOUR REQUEST</span>
        {onReset && (
          <button
            type="button"
            className="new-search-btn"
            onClick={onReset}
            title="Start a new search query"
          >
            ← New Request
          </button>
        )}
      </div>
      <p className="request-quote">“{text}”</p>
    </div>
  );
}

export default Transcript;
