import { randomUUID } from "node:crypto";
import { getServiceClient } from "../db/client.js";
import { extractFactura, FACTURA_FIELDS } from "../ai/facturaVision.js";
import { ocrWordBoxes, groundFields } from "../pipeline/ocr.js";
import { facturasToCsv, type FacturaCsvRow } from "./facturaCsv.js";
import { DomainError } from "../domain/errors.js";

const BUCKET = "facturas";

export async function uploadFactura(buf: Buffer, mime: string): Promise<{ id: string }> {
  const db = getServiceClient();
  const ext = mime.includes("png") ? "png" : "jpg";
  const path = `uploads/${Date.now()}-${randomUUID()}.${ext}`;
  const up = await db.storage.from(BUCKET).upload(path, buf, { contentType: mime });
  if (up.error) throw up.error;
  const { data, error } = await db.from("facturas")
    .insert({ image_path: path, extracted: {}, review_status: "pending" })
    .select("id").single();
  if (error) throw error;
  return { id: (data as { id: string }).id };
}

async function signedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await getServiceClient().storage.from(BUCKET).createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}

function notPendingError(): DomainError {
  return new DomainError(409, "NOT_PENDING", "Esta factura ya fue revisada.");
}

// confirmed_by FK-references auth.users; null out non-UUID actors (e.g. "office")
// so they don't trip the constraint — mirrors documentService's guard.
function actorUuid(userId: string): string | null {
  return /^[0-9a-f-]{36}$/i.test(userId) ? userId : null;
}

export interface EnrichedFactura { factura: Record<string, unknown>; photoUrl: string | null; }

export async function extractFacturaDoc(id: string): Promise<EnrichedFactura> {
  const db = getServiceClient();
  const { data: f, error } = await db.from("facturas").select("*").eq("id", id).single();
  if (error) throw error;
  const factura = f as Record<string, unknown>;
  if (factura.review_status !== "pending") {
    throw notPendingError();
  }
  const path = factura.image_path as string;
  const dl = await db.storage.from(BUCKET).download(path);
  if (dl.error) throw dl.error;
  const buf = Buffer.from(await dl.data.arrayBuffer());
  const mime = path.endsWith(".png") ? "image/png" : "image/jpeg";

  const extraction = await extractFactura(buf, mime);
  const words = await ocrWordBoxes(buf);
  const forGrounding: Record<string, { verbatim: string }> = {};
  for (const k of FACTURA_FIELDS) forGrounding[k] = { verbatim: extraction[k].verbatim };
  const boxes = groundFields(forGrounding, words);

  const extracted: Record<string, unknown> = {};
  for (const k of FACTURA_FIELDS) {
    extracted[k] = { value: extraction[k].value, verbatim: extraction[k].verbatim, source: "vlm", bbox: boxes[k] ?? null };
  }
  const { data: updated, error: uErr } = await db.from("facturas")
    .update({ extracted, updated_at: new Date().toISOString() })
    .eq("id", id).eq("review_status", "pending").select("*");
  if (uErr) throw uErr;
  if (!updated || updated.length === 0) throw notPendingError();
  return { factura: updated[0] as Record<string, unknown>, photoUrl: await signedUrl(path) };
}

export async function confirmFactura(
  id: string,
  input: { corrections?: Record<string, string>; client_id?: string | null },
  userId: string,
) {
  const db = getServiceClient();
  const { data: f, error } = await db.from("facturas").select("*").eq("id", id).single();
  if (error) throw error;
  const factura = f as Record<string, unknown>;
  if (factura.review_status !== "pending") {
    throw notPendingError();
  }
  const extracted = { ...(factura.extracted as Record<string, { value?: string; verbatim?: string; source?: string; bbox?: unknown }>) };
  for (const [field, newVal] of Object.entries(input.corrections ?? {})) {
    const prev = extracted[field] ?? {};
    extracted[field] = { ...prev, value: newVal, source: "human" };
  }
  const clientId = input.client_id !== undefined ? input.client_id : (factura.client_id ?? null);
  const { data, error: uErr } = await db.from("facturas").update({
    review_status: "confirmed", extracted, client_id: clientId,
    confirmed_by: actorUuid(userId), confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq("id", id).eq("review_status", "pending").select("*");
  if (uErr) throw uErr;
  if (!data || data.length === 0) throw notPendingError();
  return data[0];
}

export async function rejectFactura(id: string, userId: string) {
  const db = getServiceClient();
  const { data: f, error } = await db.from("facturas").select("review_status").eq("id", id).single();
  if (error) throw error;
  if ((f as { review_status?: string } | null)?.review_status !== "pending") {
    throw notPendingError();
  }
  const { data, error: uErr } = await db.from("facturas")
    .update({ review_status: "rejected", confirmed_by: actorUuid(userId), updated_at: new Date().toISOString() })
    .eq("id", id).eq("review_status", "pending").select("*");
  if (uErr) throw uErr;
  if (!data || data.length === 0) throw notPendingError();
  return data[0];
}

export async function listFacturas(status?: string) {
  const db = getServiceClient();
  let q = db.from("facturas").select("*, client:clients(name)").order("created_at", { ascending: false });
  if (status) q = q.eq("review_status", status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getFacturaDetail(id: string): Promise<EnrichedFactura> {
  const db = getServiceClient();
  const { data, error } = await db.from("facturas").select("*, client:clients(name)").eq("id", id).single();
  if (error) throw error;
  const factura = data as Record<string, unknown>;
  return { factura, photoUrl: await signedUrl(factura.image_path as string) };
}

function fieldValue(extracted: unknown, key: string): string {
  const f = (extracted as Record<string, { value?: string }> | null)?.[key];
  return f?.value ?? "";
}

export async function exportFacturasCsv(month: string): Promise<string> {
  const db = getServiceClient();
  const { data, error } = await db.from("facturas")
    .select("*, client:clients(name)").eq("review_status", "confirmed");
  if (error) throw error;
  const rows: FacturaCsvRow[] = [];
  for (const f of (data ?? []) as Array<Record<string, unknown> & { client?: { name?: string } | null }>) {
    const ex = f.extracted;
    const fecha = fieldValue(ex, "fecha_emision");
    if (!fecha.startsWith(month)) continue; // month = "YYYY-MM"
    rows.push({
      fecha_emision: fecha,
      ruc_emisor: fieldValue(ex, "ruc_emisor"),
      razon_social: fieldValue(ex, "razon_social"),
      serie: fieldValue(ex, "serie"),
      numero: fieldValue(ex, "numero"),
      moneda: fieldValue(ex, "moneda"),
      subtotal: fieldValue(ex, "subtotal"),
      igv: fieldValue(ex, "igv"),
      total: fieldValue(ex, "total"),
      cliente: f.client?.name ?? "",
      factura_id: f.id as string,
    });
  }
  rows.sort((a, b) => a.fecha_emision.localeCompare(b.fecha_emision));
  return facturasToCsv(rows);
}
