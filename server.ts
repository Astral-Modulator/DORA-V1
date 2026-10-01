import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { orchestrateDeepResearch } from "./server/orchestrator.js";
import { generateResearchDiagram } from "./server/diagramGenerator.js";
import { answerResearchFollowUp } from "./server/qaAssistant.js";
import { ResearchRequestPayload, ResearchResult, QaMessage } from "./src/types.js";

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  // Support up to 50MB payload for uploaded PDFs
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "DORA — Deep Orchestration Research Assistant",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Standard Research Endpoint (Non-streaming)
  app.post("/api/research", async (req, res) => {
    try {
      const payload: ResearchRequestPayload = req.body;
      if (!payload || !payload.query || typeof payload.query !== "string") {
        return res.status(400).json({ error: "Missing or invalid 'query' in request body." });
      }

      const result = await orchestrateDeepResearch(payload);
      return res.json(result);
    } catch (err: any) {
      console.error("Research error:", err);
      return res.status(500).json({
        error: err.message || "An unexpected error occurred during research orchestration.",
      });
    }
  });

  // Streaming Research Endpoint (Server-Sent Events)
  app.post("/api/research/stream", async (req, res) => {
    try {
      const payload: ResearchRequestPayload = req.body;
      if (!payload || !payload.query || typeof payload.query !== "string") {
        return res.status(400).json({ error: "Missing or invalid 'query' in request body." });
      }

      // Configure SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      try {
        const result = await orchestrateDeepResearch(payload, (step) => {
          sendEvent("progress", step);
        });

        sendEvent("result", result);
        sendEvent("done", { success: true });
        res.end();
      } catch (runErr: any) {
        console.error("Deep research orchestration error:", runErr);
        sendEvent("error", { message: runErr.message || "Research process failed." });
        res.end();
      }
    } catch (err: any) {
      console.error("SSE Setup error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || "Failed to start streaming." });
      } else {
        res.end();
      }
    }
  });

  // Flowchart & Block Diagram Generation
  app.post("/api/research/diagram", async (req, res) => {
    try {
      const research: ResearchResult = req.body?.research;
      if (!research || !research.query) {
        return res.status(400).json({ error: "Missing or invalid research payload." });
      }

      const diagram = await generateResearchDiagram(research);
      return res.json(diagram);
    } catch (err: any) {
      console.error("Diagram generation error:", err);
      return res.status(500).json({
        error: err.message || "Failed to generate research diagram.",
      });
    }
  });

  // Follow-up Q&A Assistant Endpoint
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
    } catch (err: any) {
      console.error("Follow-up QA error:", err);
      return res.status(500).json({
        error: err.message || "Failed to process follow-up question.",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const startListen = (port: number) => {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`DORA server running on http://localhost:${port}`);
    });

    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`Port ${port} is currently in use, trying port ${port + 1}...`);
        startListen(port + 1);
      } else {
        console.error("Server error:", err);
      }
    });
  };

  startListen(PORT);
}

startServer();
