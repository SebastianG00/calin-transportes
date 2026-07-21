import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import { DomainError } from "../domain/errors.js";

let client: Anthropic | null = null;

/** Lazily construct the Anthropic client. Throws a friendly 503 when the API
 *  key is unset so the server still boots and other endpoints keep working. */
export function getAnthropic(): Anthropic {
  if (!config.ANTHROPIC_API_KEY) {
    throw new DomainError(503, "AI_UNCONFIGURED", "El asistente de IA no está configurado (falta ANTHROPIC_API_KEY).");
  }
  if (!client) client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  return client;
}

export const CLAUDE_MODEL = config.CLAUDE_MODEL;
