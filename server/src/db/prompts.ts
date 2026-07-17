import { getServiceClient } from "./client.js";

export async function insertPrompt(
  driver_id: string,
  kind: string,
  target_event_id: string | null,
  expires_at: string,
) {
  const { error } = await getServiceClient()
    .from("pending_prompts")
    .insert({ driver_id, kind, target_event_id, expires_at });
  if (error) throw error;
}

export async function findLivePrompt(driver_id: string, kind: string) {
  const { data, error } = await getServiceClient()
    .from("pending_prompts")
    .select("*")
    .eq("driver_id", driver_id)
    .eq("kind", kind)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deletePrompt(id: string) {
  const { error } = await getServiceClient().from("pending_prompts").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteExpiredPrompts(): Promise<number> {
  const { data, error } = await getServiceClient()
    .from("pending_prompts")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}
