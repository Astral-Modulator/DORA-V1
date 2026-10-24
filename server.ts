import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createExpressApp } from "./server/app.js";

async function startServer() {
  const app = createExpressApp();
  const PORT = parseInt(process.env.PORT || "3000", 10);

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
