import { getServiceClient } from "../db/client.js";

export async function resetDb() {
  const db = getServiceClient();

  const wipe = async (t: string) => {
    const { error } = await db.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(`resetDb: failed to clear ${t}: ${error.message}`);
  };

  await wipe("delivery_emails");
  await wipe("delivery_guias");
  await wipe("document_templates");
  await wipe("requirement_clauses");
  // document_events → load_documents must go first: both FK-reference
  // messages/loads and would otherwise block their deletion below.
  await wipe("document_events");
  await wipe("load_documents");
  await wipe("facturas");
  await wipe("tasks");
  // unit_expenses/unit_maintenance FK-reference units/drivers; must go before
  await wipe("unit_expenses");
  await wipe("unit_maintenance");
  await wipe("messages");
  await wipe("pending_prompts");
  await wipe("load_events");
  await wipe("loads");
  await wipe("drivers");
  await wipe("units");
  await wipe("clients");
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
