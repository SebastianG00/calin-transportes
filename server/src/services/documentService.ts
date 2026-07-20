import { randomUUID } from "node:crypto";
import { isLegalTransition } from "@tp/types";
import { getServiceClient } from "../db/client.js";
import { insertMessage } from "../db/messages.js";
import { getLoad, updateLoad, appendEvent } from "../db/loads.js";
import { getDocument, updateDocument, insertDocumentEvent } from "../db/documents.js";
import { processDocumentMessage, type PipelineResult } from "../pipeline/pipeline.js";
import { DomainError } from "../domain/errors.js";

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg" };

const DOC_TYPE_ES: Record<string, string> = {
  gre_remitente: "GRE Remitente",
  gre_transportista: "GRE Transportista",
  factura: "Factura",
  other: "sin clasificar",
};
const OVERALL_ES: Record<string, string> = { green: "verde", amber: "ámbar", red: "roja" };

function uploadEventReason(result: PipelineResult): string {
  if (result.outcome === "retake") return "Foto de guía rechazada por baja calidad — se pidió reintento";
  if (result.outcome === "duplicate") return "Foto de guía duplicada, ignorada";
  const doc = result.document as { doc_type?: string; validation?: { overall?: string } };
  const dt = DOC_TYPE_ES[doc.doc_type ?? "other"] ?? "documento";
  const ov = OVERALL_ES[doc.validation?.overall ?? ""] ?? "";
  return `Guía subida — validación ${ov} (${dt})`;
}

export async function uploadGuia(loadId: string, buf: Buffer, mime: string): Promise<PipelineResult> {
  await getLoad(loadId); // 404s via .single() if the load doesn't exist
  const ext = EXT[mime] ?? "jpg";
  const path = `uploads/${loadId}/${Date.now()}-${randomUUID()}.${ext}`;
  const { error } = await getServiceClient().storage.from("guias").upload(path, buf, { contentType: mime });
  if (error) throw error;
  const msg = await insertMessage({
    provider: "office", provider_message_sid: `office-${randomUUID()}`,
    direction: "in", load_id: loadId, media_storage_path: path, processed: false,
    body: "Foto de guía recibida",
  } as never);
  const result = await processDocumentMessage((msg as { id: string }).id);
  await appendEvent(loadId, null, null, "office", "office", uploadEventReason(result));
  return result;
}

export interface ConfirmInput { corrections?: Record<string, string>; peso_kg?: number }

export async function confirmDocument(docId: string, input: ConfirmInput, userId: string) {
  const doc = await getDocument(docId);
  if (doc.review_status !== "pending") {
    throw new DomainError(409, "NOT_PENDING", "Este documento ya fue revisado.");
  }

  // Merge human corrections into `extracted` (source flips to 'human'); never
  // overwrite silently — each change is an append-only correction event.
  const extracted = { ...(doc.extracted as Record<string, { value?: string; source?: string; checks?: string[] }>) };
  const corrections = { ...(input.corrections ?? {}) };
  if (input.peso_kg !== undefined) corrections.peso_kg = String(input.peso_kg);

  for (const [field, newVal] of Object.entries(corrections)) {
    const oldVal = extracted[field]?.value ?? null;
    if (String(oldVal ?? "") === String(newVal)) continue;
    extracted[field] = { value: newVal, source: "human", checks: [] };
    await insertDocumentEvent(docId, "correction", { field, from: oldVal, to: newVal }, userId);
  }

  const confirmedByUuid = /^[0-9a-f-]{36}$/i.test(userId) ? userId : null;
  const document = await updateDocument(docId, {
    review_status: "confirmed", extracted,
    confirmed_by: confirmedByUuid, confirmed_at: new Date().toISOString(),
  });
  await insertDocumentEvent(docId, "confirmed", { corrections }, userId);

  // Attach = advance the load to delivered, but only if legal (state machine is
  // authoritative). A guía normally arrives while the load is en_route.
  const load = await getLoad(doc.load_id);
  let loadStatusChanged = false;
  if (isLegalTransition(load.status, "delivered")) {
    await updateLoad(doc.load_id, { status: "delivered" });
    await appendEvent(doc.load_id, load.status, "delivered", "office", userId, "guía confirmada");
    loadStatusChanged = true;
  } else {
    await appendEvent(doc.load_id, null, null, "office", userId, "Guía confirmada");
  }
  return { document, loadStatusChanged };
}

export async function rejectDocument(docId: string, reason: string, userId: string) {
  const doc = await getDocument(docId);
  if (doc.review_status !== "pending") {
    throw new DomainError(409, "NOT_PENDING", "Este documento ya fue revisado.");
  }
  const document = await updateDocument(docId, { review_status: "rejected" });
  await insertDocumentEvent(docId, "rejected", { reason }, userId);
  await appendEvent(doc.load_id, null, null, "office", userId, "Guía rechazada en revisión");
  return document;
}

export async function getDocumentDetail(docId: string) {
  const doc = await getDocument(docId);
  const db = getServiceClient();
  const { data: load } = await db.from("loads")
    .select("*, client:clients(name,ruc), driver:drivers(name), unit:units(plate)")
    .eq("id", doc.load_id).single();
  let photoUrl: string | null = null;
  const { data: msg } = doc.message_id
    ? await db.from("messages").select("media_storage_path").eq("id", doc.message_id).single()
    : { data: null };
  const path = (msg as { media_storage_path?: string } | null)?.media_storage_path;
  if (path) {
    const signed = await db.storage.from("guias").createSignedUrl(path, 300);
    photoUrl = signed.data?.signedUrl ?? null;
  }
  return { document: doc, load: load ?? {}, photoUrl };
}

export async function listLoadDocuments(loadId: string) {
  const db = getServiceClient();
  const { data, error } = await db.from("load_documents")
    .select("*, message:messages(media_storage_path)")
    .eq("load_id", loadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as Array<Record<string, unknown> & { message?: { media_storage_path?: string } | null }>;
  return Promise.all(rows.map(async ({ message, ...doc }) => {
    const path = message?.media_storage_path;
    let photoUrl: string | null = null;
    if (path) {
      const signed = await db.storage.from("guias").createSignedUrl(path, 300);
      photoUrl = signed.data?.signedUrl ?? null;
    }
    return { ...doc, photoUrl } as Record<string, unknown> & { photoUrl: string | null };
  }));
}
