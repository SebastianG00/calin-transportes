import { getServiceClient } from "./client.js";
import { UnitInput } from "@tp/types";

export async function listUnits() {
  const { data, error } = await getServiceClient().from("units").select("*").order("plate");
  if (error) throw error;
  return data;
}

export async function createUnit(input: UnitInput) {
  const { data, error } = await getServiceClient().from("units").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateUnit(id: string, input: Partial<UnitInput>) {
  const { data, error } = await getServiceClient()
    .from("units")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
