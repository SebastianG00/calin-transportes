import { getLoad } from "../db/loads.js";
import { getServiceClient } from "../db/client.js";
import { draftWhatsapp, type WhatsappIntent } from "../ai/whatsappDraft.js";

async function loadFacts(loadId: string): Promise<Record<string, string>> {
  const load = await getLoad(loadId);
  const { data: joined } = await getServiceClient().from("loads")
    .select("*, client:clients(name), driver:drivers(name), unit:units(plate)")
    .eq("id", loadId).single();
  const j = (joined ?? {}) as Record<string, any>;
  return {
    chofer: j.driver?.name ?? "",
    cliente: j.client?.name ?? "",
    carga: load.cargo_description ?? "",
    peso: load.weight_kg != null ? String(load.weight_kg) : "",
    origen: load.origin ?? "",
    destino: load.destination ?? "",
    fecha: load.scheduled_date ?? "",
    placa: j.unit?.plate ?? "",
  };
}

export async function draftWhatsappForLoad(
  loadId: string,
  intent: WhatsappIntent,
  instruction?: string,
): Promise<{ draft: string }> {
  const draft = await draftWhatsapp(await loadFacts(loadId), intent, instruction);
  return { draft };
}
