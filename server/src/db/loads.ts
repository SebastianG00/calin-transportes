import { getServiceClient } from "./client.js";
import { LoadStatus, EventSource } from "@tp/types";

export interface SweptLoad {
  id: string;
  assigned_driver_id: string;
  cargo_description: string;
  destination: string;
}

export async function insertLoad(row: Record<string, unknown>) {
  const { data, error } = await getServiceClient().from("loads").insert(row).select().single();
  return { data, error }; // caller maps constraint errors
}

export async function getLoad(id: string) {
  const { data, error } = await getServiceClient().from("loads").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function updateLoad(id: string, patch: Record<string, unknown>) {
  const { data, error } = await getServiceClient()
    .from("loads")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function appendEvent(
  load_id: string,
  from_status: LoadStatus | null,
  to_status: LoadStatus | null,
  source: EventSource,
  actor: string,
  reason: string | null,
) {
  const { data, error } = await getServiceClient()
    .from("load_events")
    .insert({ load_id, from_status, to_status, source, actor, reason })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function findActiveSentLoadByDriver(driverId: string) {
  const { data, error } = await getServiceClient()
    .from("loads")
    .select("*")
    .eq("assigned_driver_id", driverId)
    .eq("status", "sent")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function claimNoResponse(): Promise<SweptLoad[]> {
  const { data, error } = await getServiceClient().rpc("claim_no_response");
  if (error) throw error;
  return (data ?? []) as SweptLoad[];
}

export async function claimReminder(): Promise<SweptLoad[]> {
  const { data, error } = await getServiceClient().rpc("claim_reminder");
  if (error) throw error;
  return (data ?? []) as SweptLoad[];
}

export async function claimManualRemind(loadId: string, gapMinutes: number): Promise<SweptLoad[]> {
  const { data, error } = await getServiceClient().rpc("claim_manual_remind", {
    p_load_id: loadId,
    p_gap_minutes: gapMinutes,
  });
  if (error) throw error;
  return (data ?? []) as SweptLoad[];
}
