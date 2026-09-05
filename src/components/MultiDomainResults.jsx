import TravelResult from "./TravelResult";
import ProductResult from "./ProductResult";
import WebResult from "./WebResult";

function MultiDomainResults({ domains, intent }) {
  if (!domains || !Array.isArray(domains) || domains.length === 0) return null;

  const getDomainMeta = (domain) => {
    switch (domain) {
      case "travel":
        return {
          label: "TRAVEL",
          icon: "→",
          accentClass: "domain-travel",
          desc: "Intercity mobility & route options",
        };
      case "product":
        return {
          label: "PRODUCT",
          icon: "◆",
          accentClass: "domain-product",
          desc: "Shopping recommendations & price matching",
        };
      case "web":
        return {
          label: "WEB & SIGHTSEEING",
          icon: "✦",
          accentClass: "domain-web",
          desc: "Verified local recommendations & guides",
        };
      default:
        return {
          label: domain.toUpperCase(),
          icon: "•",
          accentClass: "domain-general",
          desc: "Results",
        };
    }
  };

  return (
    <div className="multi-domain-workspace" id="multi-domain-results">
      {/* VISUAL BRANCHING: ONE REQUEST -> MULTIPLE NEEDS */}
      <div className="domain-branch-header">
        <div className="branch-label-wrap">
          <span className="branch-eyebrow">COORDINATED SEARCH</span>
          <h3 className="branch-title">One Request · {domains.length} Distinct Needs</h3>
        </div>

        <div className="branch-nodes-row">
          {domains.map((group, idx) => {
            const meta = getDomainMeta(group.domain);
            return (
              <a
                key={idx}
                href={`#domain-section-${group.domain}`}
                className={`branch-node-chip ${meta.accentClass}`}
              >
                <span className="node-icon">{meta.icon}</span>
                <span className="node-name">{meta.label}</span>
                <span className="node-count">({group.results?.length || 0})</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* DOMAIN SPECIFIC RESULT CONTAINERS */}
      <div className="domains-stack">
        {domains.map((group, groupIdx) => {
          const meta = getDomainMeta(group.domain);
          const results = group.results || [];

          return (
            <section
              key={groupIdx}
              id={`domain-section-${group.domain}`}
              className={`domain-workspace-panel ${meta.accentClass}`}
            >
              {/* SECTION HEADER */}
              <div className="domain-panel-header">
                <div className="domain-panel-title-group">
                  <div className="domain-pill-badge">
                    <span className="domain-glyph">{meta.icon}</span>
                    <span>{meta.label}</span>
                  </div>
                  <h4 className="domain-headline">{group.title}</h4>
                  {group.summary && (
                    <p className="domain-summary-text">{group.summary}</p>
                  )}
                </div>

                <div className="domain-result-count">
                  {results.length} {results.length === 1 ? "Option" : "Options"}
                </div>
              </div>

              {/* ORCHESTRATION REASON BANNER */}
              {group.why_recommended && (
                <div className="domain-why-banner">
                  <span className="why-bullet">💡</span>
                  <span className="why-text">
                    <strong>Why selected:</strong> {group.why_recommended}
                  </span>
                </div>
              )}

              {/* DOMAIN RESULTS LIST */}
              <div className="domain-results-grid">
                {results.map((item, idx) => {
                  if (group.domain === "travel") {
                    return (
                      <TravelResult
                        key={item.id || item.metadata?.id || `travel-${idx}`}
                        result={item}
                        index={idx}
                        totalResults={results.length}
                      />
                    );
                  }
                  if (group.domain === "product") {
                    const budget = intent?.product?.budget || intent?.budget;
                    return (
                      <ProductResult
                        key={item.id || item.metadata?.id || `product-${idx}`}
                        result={item}
                        index={idx}
                        intentBudget={budget}
                      />
                    );
                  }
                  if (group.domain === "web") {
                    return (
                      <WebResult
                        key={item.id || item.metadata?.id || `web-${idx}`}
                        result={item}
                        index={idx}
                      />
                    );
                  }
                  return (
                    <TravelResult
                      key={item.id || idx}
                      result={item}
                      index={idx}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default MultiDomainResults;
