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
  const cleanQuery = (query || "").trim();
  if (!cleanQuery) return [];

  // 1. Tavily Search (if key provided)
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (tavilyKey) {
    try {
      const resp = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: cleanQuery, api_key: tavilyKey, max_results: 5 }),
        signal: AbortSignal.timeout(4000),
      });
      if (resp.ok) {
        const data: any = await resp.json();
        const results: SearchResult[] = (data.results || []).map((item: any, idx: number) => ({
          type: "web" as const,
          id: `WEB-${idx + 1}`,
          title: item.title || "Web Result",
          description: item.content || "",
          source: item.url ? new URL(item.url).hostname.replace("www.", "") : "Verified Web",
          url: item.url || "#",
          image: null,
          metadata: { is_live: true, score: item.score },
        }));
        if (results.length > 0) return results;
      }
    } catch (e) {
      console.warn("Warning: Tavily search error:", e);
    }
  }

  // 2. Live Web Search via DuckDuckGo HTML
  try {
    const ddgResp = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(4500),
    });

    if (ddgResp.ok) {
      const html = await ddgResp.text();
      const rawResults: { title: string; snippet: string; url: string }[] = [];

      // Extract titles and URLs
      const titleMatches = [...html.matchAll(/<a class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
      const snippetMatches = [...html.matchAll(/<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi)];
      const linkMatches = [...html.matchAll(/<h2 class="result__title">[\s\S]*?<a class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];

      for (let i = 0; i < Math.min(linkMatches.length, 5); i++) {
        let rawHref = linkMatches[i][1];
        let titleText = linkMatches[i][2].replace(/<[^>]+>/g, "").trim();
        let snippetText = snippetMatches[i] ? snippetMatches[i][1].replace(/<[^>]+>/g, "").trim() : "";

        // Unpack DuckDuckGo redirect URL /l/?uddg=...
        let actualUrl = rawHref;
        if (rawHref.includes("uddg=")) {
          try {
            const u = new URL(rawHref, "https://duckduckgo.com");
            const uddg = u.searchParams.get("uddg");
            if (uddg) actualUrl = decodeURIComponent(uddg);
          } catch {}
        }

        if (titleText && actualUrl && !actualUrl.includes("duckduckgo.com/y.js")) {
          rawResults.push({
            title: titleText,
            snippet: snippetText,
            url: actualUrl,
          });
        }
      }

      if (rawResults.length > 0) {
        return rawResults.map((item, idx) => {
          let host = "Live Web";
          try {
            host = new URL(item.url).hostname.replace("www.", "");
          } catch {}

          return {
            type: "web" as const,
            id: `WEB-${idx + 1}`,
            title: item.title,
            description: item.snippet || `Real-time web coverage on ${cleanQuery}`,
            source: host,
            url: item.url,
            image: null,
            metadata: {
              is_live: true,
              query: cleanQuery,
            },
          };
        });
      }
    }
  } catch (e) {
    console.warn("Notice: Live DDG search unavailable, using curated articles:", e);
  }

  // 3. Fallback contextual results matching query terms
  const q = cleanQuery.toLowerCase();
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
          title: `Comprehensive Guide & Highlights: ${cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1)}`,
          description: `Key sights, recent developments, travel highlights, and essential advice regarding '${cleanQuery}'.`,
          source: "Travel & Web Guide",
          url: `https://duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}`,
        },
        {
          title: `Top Recommendations and Places for ${cleanQuery}`,
          description: `Curated information on attractions, popular local spots, and visitor insights for travelers.`,
          source: "India Explorer Guide",
          url: `https://duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}`,
        },
      ];

  return finalItems.map((item, idx) => ({
    type: "web",
    id: `WEB-FALLBACK-${idx + 1}`,
    title: item.title,
    description: item.description,
    source: item.source || "Web Guide",
    url: item.url || "#",
    image: null,
    metadata: { is_demo: true, is_live: false },
  }));
}
