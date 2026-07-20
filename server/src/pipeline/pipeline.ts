// Deterministic orchestrator: a photo `messages` row → a `load_documents` row
// (review_status 'pending') or a retake verdict. NEVER mutates the load and
// NEVER sends WhatsApp (the caller owns retake messaging). No AI.
import { parseSunatQr } from "@tp/types";
import { getServiceClient } from "../db/client.js";
import { decodeToRgba, decodeQr, toGrayscale, blurScore, meanLuminance, dHash } from "./image.js";
import { isDuplicate } from "./dedup.js";
import { checkFormat, reconcileWithLoad, composeValidation, type Check } from "./validate.js";
import {
  insertDocument, listPhashesForLoad, insertDocumentEvent,
} from "../db/documents.js";
import { logger } from "../logger.js";

// PROVISIONAL — tune on real photos.
export const BLUR_MIN = 40;
export const LUMA_MIN = 40;
export const LUMA_MAX = 245;

export type PipelineResult =
  | { outcome: "retake"; reason: string }
  | { outcome: "duplicate"; documentId: string }
  | { outcome: "created"; document: Record<string, unknown> };

async function markProcessed(messageId: string) {
  await getServiceClient().from("messages").update({ processed: true }).eq("id", messageId);
}

export async function processDocumentMessage(messageId: string): Promise<PipelineResult> {
  const db = getServiceClient();
  const { data: msg, error } = await db.from("messages").select("*").eq("id", messageId).single();
  if (error) throw error;
  if (!msg.media_storage_path || !msg.load_id) {
    await markProcessed(messageId);
    return { outcome: "retake", reason: "Mensaje sin imagen o sin carga asociada." };
  }

  // Download the stored image bytes.
  const dl = await db.storage.from("guias").download(msg.media_storage_path);
  if (dl.error || !dl.data) throw dl.error ?? new Error("download failed");
  const buf = Buffer.from(await dl.data.arrayBuffer());
  const img = await decodeToRgba(buf);
  const gray = toGrayscale(img);

  // Stage 0 — dedup vs prior docs on this load.
  const phash = dHash(img);
  const priors = await listPhashesForLoad(msg.load_id);
  if (isDuplicate(phash, priors)) {
    await markProcessed(messageId);
    // The already-processed doc keeps its row; we just don't create a second.
    return { outcome: "duplicate", documentId: "" };
  }

  // Stage 1 — quality gate.
  const blur = blurScore(gray, img.width, img.height);
  const luma = meanLuminance(gray);
  if (blur < BLUR_MIN || luma < LUMA_MIN || luma > LUMA_MAX) {
    await markProcessed(messageId);
    return { outcome: "retake", reason: `Foto de baja calidad (nitidez ${Math.round(blur)}, luz ${Math.round(luma)}).` };
  }

  // Stage 2/3 — classify + decode QR.
  const raw = decodeQr(img);
  const qr = raw ? parseSunatQr(raw) : null;

  // Load ground truth for reconciliation.
  const { data: load } = await db.from("loads").select("*, client:clients(ruc)").eq("id", msg.load_id).single();
  const clientRuc = (load?.client as { ruc?: string } | null)?.ruc ?? "";

  let docType = "other";
  let extracted: Record<string, unknown> = {};
  let checks: Check[] = [];
  let ruc: string | null = null, serie: string | null = null, numero: string | null = null, fecha: string | null = null;

  if (qr) {
    docType = qr.docType;
    ruc = qr.ruc; serie = qr.serie; numero = qr.numero; fecha = qr.fecha;
    checks = [
      ...checkFormat(qr),
      ...reconcileWithLoad(qr, { clientRuc, scheduledDate: String(load?.scheduled_date ?? "") }),
    ];
    // Per-field provenance — source 'qr', ready for Tier-2 bbox grounding.
    const fieldChecks = (f: string) => checks.filter((c) => c.field === f).map((c) => c.reason_code);
    extracted = {
      ruc: { value: qr.ruc, source: "qr", checks: fieldChecks("ruc") },
      serie: { value: qr.serie, source: "qr", checks: fieldChecks("serie") },
      numero: { value: qr.numero, source: "qr", checks: [] },
      fecha: { value: qr.fecha, source: "qr", checks: fieldChecks("fecha") },
      rucDestinatario: qr.rucDestinatario ? { value: qr.rucDestinatario, source: "qr", checks: [] } : undefined,
      montoTotal: qr.montoTotal ? { value: qr.montoTotal, source: "qr", checks: [] } : undefined,
    };
  } else {
    checks = [{ field: "qr", pass: false, reason_code: "NO_QR", message: "No se detectó un QR SUNAT legible." }];
  }

  const validation = composeValidation(checks);

  const document = await insertDocument({
    load_id: msg.load_id, message_id: messageId, doc_type: docType,
    ruc, serie, numero, fecha, phash, extracted, validation,
  });
  await insertDocumentEvent(document.id, "validated", validation, "system");
  await markProcessed(messageId);
  logger.info({ documentId: document.id, docType, overall: validation.overall }, "document processed");
  return { outcome: "created", document };
}
