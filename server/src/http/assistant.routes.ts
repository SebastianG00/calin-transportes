import { Router } from "express";
import { DomainError } from "../domain/errors.js";
import { askAssistant } from "../ai/assistant/ask.js";

export const assistantRouter = Router();

assistantRouter.post("/assistant/ask", async (req, res, next) => {
  try {
    const question = String(req.body?.question ?? "").trim();
    if (!question) throw new DomainError(400, "EMPTY_QUESTION", "Escribe una pregunta.");
    res.json(await askAssistant(question));
  } catch (e) { next(e); }
});
