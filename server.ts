import express from "express";
import path from "path";
import { config } from "./src/backend/config/config";
import { Logger } from "./src/backend/utils/logger";
import apiRoutes from "./src/backend/routes/apiRoutes";

const app = express();
const PORT = config.port;

// Enable JSON parser with sufficient limit for base64 images
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

/**
 * HTTP REQUEST AUDITING MIDDLEWARE
 */
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    Logger.http(req.method, req.originalUrl || req.url, res.statusCode, duration);
  });
  next();
});

// --- MOUNT CORE API LAYER ROUTES ---
app.use("/api", apiRoutes);

// --- VITE MIDDLEWARE SETUP FOR FULL-STACK INTEGRATION ---
async function startServer() {
  if (config.nodeEnv !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    Logger.info("Vite middleware mounted in Development mode.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    Logger.info("Static file server mounted in Production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    Logger.info(`ResQLink Civic AI server running on http://localhost:${PORT}`);
  });
}

startServer();
export default app;
