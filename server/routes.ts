import type { Express } from "express";
import { createServer, type Server } from "http";
import adminImportRouter from "./routes/adminImport";
import assessmentsRouter from "./routes/assessments";
import answersRouter from "./routes/answers";
import exportsRouter from "./routes/exports";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Admin routes
  app.use("/api/admin", adminImportRouter);

  // Assessment routes
  app.use("/api/assessments", assessmentsRouter);

  // Answer routes
  app.use("/api/answers", answersRouter);

  // Export routes
  app.use("/api/exports", exportsRouter);

  // Safe root fallback for Replit preview
  app.get('/', (_req, res) => {
    res.type('html').send('<h1>RUR2 API</h1><p>OK</p><p><a href="/api/health">/api/health</a></p>');
  });

  const httpServer = createServer(app);
  return httpServer;
}
