import { getLoad, appendEvent } from "../db/loads.js";
import { getServiceClient } from "../db/client.js";
import { insertGuia, getGuia, updateGuia, listGuiasForLoad, getGuiaTemplate } from "../db/guias.js";
import { renderGuiaHtml, DEFAULT_GUIA_TEMPLATE, type GuiaClause } from "./renderGuia.js";
import { DomainError } from "../domain/errors.js";

export interface BuildInput {
  templateId?: string | null;
  clauseIds: string[];
  oneOffClauses: GuiaClause[];
}

export async function buildGuia(loadId: string, input: BuildInput) {
  const load = await getLoad(loadId); // 404s via .single() if missing
  const db = getServiceClient();

  const { data: joined } = await db.from("loads")
    .select("*, client:clients(name,ruc), driver:drivers(name), unit:units(plate)")
    .eq("id", loadId).single();
  const j = (joined ?? {}) as Record<string, any>;

  // Exact confirmed values only — never AI-generated.
  const data: Record<string, string> = {
    cliente: j.client?.name ?? "",
    ruc: j.client?.ruc ?? "",
    carga: load.cargo_description ?? "",
    peso: load.weight_kg != null ? String(load.weight_kg) : "",
    origen: load.origin ?? "",
    destino: load.destination ?? "",
    placa: j.unit?.plate ?? "",
    chofer: j.driver?.name ?? "",
    fecha: load.scheduled_date ?? "",
    numero: "", // physical guía number filled by hand; deterministic-fill leaves it as [FALTA: numero]
  };

  // Resolve saved clauses to immutable snapshots, then append one-offs.
  let saved: GuiaClause[] = [];
  if (input.clauseIds.length) {
    const { data: rows, error } = await db.from("requirement_clauses")
      .select("title,body,bucket").in("id", input.clauseIds);
    if (error) throw error;
    saved = (rows ?? []) as GuiaClause[];
  }
  const clauses: GuiaClause[] = [...saved, ...input.oneOffClauses];

  const template = input.templateId
    ? (await db.from("document_templates").select("*").eq("id", input.templateId).single()).data
    : await getGuiaTemplate(load.client_id);
  const templateBody = (template as { body?: string } | null)?.body ?? DEFAULT_GUIA_TEMPLATE;

  const html = renderGuiaHtml({ templateBody, data, clauses });

  return insertGuia({
    load_id: loadId,
    template_id: (template as { id?: string } | null)?.id ?? null,
    clauses, data, html,
  });
}

export async function approveGuia(guiaId: string, userId: string) {
  const guia = await getGuia(guiaId);
  if (guia.status === "approved") {
    throw new DomainError(409, "ALREADY_APPROVED", "Esta guía ya fue aprobada.");
  }
  const approvedByUuid = /^[0-9a-f-]{36}$/i.test(userId) ? userId : null;
  const updated = await updateGuia(guiaId, {
    status: "approved", approved_by: approvedByUuid, approved_at: new Date().toISOString(),
  });
  await appendEvent(guia.load_id, null, null, "office", userId, "Guía de entrega aprobada");
  return updated;
}

export { listGuiasForLoad, getGuia };
