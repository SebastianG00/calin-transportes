import { getServiceClient } from "./client.js";

export async function insertEmail(row: { load_id: string; template_id: string | null; draft_text: string }) {
  const { data, error } = await getServiceClient()
    .from("delivery_emails").insert({ ...row, status: "draft", created_by: "office" }).select().single();
  if (error) throw error;
  return data;
}
export async function getEmail(id: string) {
  const { data, error } = await getServiceClient().from("delivery_emails").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}
export async function updateEmail(id: string, patch: Record<string, unknown>) {
  const { data, error } = await getServiceClient()
    .from("delivery_emails").update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id).select().single();
  if (error) throw error;
  return data;
}
