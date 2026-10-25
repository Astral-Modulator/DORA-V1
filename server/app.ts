import "dotenv/config";
import express from "express";
import { orchestrateDeepResearch } from "./orchestrator.js";
import { generateResearchDiagram } from "./diagramGenerator.js";
import { answerResearchFollowUp } from "./qaAssistant.js";
import { ResearchRequestPayload, ResearchResult, QaMessage } from "../src/types.js";

// Maximum wall-clock time (ms) we allow a single research request to run.
// Vercel hobby/pro maxDuration is 60s; keep this a bit under to guarantee
// the SSE error frame gets sent before the function is killed.
const RESEARCH_TIMEOUT_MS = 55_000;

/** Serialize any thrown value into a clean, human-readable string */
function errorMessage(err: unknown): string {
  if (!err) return "An unexpected error occurred.";
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    // Avoid leaking raw nested JSON blobs to the UI
    const obj = err as any;
    if (obj?.error?.message) return String(obj.error.message);
    if (obj?.message) return String(obj.message);
    const s = JSON.stringify(err);
    // If it's a short JSON snippet, return it; otherwise give a generic message
    return s.length < 300 ? s : "Research service returned an unexpected error.";
  } catch {
    return "An unexpected error occurred.";
  }
}

export function createExpressApp() {
  const app = express();

  // Support up to 50MB payload for uploaded PDFs
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // ──────────────────────────────────────────────
  // API Health Check
  // ──────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "DORA — Deep Orchestration Research Assistant",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // ──────────────────────────────────────────────
  // Standard Research Endpoint (Non-streaming)
  // ──────────────────────────────────────────────
  app.post("/api/research", async (req, res) => {
    try {
      const payload: ResearchRequestPayload = req.body;
      if (!payload || !payload.query || typeof payload.query !== "string") {
        return res.status(400).json({ error: "Missing or invalid 'query' in request body." });
      }

      const result = await orchestrateDeepResearch(payload);
      return res.json(result);
    } catch (err: unknown) {
      console.error("Research error:", err);
      return res.status(500).json({ error: errorMessage(err) });
    }
  });

  // ──────────────────────────────────────────────
  // Streaming Research Endpoint (Server-Sent Events)
  // ──────────────────────────────────────────────
  app.post("/api/research/stream", async (req, res) => {
    const payload: ResearchRequestPayload = req.body;
    if (!payload || !payload.query || typeof payload.query !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'query' in request body." });
    }

    const queryPreview = payload.query.slice(0, 60);
    const mode = payload.mode || "deep";
    console.log(`[SSE] Incoming research stream request: "${queryPreview}" (mode=${mode}, hasPdf=${Boolean(payload.files?.length || payload.file)})`);

    // Configure SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // disable Nginx/Vercel edge buffering
    res.flushHeaders?.();

    let finished = false;

    const sendEvent = (event: string, data: unknown) => {
      if (finished) return;
      try {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        (res as any).flush?.();
      } catch (writeErr) {
        console.warn("[SSE] Write failed:", writeErr);
      }
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      try { res.end(); } catch { /* already closed */ }
    };

    // Hard safety timeout: send error + done terminal events before Vercel kills function
    const timeoutHandle = setTimeout(() => {
      console.warn(`[SSE] Research request reached overall safety timeout (55s) for: "${queryPreview}"`);
      sendEvent("error", {
        message: "Research timed out. The topic may require too many sub-steps. Try using 'Quick' mode or a more specific query.",
      });
      sendEvent("done", { success: false, reason: "timeout" });
      finish();
    }, RESEARCH_TIMEOUT_MS);

    // Handle early client disconnect
    req.on("close", () => {
      clearTimeout(timeoutHandle);
      if (!finished) {
        console.log(`[SSE] Client closed connection early for: "${queryPreview}"`);
      }
      finished = true;
    });

    try {
      const result = await orchestrateDeepResearch(payload, (step) => {
        sendEvent("progress", step);
      });

      clearTimeout(timeoutHandle);
      console.log(`[SSE] Successfully completed research for: "${queryPreview}". Dispatching result and done events.`);
      sendEvent("result", result);
      sendEvent("done", { success: true });
    } catch (runErr: unknown) {
      clearTimeout(timeoutHandle);
      console.error(`[SSE] Research orchestration error for "${queryPreview}":`, runErr);
      sendEvent("error", { message: errorMessage(runErr) });
      sendEvent("done", { success: false, reason: "error" });
    } finally {
      finish();
    }
  });

  // ──────────────────────────────────────────────
  // Flowchart & Block Diagram Generation
  // ──────────────────────────────────────────────
  app.post("/api/research/diagram", async (req, res) => {
    try {
      const research: ResearchResult = req.body?.research;
      if (!research || !research.query) {
        return res.status(400).json({ error: "Missing or invalid research payload." });
      }

      const diagram = await generateResearchDiagram(research);
      return res.json(diagram);
    } catch (err: unknown) {
      console.error("Diagram generation error:", err);
      return res.status(500).json({ error: errorMessage(err) });
    }
  });

  // ──────────────────────────────────────────────
  // Follow-up Q&A Assistant Endpoint
  // ──────────────────────────────────────────────
  app.post("/api/research/qa", async (req, res) => {
    try {
      const { research, question, history } = req.body as {
        research: ResearchResult;
        question: string;
        history?: QaMessage[];
      };

      if (!research || !question || typeof question !== "string") {
        return res.status(400).json({ error: "Missing research context or question." });
      }

      const answer = await answerResearchFollowUp({
        research,
        question: question.trim(),
        history: Array.isArray(history) ? history : [],
      });

      return res.json({ answer });
    } catch (err: unknown) {
      console.error("Follow-up QA error:", err);
      return res.status(500).json({ error: errorMessage(err) });
    }
  });

  return app;
}
