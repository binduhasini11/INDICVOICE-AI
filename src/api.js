const API_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "";

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
    const response = await fetch(`${API_BASE_URL}/agent/chat`, {
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
  const response = await fetch(`${API_BASE_URL}/travel/search`, {
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
  const response = await fetch(`${API_BASE_URL}/products/search`, {
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

  const response = await fetch(`${API_BASE_URL}/speech/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Speech transcription error: ${response.status}`);
  }

  return await response.json();
}
