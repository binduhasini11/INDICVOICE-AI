import { SearchResult } from "../types.js";

export const PRODUCT_CATALOG = [
  {
    id: "P101",
    title: "Boat Rockerz 450 Bluetooth Headphones",
    description: "Wireless on-ear headphones with 15 hours battery backup and punchy bass.",
    category: "headphones",
    price: 1499,
    rating: 4.3,
    source: "Flipkart",
    url: "https://www.flipkart.com",
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
    url: "https://www.amazon.in",
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
    url: "https://www.amazon.in",
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
    url: "https://www.myntra.com",
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
    url: "https://in.puma.com",
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
    url: "https://www.amazon.in",
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
    normalized.push({
      type: "product",
      title: item.title,
      description: item.description || "",
      price: item.price || 0,
      currency: "INR",
      source: `Demo Catalog (${item.source || "Store"})`,
      url: item.url || "#",
      image: item.image,
      metadata: {
        id: item.id,
        rating: item.rating,
        category: item.category,
        is_demo: true,
      },
    });
  }

  return normalized;
}
