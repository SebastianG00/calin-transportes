import { getLoad } from "../db/loads.js";
import { getServiceClient } from "../db/client.js";
import { composeEmail } from "../ai/email.js";
import { insertEmail, getEmail, updateEmail } from "../db/emails.js";

async function loadData(loadId: string): Promise<Record<string, string>> {
  const load = await getLoad(loadId);
  const { data: joined } = await getServiceClient().from("loads")
    .select("*, client:clients(name,ruc,contact_name), driver:drivers(name), unit:units(plate)")
    .eq("id", loadId).single();
  const j = (joined ?? {}) as Record<string, any>;
  return {
    cliente: j.client?.name ?? "",
    contacto: j.client?.contact_name ?? "",
    carga: load.cargo_description ?? "",
    peso: load.weight_kg != null ? String(load.weight_kg) : "",
    origen: load.origin ?? "",
    destino: load.destination ?? "",
    fecha: load.scheduled_date ?? "",
    placa: j.unit?.plate ?? "",
    chofer: j.driver?.name ?? "",
  };
}

export async function draftEmail(loadId: string) {
  const draft = await composeEmail(await loadData(loadId));
  return insertEmail({ load_id: loadId, template_id: null, draft_text: draft });
}

export async function redraftEmail(emailId: string, revise: string) {
  const email = await getEmail(emailId);
  const draft = await composeEmail(await loadData(email.load_id), revise);
  return updateEmail(emailId, { draft_text: draft });
}

export async function saveEmail(emailId: string, editedText: string) {
  return updateEmail(emailId, { edited_text: editedText });
}
