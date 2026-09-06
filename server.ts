import express, { Request, Response } from "express";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { orchestrator } from "./server/orchestrator.js";
import { searchTravel, sanitizeAndVerifyBusUrl } from "./server/tools/travelSearch.js";
import { searchProducts } from "./server/tools/productSearch.js";

const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Enable CORS for all incoming origins and headers
  app.use((req: Request, res: Response, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());

  // Health check endpoints (both /health and /api/health)
  const handleHealth = (req: Request, res: Response) => {
    res.json({
      status: "healthy",
      service: "IndicVoice AI Central Orchestrator",
      version: "1.0.0",
    });
  };
  app.get("/health", handleHealth);
  app.get("/api/health", handleHealth);

  // Central AI agent orchestration endpoints (both /agent/chat and /api/agent/chat)
  const handleChat = async (req: Request, res: Response) => {
    const { message, session_id } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ detail: "Message cannot be empty" });
    }

    try {
      const responseData = await orchestrator.processMessage(message.trim(), session_id);
      return res.json(responseData);
    } catch (e: any) {
      console.error("Orchestrator error:", e);
      return res.json({
        status: "error",
        message: "Internal server error processing agent request.",
        error_code: "ORCHESTRATOR_INTERNAL_ERROR",
        session_id: session_id || "default",
        results: [],
        needs_clarification: false,
      });
    }
  };
  app.post("/agent/chat", handleChat);
  app.post("/api/agent/chat", handleChat);

  // Direct travel search endpoints
  const handleTravelSearch = (req: Request, res: Response) => {
    const { origin, destination, travel_date, time_preference, max_price, preference, transport_type, requested_departure_time, requested_arrival_time } = req.body || {};
    if (!origin || !destination) {
      return res.status(400).json({ detail: "Origin and destination are required" });
    }

    const results = searchTravel({
      origin,
      destination,
      travel_date,
      time_preference,
      max_price,
      preference,
      transport_type,
      requested_departure_time,
      requested_arrival_time,
    });

    return res.json({
      type: "travel",
      results,
    });
  };
  app.post("/travel/search", handleTravelSearch);
  app.post("/api/travel/search", handleTravelSearch);

  // Verify and sanitize bus travel URL endpoint
  const handleVerifyBusUrl = (req: Request, res: Response) => {
    const { url, origin, destination, operator, bus_type, travel_date, date } = req.body || {};
    const journeyDate = travel_date || date;
    const verifiedUrl = sanitizeAndVerifyBusUrl(
      url,
      origin || "",
      destination || "",
      operator,
      bus_type,
      journeyDate
    );
    return res.json({
      valid: true,
      original_url: url,
      verified_url: verifiedUrl,
      provider: verifiedUrl.includes("redbus.in") ? "redBus" : "Official Operator",
      is_redirected_to_route: verifiedUrl !== url,
      date: journeyDate || null,
    });
  };
  app.post("/travel/verify-url", handleVerifyBusUrl);
  app.post("/api/travel/verify-url", handleVerifyBusUrl);

  // Direct product search endpoints
  const handleProductSearch = (req: Request, res: Response) => {
    const { query, category, max_price, preference } = req.body || {};
    const results = searchProducts({
      query,
      category,
      max_price,
      preference,
    });

    return res.json({
      type: "product",
      results,
    });
  };
  app.post("/products/search", handleProductSearch);
  app.post("/api/products/search", handleProductSearch);

  // Audio transcription endpoints
  const handleTranscribe = async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ detail: "No audio file uploaded" });
    }
    const sarvamKey = process.env.SARVAM_API_KEY;
    if (sarvamKey) {
      try {
        const formData = new FormData();
        const blob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype || "audio/wav" });
        formData.append("file", blob, req.file.originalname || "speech.wav");

        const response = await fetch("https://api.sarvam.ai/speech-to-text", {
          method: "POST",
          headers: {
            "api-subscription-key": sarvamKey,
          },
          body: formData,
          signal: AbortSignal.timeout(6000),
        });

        if (response.ok) {
          const data: any = await response.json();
          return res.json({
            status: "success",
            transcript: data.transcript || "",
          });
        }
      } catch (err) {
        console.warn("Sarvam transcription error:", err);
      }
    }

    return res.json({
      status: "success",
      transcript: "",
    });
  };
  app.post("/speech/transcribe", upload.single("file"), handleTranscribe);
  app.post("/api/speech/transcribe", upload.single("file"), handleTranscribe);

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: PORT },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IndicVoice AI server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
