import { z } from "zod/v4"; // v4 subpath — zodOutputFormat calls z.toJSONSchema
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, CLAUDE_MODEL } from "./client.js";

const TextField = z.object({ value: z.string(), verbatim: z.string() });

const ExtractionSchema = z.object({
  ruc_emisor: TextField,
  razon_social: TextField,
  fecha_emision: TextField,
  serie: TextField,
  numero: TextField,
  moneda: TextField,
  subtotal: TextField,
  igv: TextField,
  total: TextField,
});

export type FacturaExtraction = z.infer<typeof ExtractionSchema>;
export type FacturaFieldKey =
  | "ruc_emisor" | "razon_social" | "fecha_emision" | "serie" | "numero"
  | "moneda" | "subtotal" | "igv" | "total";
export const FACTURA_FIELDS: FacturaFieldKey[] = [
  "ruc_emisor", "razon_social", "fecha_emision", "serie", "numero",
  "moneda", "subtotal", "igv", "total",
];

type Media = "image/png" | "image/jpeg" | "image/gif" | "image/webp";
function toMedia(mime: string): Media {
  if (mime === "image/jpg") return "image/jpeg";
  if (mime === "image/png" || mime === "image/jpeg" || mime === "image/gif" || mime === "image/webp") return mime;
  return "image/jpeg";
}

const SYSTEM = `Eres un asistente que lee facturas peruanas a partir de una foto o escaneo.
Devuelve SOLO lo que ves en la imagen; NO inventes datos.
Para cada campo entrega dos cosas:
- "value": el dato normalizado (montos solo el número p. ej. "1180.00"; fecha en formato AAAA-MM-DD si es legible; moneda "PEN" o "USD"),
- "verbatim": el texto EXACTAMENTE como aparece en la factura (con comas, símbolos y ceros) para poder ubicarlo en la imagen.
Si un campo no aparece, usa "" tanto en value como en verbatim.
ruc_emisor = el RUC de quien emite la factura; razon_social = el nombre de la empresa emisora.`;

export async function extractFactura(image: Buffer, mime: string): Promise<FacturaExtraction> {
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
        { type: "text", text: "Lee esta factura y extrae los campos para el contador." },
      ],
    }],
  });
  const parsed = res.parsed_output as FacturaExtraction | null;
  if (!parsed) throw new Error("El modelo no devolvió datos estructurados de la factura.");
  return parsed;
}
