function SearchStatus({ status }) {
  if (!status) return null;
  return (
    <div className="status-box" id="status-box">
      <div className="status-spinner" />
      <span>{status}</span>
    </div>
  );
}

export default SearchStatus;
