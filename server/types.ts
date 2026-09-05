export interface Intent {
  intent: "travel_search" | "product_search" | "web_search" | "general_chat";
  origin?: string | null;
  destination?: string | null;
  date?: string | null;
  time?: string | null;
  preference?: string | null;
  transport_type?: string | null;
  budget?: number | null;
  product?: string | null;
  category?: string | null;
  query?: string | null;
  message?: string | null;
  language?: "ta-en" | "hi-en" | "en";
  [key: string]: any;
}

export interface SearchResult {
  type: "travel" | "product" | "web";
  title: string;
  description: string;
  price?: number | null;
  currency?: string;
  source: string;
  url?: string;
  image?: string | null;
  metadata?: Record<string, any>;
}

export interface ChatResponse {
  status: "success" | "needs_clarification" | "error";
  message: string;
  intent?: Intent | null;
  results: SearchResult[];
  result_type?: string | null;
  session_id: string;
  needs_clarification: boolean;
  error_code?: string | null;
}
