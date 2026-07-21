import { z } from "zod/v4";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, CLAUDE_MODEL } from "./client.js";

const DraftSchema = z.object({
  clauses: z.array(z.object({
    title: z.string(),
    body: z.string(),
    bucket: z.enum(["reconcile", "verify", "attest"]),
    params: z.record(z.string(), z.unknown()),
  })),
});

export interface ClauseDraft {
  title: string; body: string;
  bucket: "reconcile" | "verify" | "attest";
  params: Record<string, unknown>;
}

const SYSTEM = `Eres un asistente para una empresa de transporte de carga en Perú.
Conviertes los requisitos de entrega que un cliente escribe en prosa en cláusulas estructuradas.
Cada cláusula pertenece a un "bucket" según cómo se puede verificar:
- "reconcile": comprobable contra los datos de la carga (peso, fecha de entrega, placa). Cuando aplique, incluye el valor en params (p. ej. {"max_peso_kg": 9000}).
- "verify": comprobable en la foto de la guía firmada que retorna el chofer (firma presente, sello presente).
- "attest": condición del mundo físico que solo una persona puede confirmar (camión limpio, sin olores, EPP, número de paradas).
Escribe títulos cortos y cuerpos claros en español. No inventes requisitos que no estén en el texto. Devuelve un arreglo (posiblemente vacío).`;

export async function draftClauses(prose: string): Promise<ClauseDraft[]> {
  const res = await getAnthropic().messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: { format: zodOutputFormat(DraftSchema), effort: "medium" },
    system: SYSTEM,
    messages: [{ role: "user", content: prose }],
  });
  const parsed = res.parsed_output as z.infer<typeof DraftSchema> | null;
  return parsed?.clauses ?? [];
}
