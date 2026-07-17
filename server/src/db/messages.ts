import { getServiceClient } from "./client.js";

export interface NewMessage {
  provider: string;
  provider_message_sid: string;
  direction: "in" | "out";
  from_phone?: string | null;
  to_phone?: string | null;
  driver_id?: string | null;
  load_id?: string | null;
  template_name?: string | null;
  body?: string | null;
  media_url?: string | null;
  media_storage_path?: string | null;
  status?: string | null;
  raw_payload?: unknown;
}

export async function messageExists(sid: string): Promise<boolean> {
  const { data, error } = await getServiceClient()
    .from("messages")
    .select("id")
    .eq("provider_message_sid", sid)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function insertMessage(m: NewMessage) {
  const { data, error } = await getServiceClient().from("messages").insert(m).select().single();
  if (error) throw error;
  return data;
}
