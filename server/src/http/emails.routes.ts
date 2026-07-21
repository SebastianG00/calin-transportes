import { Router } from "express";
import { draftEmail, redraftEmail, saveEmail } from "../services/emailService.js";

export const emailsRouter = Router();

emailsRouter.post("/loads/:id/emails", async (req, res, next) => {
  try { res.status(201).json(await draftEmail(req.params.id)); } catch (e) { next(e); }
});
emailsRouter.post("/emails/:id/redraft", async (req, res, next) => {
  try { res.json(await redraftEmail(req.params.id, String(req.body?.revise ?? ""))); } catch (e) { next(e); }
});
emailsRouter.patch("/emails/:id", async (req, res, next) => {
  try { res.json(await saveEmail(req.params.id, String(req.body?.edited_text ?? ""))); } catch (e) { next(e); }
});
