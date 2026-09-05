import { SearchResult } from "./types.js";

export function rankResults(results: SearchResult[], preference?: string | null): SearchResult[] {
  if (!results || results.length === 0 || !preference) {
    return results;
  }

  const pref = preference.toLowerCase().trim();

  if (["cheapest", "lowest_price", "low_price", "budget", "cheap"].includes(pref)) {
    return [...results].sort((a, b) => {
      const pA = a.price != null ? a.price : Infinity;
      const pB = b.price != null ? b.price : Infinity;
      return pA - pB;
    });
  }

  if (["earliest", "early", "fastest", "quick"].includes(pref)) {
    return [...results].sort((a, b) => {
      const depA = a.metadata?.departure || "99:99";
      const depB = b.metadata?.departure || "99:99";
      return depA.localeCompare(depB);
    });
  }

  if (["rating", "best_rated", "top_rated"].includes(pref)) {
    return [...results].sort((a, b) => {
      const rA = a.metadata?.rating || 0;
      const rB = b.metadata?.rating || 0;
      return rB - rA;
    });
  }

  return results;
}
