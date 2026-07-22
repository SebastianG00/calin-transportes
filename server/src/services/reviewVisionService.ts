import { getServiceClient } from "../db/client.js";
import { getDocument, updateDocument, insertDocumentEvent } from "../db/documents.js";
import { getApprovedVerifyClauses } from "../db/guias.js";
import { extractGuia, TEXT_FIELDS } from "../ai/guiaVision.js";
import { ocrWordBoxes, groundFields } from "../pipeline/ocr.js";
import { reconcileGuiaWithLoad, composeValidation, type Check } from "../pipeline/validate.js";

const EXT_MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };

export interface VerifyClauseCheck { title: string; body: string; finding: "firma" | "sello" | "none"; present: boolean; }
export interface EnrichedDetail {
  document: Record<string, unknown>; load: Record<string, unknown>;
  photoUrl: string | null; verifyClauses: VerifyClauseCheck[];
}

export async function extractDocument(docId: string): Promise<EnrichedDetail> {
  const doc = await getDocument(docId);
  const db = getServiceClient();

  // Load the stored photo bytes (mirror pipeline.ts).
  const { data: msg } = doc.message_id
    ? await db.from("messages").select("media_storage_path").eq("id", doc.message_id).single()
    : { data: null };
  const path = (msg as { media_storage_path?: string } | null)?.media_storage_path;
  if (!path) throw new Error("El documento no tiene una imagen almacenada.");
  const dl = await db.storage.from("guias").download(path);
  if (dl.error || !dl.data) throw dl.error ?? new Error("No se pudo descargar la imagen.");
  const buf = Buffer.from(await dl.data.arrayBuffer());
  const mime = EXT_MIME[path.split(".").pop()?.toLowerCase() ?? "jpg"] ?? "image/jpeg";

  // The one AI call + deterministic OCR grounding.
  const extraction = await extractGuia(buf, mime);
  const words = await ocrWordBoxes(buf);
  const textFieldsForGrounding = Object.fromEntries(
    TEXT_FIELDS.map((k) => [k, { verbatim: extraction[k].verbatim }]),
  );
  const boxes = groundFields(textFieldsForGrounding, words);

  // Reconcile against the load.
  const { data: load } = await db.from("loads")
    .select("*, client:clients(name,ruc), driver:drivers(name), unit:units(plate)")
    .eq("id", doc.load_id).single();
  const l = (load ?? {}) as Record<string, any>;
  const checks: Check[] = reconcileGuiaWithLoad(
    { peso: extraction.peso.value, destino: extraction.destino.value,
      fecha_entrega: extraction.fecha_entrega.value, placa: extraction.placa.value },
    { weightKg: Number(l.weight_kg ?? 0), destination: String(l.destination ?? ""),
      scheduledDate: String(l.scheduled_date ?? ""), plate: String(l.unit?.plate ?? "") },
  );
  const validation = composeValidation(checks);
  const flagField = (f: string) => checks.filter((c) => c.field === f).map((c) => c.reason_code);

  // Build extracted (source 'vlm') — 11 text fields + 2 boolean flags.
  const extracted: Record<string, unknown> = {};
  for (const k of TEXT_FIELDS) {
    extracted[k] = { value: extraction[k].value, verbatim: extraction[k].verbatim, source: "vlm",
      bbox: boxes[k] ?? null, checks: flagField(k === "peso" ? "peso" : k === "destino" ? "destino" : k === "placa" ? "placa" : k === "fecha_entrega" ? "fecha" : k) };
  }
  extracted.firma_presente = { value: String(extraction.firma_presente), source: "vlm", checks: [] };
  extracted.sello_presente = { value: String(extraction.sello_presente), source: "vlm", checks: [] };

  const document = await updateDocument(docId, { extracted, validation });
  await insertDocumentEvent(docId, "vlm_extracted", { extraction, wordCount: words.length, validation }, "system");

  // Loop-closure: the load's pre-trip verify clauses vs the VLM findings.
  const verifyClauseRows = await getApprovedVerifyClauses(doc.load_id);
  const verifyClauses: VerifyClauseCheck[] = verifyClauseRows.map((c) => {
    const t = `${c.title} ${c.body}`.toLowerCase();
    if (/sello/.test(t)) return { ...c, finding: "sello", present: extraction.sello_presente };
    if (/firma/.test(t)) return { ...c, finding: "firma", present: extraction.firma_presente };
    return { ...c, finding: "none", present: false };
  });

  // Signed photo URL for the workbench.
  let photoUrl: string | null = null;
  const signed = await db.storage.from("guias").createSignedUrl(path, 300);
  photoUrl = signed.data?.signedUrl ?? null;

  return { document, load: load ?? {}, photoUrl, verifyClauses };
}
