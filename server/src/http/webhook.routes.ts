import { Router } from "express";
import twilio from "twilio";
import { config } from "../config.js";
import { processInbound } from "../services/inboundService.js";
import { logger } from "../logger.js";

export const webhookRouter = Router();

function twiml(message: string | null): string {
  if (!message) return "<Response></Response>";
  const escaped = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<Response><Message>${escaped}</Message></Response>`;
}

webhookRouter.post("/whatsapp", async (req, res) => {
  // Signature validation (skipped in tests).
  if (process.env.NODE_ENV !== "test") {
    const signature = req.header("x-twilio-signature") ?? "";
    const url = `${config.PUBLIC_URL ?? ""}/webhook/whatsapp`;
    const valid = twilio.validateRequest(config.TWILIO_AUTH_TOKEN, signature, url, req.body);
    if (!valid) { logger.warn("invalid twilio signature"); return res.status(403).send("forbidden"); }
  }
  try {
    const mediaUrl = req.body.NumMedia && Number(req.body.NumMedia) > 0 ? req.body.MediaUrl0 : null;
    const { reply } = await processInbound({
      sid: req.body.MessageSid, from: req.body.From, body: req.body.Body ?? "",
      mediaUrl, raw: req.body,
    });
    res.type("text/xml").send(twiml(reply));
  } catch (err) {
    logger.error({ err }, "webhook error");
    res.type("text/xml").send(twiml(null)); // never 500 back to Twilio
  }
});
