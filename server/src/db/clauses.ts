import { getServiceClient } from "./client.js";

/** Global clauses (client_id null) plus, when clientId is given, that client's. */
export async function listClauses(clientId?: string) {
  let q = getServiceClient().from("requirement_clauses").select("*").eq("active", true);
  q = clientId
    ? q.or(`client_id.is.null,client_id.eq.${clientId}`)
    : q.is("client_id", null);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createClause(input: {
  client_id?: string | null; title: string; body: string;
  bucket: string; params?: Record<string, unknown>; source?: string;
}) {
  const { data, error } = await getServiceClient()
    .from("requirement_clauses")
    .insert({
      client_id: input.client_id ?? null,
      title: input.title, body: input.body, bucket: input.bucket,
      params: input.params ?? {}, source: input.source ?? "human",
    })
    .select().single();
  if (error) throw error;
  return data;
}

export async function updateClause(id: string, patch: Record<string, unknown>) {
  const { data, error } = await getServiceClient()
    .from("requirement_clauses")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deactivateClause(id: string) {
  const { data, error } = await getServiceClient()
    .from("requirement_clauses")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", id).select().single();
  if (error) throw error;
  return data;
}
