import { getServiceClient } from "./client.js";

export interface NewDocument {
  load_id: string;
  message_id: string | null;
  doc_type: string;
  ruc: string | null;
  serie: string | null;
  numero: string | null;
  fecha: string | null;
  phash: string | null;
  extracted: unknown;
  validation: unknown;
}

export async function insertDocument(d: NewDocument) {
  const { data, error } = await getServiceClient()
    .from("load_documents").insert(d).select().single();
  if (error) throw error;
  return data;
}

export async function getDocument(id: string) {
  const { data, error } = await getServiceClient()
    .from("load_documents").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function listPhashesForLoad(loadId: string): Promise<string[]> {
  const { data, error } = await getServiceClient()
    .from("load_documents").select("phash").eq("load_id", loadId).not("phash", "is", null);
  if (error) throw error;
  return (data ?? []).map((r) => r.phash as string);
}

export async function updateDocument(id: string, patch: Record<string, unknown>) {
  const { data, error } = await getServiceClient()
    .from("load_documents")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function insertDocumentEvent(
  document_id: string, kind: string, detail: unknown, actor: string,
) {
  const { error } = await getServiceClient()
    .from("document_events").insert({ document_id, kind, detail, actor });
  if (error) throw error;
}
