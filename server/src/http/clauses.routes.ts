import { Router } from "express";
import { z } from "zod";
import { ClauseInput } from "@tp/types";
import { listClauses, createClause, updateClause, deactivateClause } from "../db/clauses.js";
import { draftClauses } from "../ai/requirements.js";

export const clausesRouter = Router();

clausesRouter.get("/clauses", async (req, res, next) => {
  try {
    const raw = req.query.clientId;
    let clientId: string | undefined;
    if (raw !== undefined && raw !== "") {
      const parsed = z.string().uuid().safeParse(raw);
      if (!parsed.success) return res.status(400).json({ code: "VALIDATION", message: "clientId inválido." });
      clientId = parsed.data;
    }
    res.json(await listClauses(clientId));
  } catch (e) { next(e); }
});
clausesRouter.post("/clauses/draft", async (req, res, next) => {
  try {
    const prose = String(req.body?.prose ?? "");
    if (!prose.trim()) return res.status(400).json({ code: "NO_PROSE", message: "Falta el texto de requisitos." });
    res.json(await draftClauses(prose));
  } catch (e) { next(e); }
});
clausesRouter.post("/clauses", async (req, res, next) => {
  try { res.status(201).json(await createClause(ClauseInput.parse(req.body))); } catch (e) { next(e); }
});
clausesRouter.patch("/clauses/:id", async (req, res, next) => {
  try { res.json(await updateClause(req.params.id, ClauseInput.partial().parse(req.body))); } catch (e) { next(e); }
});
clausesRouter.delete("/clauses/:id", async (req, res, next) => {
  try { res.json(await deactivateClause(req.params.id)); } catch (e) { next(e); }
});
