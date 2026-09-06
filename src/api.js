/**
 * Safely resolves the API Base URL.
 * In full-stack container environments (where Vite and Express are hosted on port 3000), API requests should always route to the same origin (empty string "") rather than an unreachable local machine URL like 127.0.0.1:8000.
 */
function resolveApiBaseUrl() {
  const envUrl =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      typeof import.meta.env.VITE_API_BASE_URL === "string" &&
      import.meta.env.VITE_API_BASE_URL.trim()) ||
    "";

  // If envUrl points to legacy local Python/FastAPI port 8000 or points to localhost
  // while the app is loaded from a remote host (e.g. Cloud Run, preview iframe),
  // always use same-origin relative URLs ("").
  if (
    envUrl.includes(":8000") ||
    (typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1" &&
      (envUrl.includes("localhost") || envUrl.includes("127.0.0.1")))
  ) {
    return "";
  }

  return envUrl.replace(/\/+$/, "");
}

const API_BASE_URL = resolveApiBaseUrl();

/**
 * Helper to fetch from primary endpoint with automatic fallback to relative same-origin path
 */
async function robustFetch(endpointPath, options = {}) {
  const primaryUrl = API_BASE_URL ? `${API_BASE_URL}${endpointPath}` : endpointPath;
  try {
    const res = await fetch(primaryUrl, options);
    if (!res.ok && res.status === 404 && !primaryUrl.startsWith("/api/")) {
      // Try /api/ prefix fallback
      try {
        const altRes = await fetch(`/api${endpointPath}`, options);
        if (altRes.ok) return altRes;
      } catch (_) {}
    }
    return res;
  } catch (err) {
    // If primary URL failed (e.g. mixed content or connection refused on custom API_BASE_URL),
    // immediately retry on current origin relative path
    if (API_BASE_URL && primaryUrl !== endpointPath) {
      return await fetch(endpointPath, options);
    }
    throw err;
  }
}

/**
 * Send user message or speech transcript to the Central AI Agent Orchestrator.
 * @param {Object} params
 * @param {string} params.message - Raw transcript or typed query.
 * @param {string} params.sessionId - Unique user session identifier for multi-turn memory.
 * @returns {Promise<Object>} Agent ChatResponse
 */
export async function sendAgentMessage({ message, sessionId }) {
  if (!message || !message.trim()) {
    throw new Error("Message cannot be empty.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await robustFetch("/agent/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message.trim(),
        session_id: sessionId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errDetail = `Server responded with status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson && errorJson.detail) {
          errDetail = errorJson.detail;
        } else if (errorJson && errorJson.message) {
          errDetail = errorJson.message;
        }
      } catch (e) {
        // ignore json parse failure
      }
      throw new Error(errDetail);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Request to IndicVoice AI agent timed out. Please check your connection.");
    }
    throw err;
  }
}

/**
 * Backward-compatible agentChat alias
 */
export async function agentChat({ message, session_id = "default" }) {
  return sendAgentMessage({ message, sessionId: session_id });
}

/**
 * Specialist direct travel search endpoint (for admin/testing purposes)
 */
export async function searchTravel({
  origin,
  destination,
  travel_date = null,
  time_preference = null,
  max_price = null,
  preference = null,
  transport_type = null,
}) {
  const response = await robustFetch("/travel/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      origin,
      destination,
      travel_date,
      time_preference,
      max_price,
      preference,
      transport_type,
    }),
  });

  if (!response.ok) {
    throw new Error(`Travel backend error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Specialist direct product search endpoint (for admin/testing purposes)
 */
export async function searchProducts({
  query,
  category = null,
  max_price = null,
  preference = null,
}) {
  const response = await robustFetch("/products/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      category,
      max_price,
      preference,
    }),
  });

  if (!response.ok) {
    throw new Error(`Product backend error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Audio transcription endpoint
 */
export async function transcribeAudio(audioBlob) {
  const formData = new FormData();
  formData.append("file", audioBlob, "speech.wav");

  const response = await robustFetch("/speech/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Speech transcription error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Verify and sanitize bus travel URL endpoint.
 * Ensures the link points to the authentic operator or RedBus booking route.
 */
export async function verifyBusUrl({ url, origin, destination, operator, bus_type, travel_date, date }) {
  try {
    const journeyDate = travel_date || date;
    const response = await robustFetch("/travel/verify-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        origin,
        destination,
        operator,
        bus_type,
        travel_date: journeyDate,
      }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("URL verification endpoint failed, falling back to local resolver:", err);
  }
  return null;
}

