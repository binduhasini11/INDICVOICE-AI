function WebResult({ result, index }) {
  if (!result) return null;

  const orderNumber = String(index + 1).padStart(2, "0");
  const title = result.title || "Information Guide";
  const snippet = result.description || result.snippet || "";
  const source = result.source || (result.url ? new URL(result.url).hostname.replace("www.", "") : "Verified Source");
  const rawUrl = result.url;
  const webUrl = rawUrl && rawUrl.startsWith("http") && !rawUrl.includes("example.com")
    ? rawUrl
    : `https://www.google.com/search?q=${encodeURIComponent(title)}`;

  return (
    <article className="web-discovery-item" id={`web-result-${index}`}>
      <div className="web-num-marker">{orderNumber}</div>

      <div className="web-body">
        <h4 className="web-title">{title}</h4>
        {snippet && <p className="web-snippet">{snippet}</p>}

        <div className="web-footer">
          <span className="web-source-label">Source: <strong>{source}</strong></span>
          <a
            href={webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn action-btn-web"
            id={`open-web-link-${index}`}
          >
            Open Source ↗
          </a>
        </div>
      </div>
    </article>
  );
}

export default WebResult;
