import { z } from "zod/v4";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, CLAUDE_MODEL } from "../client.js";
import { getServiceClient } from "../../db/client.js";
import { CATALOG, CATALOG_NAMES } from "./catalog/index.js";
import { ClarifyError, type AssistantAnswer } from "./types.js";

const NO_PUEDO = "No puedo responder eso todavía.";

const SelectionSchema = z.object({
  tool: z.enum([...CATALOG_NAMES, "none"] as unknown as [string, ...string[]]),
  params: z.record(z.string(), z.string()).default({}),
});

function selectionSystem(): string {
  const list = CATALOG.map((t) => `- ${t.name}: ${t.description}`).join("\n");
  return `Eres un asistente de datos de una empresa de transporte en Perú. Debes elegir UNA herramienta de la lista que responda la pregunta usando SOLO los datos disponibles, y extraer sus params.
Si NINGUNA herramienta aplica (p. ej. preguntas generales, matemáticas, temas ajenos), devuelve tool:"none".
No inventes params; usa solo los valores que aparezcan en la pregunta.
Herramientas:
${list}`;
}

const GLOSS_SYSTEM = `Eres un asistente de datos en español. Escribe UNA sola frase breve que responda la pregunta usando ÚNICAMENTE los resultados de la consulta proporcionados. No inventes números ni datos que no estén en los resultados. Devuelve solo la frase.`;

function textFrom(res: { content: Array<{ type: string; text?: string }> }): string {
  return res.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("").trim();
}

export async function askAssistant(question: string): Promise<AssistantAnswer> {
  // 1) selection (structured output)
  const sel = await getAnthropic().messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    output_config: { format: zodOutputFormat(SelectionSchema), effort: "low" },
    system: selectionSystem(),
    messages: [{ role: "user", content: question }],
  });
  const choice = sel.parsed_output as { tool: string; params: Record<string, string> } | null;
  if (!choice || choice.tool === "none") return { answer: NO_PUEDO, table: null, tool: null };

  const tool = CATALOG.find((t) => t.name === choice.tool);
  if (!tool) return { answer: NO_PUEDO, table: null, tool: null };

  // 2) validate params + run the hand-written query
  let result;
  try {
    const params = tool.schema.parse(choice.params ?? {});
    result = await tool.run(params, getServiceClient());
  } catch (e) {
    if (e instanceof ClarifyError) return { answer: e.message, table: null, tool: tool.name };
    throw e; // real error → errorHandler
  }

  // 3) gloss (plain text, restate-only)
  const gloss = await getAnthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 512,
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    system: GLOSS_SYSTEM,
    messages: [{
      role: "user",
      content: `Pregunta: ${question}\nResultados: ${JSON.stringify({ summary: result.summary, columns: result.columns, rows: result.rows.slice(0, 20) })}`,
    }],
  });
  const answer = textFrom(gloss as { content: Array<{ type: string; text?: string }> }) || result.summary;
  return { answer, table: { columns: result.columns, rows: result.rows }, tool: tool.name };
}
