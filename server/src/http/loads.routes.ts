import { Router } from "express";
import { CreateLoadInput, ReassignInput, AdvanceInput, CancelInput } from "@tp/types";
import * as svc from "../services/loadService.js";

export const loadsRouter = Router();

loadsRouter.post("/", async (req, res, next) => {
  try { res.status(201).json(await svc.createAndAssign(CreateLoadInput.parse(req.body), req.userId!)); }
  catch (e) { next(e); }
});
loadsRouter.post("/:id/reassign", async (req, res, next) => {
  try { res.json(await svc.reassign(req.params.id, ReassignInput.parse(req.body), req.userId!)); } catch (e) { next(e); }
});
loadsRouter.post("/:id/advance", async (req, res, next) => {
  try { res.json(await svc.advance(req.params.id, AdvanceInput.parse(req.body), req.userId!)); } catch (e) { next(e); }
});
loadsRouter.post("/:id/cancel", async (req, res, next) => {
  try { res.json(await svc.cancel(req.params.id, CancelInput.parse(req.body), req.userId!)); } catch (e) { next(e); }
});
loadsRouter.post("/:id/remind", async (req, res, next) => {
  try { res.json(await svc.remind(req.params.id)); } catch (e) { next(e); }
});
loadsRouter.post("/:id/resend", async (req, res, next) => {
  try { res.json(await svc.resend(req.params.id)); } catch (e) { next(e); }
});
