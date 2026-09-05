export interface TravelSubIntent {
  origin?: string | null;
  destination?: string | null;
  date?: string | null;
  time?: string | null;
  preference?: string | null;
  transport_type?: string | null;
  budget?: number | null;
  requested_departure_time?: string | null;
  requested_arrival_time?: string | null;
}

export interface ProductSubIntent {
  product?: string | null;
  category?: string | null;
  budget?: number | null;
  preference?: string | null;
}

export interface WebSubIntent {
  query?: string | null;
}

export interface BookingDetails {
  booking_id: string;
  status: "confirmed" | "pending" | "failed";
  is_demo: boolean;
  item_type: "bus" | "train" | "flight" | "cab" | "product";
  title: string;
  route?: string;
  departure?: string;
  arrival?: string;
  fare?: number | string;
  operator?: string;
  timestamp?: string;
  url?: string;
}

export interface DomainResult {
  domain: "travel" | "product" | "web";
  title: string;
  summary: string;
  why_recommended?: string;
  results: SearchResult[];
}

export interface Intent {
  intent: "travel_search" | "product_search" | "web_search" | "general_chat" | "multi_domain_search" | "booking_action";
  domains?: ("travel" | "product" | "web")[];
  travel?: TravelSubIntent | null;
  product?: ProductSubIntent | string | null;
  web?: WebSubIntent | null;
  origin?: string | null;
  destination?: string | null;
  date?: string | null;
  time?: string | null;
  preference?: string | null;
  transport_type?: string | null;
  budget?: number | null;
  product_name?: string | null;
  category?: string | null;
  query?: string | null;
  message?: string | null;
  language?: "ta-en" | "hi-en" | "en";
  action?: "book" | "explain" | "filter";
  target_item_index?: number;
  [key: string]: any;
}

export interface SearchResult {
  type: "travel" | "product" | "web";
  id?: string;
  title: string;
  description: string;
  price?: number | null;
  currency?: string;
  source: string;
  url?: string;
  image?: string | null;
  recommendation_reason?: string;
  metadata?: Record<string, any>;
}

export interface ChatResponse {
  status: "success" | "needs_clarification" | "error";
  message: string;
  intent?: Intent | null;
  domains?: DomainResult[];
  results: SearchResult[];
  result_type?: string | null;
  booking?: BookingDetails | null;
  session_id: string;
  needs_clarification: boolean;
  error_code?: string | null;
}

