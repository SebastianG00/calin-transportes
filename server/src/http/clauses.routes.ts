import { Router } from "express";
import { ClauseInput } from "@tp/types";
import { listClauses, createClause, updateClause, deactivateClause } from "../db/clauses.js";

export const clausesRouter = Router();

clausesRouter.get("/clauses", async (req, res, next) => {
  try { res.json(await listClauses((req.query.clientId as string) || undefined)); } catch (e) { next(e); }
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
