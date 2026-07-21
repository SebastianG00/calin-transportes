import { getServiceClient } from "./client.js";

export async function insertGuia(row: {
  load_id: string; template_id: string | null;
  clauses: unknown; data: unknown; html: string;
}) {
  const { data, error } = await getServiceClient()
    .from("delivery_guias").insert({ ...row, status: "draft" }).select().single();
  if (error) throw error;
  return data;
}

export async function getGuia(id: string) {
  const { data, error } = await getServiceClient()
    .from("delivery_guias").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function updateGuia(id: string, patch: Record<string, unknown>) {
  const { data, error } = await getServiceClient()
    .from("delivery_guias")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function listGuiasForLoad(loadId: string) {
  const { data, error } = await getServiceClient()
    .from("delivery_guias").select("*")
    .eq("load_id", loadId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** The client's 'guia' template, or the default (client_id null), or null. */
export async function getGuiaTemplate(clientId: string) {
  const db = getServiceClient();
  const forClient = await db.from("document_templates").select("*")
    .eq("kind", "guia").eq("client_id", clientId).limit(1).maybeSingle();
  if (forClient.data) return forClient.data;
  const def = await db.from("document_templates").select("*")
    .eq("kind", "guia").is("client_id", null).limit(1).maybeSingle();
  return def.data ?? null;
}
