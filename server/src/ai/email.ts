import { getAnthropic, CLAUDE_MODEL } from "./client.js";

const SYSTEM = `Eres el asistente de oficina de una empresa de transporte de carga en Perú.
Redactas un correo breve y profesional en español para confirmar al cliente que su carga fue entregada.
REGLA CRÍTICA: usa solo los datos proporcionados. No inventes números, fechas, montos ni hechos.
Si falta un dato, omítelo; nunca lo adivines. Tono cordial y claro. Devuelve solo el texto del correo.`;

function textFrom(res: { content: Array<{ type: string; text?: string }> }): string {
  return res.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("").trim();
}

/** data = only confirmed structured values. revise = optional "make it shorter" etc. */
export async function composeEmail(data: Record<string, string>, revise?: string): Promise<string> {
  const dataLines = Object.entries(data)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");
  const instruction = revise
    ? `Reescribe el correo con este ajuste: "${revise}". Usa únicamente estos datos confirmados:\n${dataLines}`
    : `Redacta el correo de confirmación de entrega. Usa únicamente estos datos confirmados:\n${dataLines}`;

  const res = await getAnthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system: SYSTEM,
    messages: [{ role: "user", content: instruction }],
  });
  return textFrom(res as { content: Array<{ type: string; text?: string }> });
}
