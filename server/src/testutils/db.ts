import { getServiceClient } from "../db/client.js";

export async function resetDb() {
  const db = getServiceClient();
  await db.from("delivery_emails").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("delivery_guias").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("document_templates").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("requirement_clauses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  // document_events → load_documents must go first: both FK-reference
  // messages/loads and would otherwise block their deletion below.
  await db.from("document_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("load_documents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("pending_prompts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("load_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("loads").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("drivers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("units").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("clients").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}
let n = 0;
export async function seedClient() {
  const { data } = await getServiceClient().from("clients")
    .insert({ name: "C", ruc: "20100047218", active: true }).select().single();
  return data!.id as string;
}
export async function seedDriver() {
  const { data } = await getServiceClient().from("drivers")
    .insert({ name: `D${++n}`, whatsapp_phone: `+5198765432${n}`, active: true }).select().single();
  return data!.id as string;
}
export async function seedUnit() {
  const { data } = await getServiceClient().from("units")
    .insert({ plate: `ABC-${++n}`, active: true }).select().single();
  return data!.id as string;
}
