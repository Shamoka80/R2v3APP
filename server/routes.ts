import type { Express } from "express";
import { createServer, type Server } from "http";
import adminImportRouter from "./routes/adminImport";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Admin routes
  app.use("/api/admin", adminImportRouter);

  const httpServer = createServer(app);
  return httpServer;
}
