import { SearchResult } from "../types.js";

const FALLBACK_WEB_RESULTS = [
  {
    title: "ISRO Updates & Space Exploration Mission Highlights",
    description: "Indian Space Research Organisation successfully conducts milestone tests for future lunar and solar exploration missions.",
    source: "ISRO Official / News",
    url: "https://www.isro.gov.in",
  },
  {
    title: "Latest Artificial Intelligence and LLM Advancements in India",
    description: "Indian AI ecosystem expands rapidly with multilingual models supporting 22 scheduled languages including Tamil, Telugu, and Hindi.",
    source: "Tech News India",
    url: "https://tech.economictimes.indiatimes.com",
  },
  {
    title: "Indian Railways Modernization & Vande Bharat Network",
    description: "New superfast train corridors connect major southern cities with reduced travel time and advanced amenities.",
    source: "National Travel News",
    url: "https://indianrailways.gov.in",
  },
];

export async function searchWeb(query: string): Promise<SearchResult[]> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (tavilyKey) {
    try {
      const resp = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, api_key: tavilyKey, max_results: 5 }),
        signal: AbortSignal.timeout(4000),
      });
      if (resp.ok) {
        const data: any = await resp.json();
        const results: SearchResult[] = (data.results || []).map((item: any) => ({
          type: "web" as const,
          title: item.title || "Web Result",
          description: item.content || "",
          source: item.url || "Web",
          url: item.url || "#",
          image: null,
          metadata: { score: item.score },
        }));
        return results;
      }
    } catch (e) {
      console.warn("Warning: Tavily search error:", e);
    }
  }

  // Fallback contextual results matching query terms
  const q = query.toLowerCase();
  const matched = FALLBACK_WEB_RESULTS.filter((item) => {
    const terms = q.split(/\s+/).filter((w) => w.length > 2);
    return terms.some(
      (w) => item.title.toLowerCase().includes(w) || item.description.toLowerCase().includes(w)
    );
  });

  const finalItems = matched.length > 0
    ? matched
    : [
        {
          title: `Web information for: ${query.charAt(0).toUpperCase() + query.slice(1)}`,
          description: `Recent articles, updates, and discussions regarding '${query}' across verified sources.`,
          source: "Web Search",
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        },
      ];

  return finalItems.map((item) => ({
    type: "web",
    title: item.title,
    description: item.description,
    source: `Demo Web Data (${item.source || "Web"})`,
    url: item.url || "#",
    image: null,
    metadata: { is_demo: true },
  }));
}
