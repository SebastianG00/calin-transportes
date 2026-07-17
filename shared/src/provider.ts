export type TemplateName = "asignacion" | "recordatorio" | "reasignacion";

export interface WhatsAppProvider {
  send(to: string, template: TemplateName, vars: string[]): Promise<{ sid: string }>;
}

/** Strip a 'whatsapp:' channel prefix and return pure E.164 (+digits). */
export function normalizeE164(raw: string): string {
  return raw.replace(/^whatsapp:/i, "").trim();
}
