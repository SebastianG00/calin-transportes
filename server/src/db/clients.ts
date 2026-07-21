import { getServiceClient } from "./client.js";

export async function listClients() {
  const { data, error } = await getServiceClient()
    .from("clients").select("*").eq("active", true).order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getClient(id: string) {
  const { data, error } = await getServiceClient()
    .from("clients").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function updateClient(id: string, patch: Record<string, unknown>) {
  const { data, error } = await getServiceClient()
    .from("clients")
    .update({ ...patch })
    .eq("id", id).select().single();
  if (error) throw error;
  return data;
}
