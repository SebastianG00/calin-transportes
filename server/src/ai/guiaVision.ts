import { z } from "zod/v4"; // v4 subpath — zodOutputFormat calls z.toJSONSchema (see Spec-1 Task 10)
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, CLAUDE_MODEL } from "./client.js";

const TextField = z.object({ value: z.string(), verbatim: z.string() });

const ExtractionSchema = z.object({
  receptor: TextField,
  ruc_receptor: TextField,
  fecha_entrega: TextField,
  peso: TextField,
  bultos: TextField,
  destino: TextField,
  conductor: TextField,
  placa: TextField,
  guia_serie: TextField,
  guia_numero: TextField,
  observaciones: TextField,
  firma_presente: z.boolean(),
  sello_presente: z.boolean(),
});

export type GuiaExtraction = z.infer<typeof ExtractionSchema>;
export type TextFieldKey =
  | "receptor" | "ruc_receptor" | "fecha_entrega" | "peso" | "bultos" | "destino"
  | "conductor" | "placa" | "guia_serie" | "guia_numero" | "observaciones";
export const TEXT_FIELDS: TextFieldKey[] = [
  "receptor", "ruc_receptor", "fecha_entrega", "peso", "bultos", "destino",
  "conductor", "placa", "guia_serie", "guia_numero", "observaciones",
];

type Media = "image/png" | "image/jpeg" | "image/gif" | "image/webp";
function toMedia(mime: string): Media {
  if (mime === "image/jpg") return "image/jpeg";
  if (mime === "image/png" || mime === "image/jpeg" || mime === "image/gif" || mime === "image/webp") return mime;
  return "image/jpeg";
}

const SYSTEM = `Eres un asistente que lee guías de remisión (constancias de entrega) peruanas a partir de una foto.
Devuelve SOLO lo que ves en la imagen; NO inventes datos.
Para cada campo de texto entrega dos cosas:
- "value": el dato normalizado (peso solo el número p. ej. "8900"; fecha en formato AAAA-MM-DD si es legible),
- "verbatim": el texto EXACTAMENTE como aparece escrito en la guía (con sus comas, ceros y unidades) para poder ubicarlo en la imagen.
Si un campo no aparece, usa "" tanto en value como en verbatim.
firma_presente = true SOLO si hay una firma manuscrita del receptor; sello_presente = true SOLO si hay un sello estampado.`;

export async function extractGuia(image: Buffer, mime: string): Promise<GuiaExtraction> {
  const res = await getAnthropic().messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: { format: zodOutputFormat(ExtractionSchema), effort: "low" },
    system: SYSTEM,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: toMedia(mime), data: image.toString("base64") } },
        { type: "text", text: "Lee esta guía de remisión firmada y extrae los campos." },
      ],
    }],
  });
  const parsed = res.parsed_output as GuiaExtraction | null;
  if (!parsed) throw new Error("El modelo no devolvió datos estructurados de la guía.");
  return parsed;
}
