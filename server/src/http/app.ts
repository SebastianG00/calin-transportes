import express from "express";
import { requireAuth } from "./auth.js";
import { errorHandler } from "./errorHandler.js";
import { documentsRouter } from "./documents.routes.js";
import { clausesRouter } from "./clauses.routes.js";
import { clientsRouter } from "./clients.routes.js";
import { emailsRouter } from "./emails.routes.js";
import { guiasRouter } from "./guias.routes.js";
import { loadsRouter } from "./loads.routes.js";
import { masterDataRouter } from "./masterData.routes.js";
import { webhookRouter } from "./webhook.routes.js";

export function createApp() {
  const app = express();
  // Twilio posts urlencoded, not JSON — this must come before express.json().
  app.use("/webhook", express.urlencoded({ extended: false }), webhookRouter);
  app.use(express.json());
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/loads", requireAuth, loadsRouter);  // /api/loads*
  app.use("/api", requireAuth, masterDataRouter);   // /api/drivers, /api/units
  app.use("/api", requireAuth, documentsRouter);   // /api/loads/:id/documents, /api/documents*
  app.use("/api", requireAuth, clausesRouter);      // /api/clauses*
  app.use("/api", requireAuth, clientsRouter);       // /api/clients*
  app.use("/api", requireAuth, guiasRouter);         // /api/loads/:id/guias, /api/guias*
  app.use("/api", requireAuth, emailsRouter);        // /api/loads/:id/emails, /api/emails*
  app.use(errorHandler);
  return app;
}
