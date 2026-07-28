import { Router } from "express";
import { DomainError } from "../domain/errors.js";
import { draftWhatsappForLoad } from "../services/whatsappDraftService.js";
import type { WhatsappIntent } from "../ai/whatsappDraft.js";

const INTENTS: WhatsappIntent[] = [
  "recordar_confirmacion",
  "pedir_foto_entrega",
  "aviso_reasignacion",
  "personalizado",
];

export const whatsappDraftRouter = Router();

whatsappDraftRouter.post("/loads/:id/whatsapp-draft", async (req, res, next) => {
  try {
    const intent = String(req.body?.intent ?? "") as WhatsappIntent;
    if (!INTENTS.includes(intent)) {
      throw new DomainError(400, "INVALID_INTENT", "Intención de mensaje no válida.");
    }
    const instruction = req.body?.instruction ? String(req.body.instruction) : undefined;
    res.json(await draftWhatsappForLoad(req.params.id, intent, instruction));
  } catch (e) { next(e); }
});
