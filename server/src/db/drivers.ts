import { getServiceClient } from "./client.js";
import { DriverInput } from "@tp/types";

export async function listDrivers() {
  const { data, error } = await getServiceClient().from("drivers").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function createDriver(input: DriverInput) {
  const { data, error } = await getServiceClient().from("drivers").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateDriver(id: string, input: Partial<DriverInput>) {
  const { data, error } = await getServiceClient()
    .from("drivers")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function findDriverByPhone(phone: string) {
  const { data, error } = await getServiceClient()
    .from("drivers")
    .select("*")
    .eq("whatsapp_phone", phone)
    .maybeSingle();
  if (error) throw error;
  return data;
}
