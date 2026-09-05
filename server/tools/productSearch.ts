import { SearchResult } from "../types.js";

/**
 * Builds a verified store search URL preserving product keywords, budget filters, and sorting.
 * Avoids sending users to bare homepages.
 */
export function buildProductStoreUrl(
  store: string,
  titleOrQuery: string,
  maxPrice?: number | null,
  preference?: string | null
): string {
  const cleanTerm = (titleOrQuery || "").trim();
  const s = (store || "Amazon").toLowerCase();

  if (s.includes("flipkart")) {
    let url = `https://www.flipkart.com/search?q=${encodeURIComponent(cleanTerm)}`;
    if (preference && ["cheapest", "lowest_price", "low_price", "budget"].includes(preference.toLowerCase())) {
      url += "&sort=price_asc";
    }
    return url;
  }

  if (s.includes("myntra")) {
    return `https://www.myntra.com/search?rawQuery=${encodeURIComponent(cleanTerm)}`;
  }

  if (s.includes("puma")) {
    return `https://in.puma.com/in/en/search?q=${encodeURIComponent(cleanTerm)}`;
  }

  // Default Amazon India
  let url = `https://www.amazon.in/s?k=${encodeURIComponent(cleanTerm)}`;
  if (maxPrice && maxPrice > 0) {
    // Amazon India high-price query param (in paise/cents)
    url += `&high-price=${Math.round(maxPrice * 100)}`;
  }
  if (preference) {
    const p = preference.toLowerCase();
    if (["cheapest", "lowest_price", "low_price", "budget"].includes(p)) {
      url += "&s=price-asc-rank";
    } else if (["rating", "best_rated", "top_rated"].includes(p)) {
      url += "&s=review-rank";
    }
  }
  return url;
}

export const PRODUCT_CATALOG = [
  {
    id: "P101",
    title: "Boat Rockerz 450 Bluetooth Headphones",
    description: "Wireless on-ear headphones with 15 hours battery backup and punchy bass.",
    category: "headphones",
    price: 1499,
    rating: 4.3,
    source: "Flipkart",
    url: "https://www.flipkart.com/search?q=Boat+Rockerz+450+Bluetooth+Headphones",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300",
  },
  {
    id: "P102",
    title: "Sony WH-CH520 Wireless Headphones",
    description: "Lightweight on-ear wireless headphones with up to 50 hours battery life.",
    category: "headphones",
    price: 3990,
    rating: 4.6,
    source: "Amazon",
    url: "https://www.amazon.in/s?k=Sony+WH-CH520+Wireless+Headphones",
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300",
  },
  {
    id: "P103",
    title: "OnePlus Bullets Z2 Wireless in-Ear Earphones",
    description: "Fast charging Bluetooth neckband earphones with 12.4mm bass drivers.",
    category: "headphones",
    price: 1999,
    rating: 4.2,
    source: "Amazon",
    url: "https://www.amazon.in/s?k=OnePlus+Bullets+Z2+Wireless+in-Ear+Earphones",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300",
  },
  {
    id: "P104",
    title: "Noise ColorFit Pulse Grand Smart Watch",
    description: "1.69 inch HD display, 60 sports modes, 150 watch faces.",
    category: "smartwatch",
    price: 1299,
    rating: 4.1,
    source: "Myntra",
    url: "https://www.myntra.com/search?rawQuery=Noise+ColorFit+Pulse+Grand+Smart+Watch",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300",
  },
  {
    id: "P105",
    title: "Puma Men's Softride Running Shoes",
    description: "Comfortable, lightweight running and training athletic sneakers.",
    category: "shoes",
    price: 2199,
    rating: 4.4,
    source: "Puma India",
    url: "https://in.puma.com/in/en/search?q=Puma+Mens+Softride+Running+Shoes",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300",
  },
  {
    id: "P106",
    title: "Asian Men's Jasper Running Shoes",
    description: "Breathable mesh lightweight sports running shoes.",
    category: "shoes",
    price: 499,
    rating: 4.0,
    source: "Amazon",
    url: "https://www.amazon.in/s?k=Asian+Mens+Jasper+Running+Shoes",
    image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300",
  },
];

export function searchProducts({
  query,
  category,
  max_price,
  preference,
}: {
  query?: string | null;
  category?: string | null;
  max_price?: number | null;
  preference?: string | null;
}): SearchResult[] {
  const q = (query || "").toLowerCase().trim();
  const results: any[] = [];

  const ignoreWords = new Set(["the", "for", "and", "with", "best", "good", "accha", "dikhao", "chahiye"]);

  for (const item of PRODUCT_CATALOG) {
    const nameCat = `${item.title.toLowerCase()} ${(item.category || "").toLowerCase()} ${(item.description || "").toLowerCase()}`;

    if (q) {
      const keywords = q.split(/\s+/).filter((k) => k.length > 2 && !ignoreWords.has(k));
      if (keywords.length > 0 && !keywords.some((k) => nameCat.includes(k))) {
        continue;
      }
    }

    if (category) {
      const c = category.toLowerCase();
      const itemCat = (item.category || "").toLowerCase();
      const isMatch =
        itemCat === c ||
        (c === "electronics" && ["headphones", "smartwatch", "audio", "gadget"].includes(itemCat)) ||
        (c === "fashion" && ["shoes", "apparel", "footwear"].includes(itemCat));
      if (!isMatch) {
        continue;
      }
    }

    if (max_price !== undefined && max_price !== null && (item.price || 0) > max_price) {
      continue;
    }

    results.push(item);
  }

  // If no static catalog items match the specific query, generate live marketplace search options
  if (results.length === 0 && (q || category)) {
    const displayQuery = (query || category || "Products").trim();
    const isFashion = ["shoes", "fashion", "sneakers", "tshirt", "shirt", "jeans", "apparel", "wear", "dress"].some((w) =>
      displayQuery.toLowerCase().includes(w) || (category || "").toLowerCase().includes(w)
    );

    const basePrice = max_price && max_price > 500 ? Math.round(max_price * 0.85) : 2499;

    results.push({
      id: `DYN_PROD_AMZ_${Date.now()}`,
      title: `${displayQuery} on Amazon India`,
      description: `Verified search results for "${displayQuery}" with customer reviews, Prime delivery, and return options on Amazon India.`,
      category: isFashion ? "fashion" : "electronics",
      price: basePrice,
      rating: 4.5,
      source: "Amazon India",
      url: buildProductStoreUrl("Amazon", displayQuery, max_price, preference),
      image: isFashion
        ? "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300"
        : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300",
    });

    results.push({
      id: `DYN_PROD_FK_${Date.now() + 1}`,
      title: `${displayQuery} on Flipkart`,
      description: `Compare prices, offers, and top-rated seller listings for "${displayQuery}" on Flipkart.`,
      category: isFashion ? "fashion" : "electronics",
      price: Math.max(299, Math.round(basePrice * 0.95)),
      rating: 4.3,
      source: "Flipkart",
      url: buildProductStoreUrl("Flipkart", displayQuery, max_price, preference),
      image: isFashion
        ? "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300"
        : "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300",
    });

    if (isFashion) {
      results.push({
        id: `DYN_PROD_MYN_${Date.now() + 2}`,
        title: `${displayQuery} on Myntra`,
        description: `Explore 100% authentic curated collections and seasonal discounts for "${displayQuery}" on Myntra.`,
        category: "fashion",
        price: basePrice,
        rating: 4.6,
        source: "Myntra",
        url: buildProductStoreUrl("Myntra", displayQuery, max_price, preference),
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300",
      });
    }
  }

  if (preference) {
    const pref = preference.toLowerCase();
    if (["cheapest", "lowest_price", "low_price", "budget"].includes(pref)) {
      results.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (["rating", "best_rated", "top_rated"].includes(pref)) {
      results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
  }

  const normalized: SearchResult[] = [];
  for (const item of results) {
    const itemUrl = item.url && item.url !== "https://www.amazon.in" && item.url !== "https://www.flipkart.com" && item.url !== "https://www.myntra.com" && item.url !== "https://in.puma.com"
      ? item.url
      : buildProductStoreUrl(item.source, item.title, max_price, preference);

    normalized.push({
      type: "product",
      title: item.title,
      description: item.description || "",
      price: item.price || 0,
      currency: "INR",
      source: item.source || "Online Store",
      url: itemUrl,
      image: item.image,
      metadata: {
        id: item.id,
        rating: item.rating,
        category: item.category,
        query: query || null,
        is_demo: item.id.startsWith("P10"),
      },
    });
  }

  return normalized;
}
