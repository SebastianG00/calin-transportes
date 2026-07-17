import { CreateLoadInput, ReassignInput, AdvanceInput, CancelInput, isLegalTransition } from "@tp/types";
import { insertLoad, getLoad, updateLoad, appendEvent, claimManualRemind } from "../db/loads.js";
import { getSettings } from "../db/settings.js";
import { getServiceClient } from "../db/client.js";
import { getProvider } from "../whatsapp/provider.js";
import { renderTemplate } from "../whatsapp/templates.js";
import { insertMessage } from "../db/messages.js";
import { insertPrompt } from "../db/prompts.js";
import { DomainError, illegalTransition, mapPostgresError } from "../domain/errors.js";
import { logger } from "../logger.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function loadRefData(clientId: string, driverId: string) {
  const db = getServiceClient();
  const [{ data: client }, { data: driver }] = await Promise.all([
    db.from("clients").select("name").eq("id", clientId).single(),
    db.from("drivers").select("*").eq("id", driverId).single(),
  ]);
  return { client, driver };
}

async function sendAssignment(load: any) {
  const { client, driver } = await loadRefData(load.client_id, load.assigned_driver_id);
  const vars = [driver.name, load.cargo_description, client!.name, load.destination, String(load.scheduled_date)];
  const provider = getProvider();
  try {
    const { sid } = await provider.send(driver.whatsapp_phone, "asignacion", vars);
    await insertMessage({
      provider: "twilio", provider_message_sid: sid, direction: "out",
      to_phone: driver.whatsapp_phone, driver_id: driver.id, load_id: load.id,
      template_name: "asignacion", body: renderTemplate("asignacion", vars), status: "sent",
    });
  } catch (err) {
    logger.error({ err, load: load.id }, "assignment send failed");
    await insertMessage({
      provider: "twilio", provider_message_sid: `FAILED-${load.id}-${Date.now()}`,
      direction: "out", to_phone: driver.whatsapp_phone, driver_id: driver.id,
      load_id: load.id, template_name: "asignacion", body: renderTemplate("asignacion", vars),
      status: "failed",
    });
    // status stays 'sent' (aspirational); the failed message row is the truth.
  }
}

export async function createAndAssign(input: CreateLoadInput, userId: string) {
  const settings = await getSettings();
  const due = new Date(Date.now() + settings.confirm_window_minutes * 60_000).toISOString();
  const { data, error } = await insertLoad({
    client_id: input.client_id, cargo_description: input.cargo_description, weight_kg: input.weight_kg,
    origin: input.origin, destination: input.destination, scheduled_date: input.scheduled_date,
    price: input.price, currency: input.currency ?? "PEN", status: "sent",
    assigned_unit_id: input.unit_id, assigned_driver_id: input.driver_id,
    confirm_due_at: due,
    // `created_by` is a uuid FK to auth.users; office userIds arrive here as
    // opaque strings in tests (and until real Supabase Auth is wired up in a
    // later task) so we don't force a non-uuid string into a uuid column —
    // only real Supabase Auth UUIDs get persisted here. `userId` is still
    // recorded faithfully on the append-only load_events row below (actor
    // is `text`), which is what audits actually read.
    created_by: UUID_RE.test(userId) ? userId : null,
  });
  if (error) { const mapped = mapPostgresError(error); if (mapped) throw mapped; throw error; }
  await appendEvent(data.id, null, "sent", "office", userId, null);
  await sendAssignment(data);
  return data;
}

export async function reassign(loadId: string, input: ReassignInput, userId: string) {
  const load = await getLoad(loadId);
  if (!isLegalTransition(load.status, "unassigned")) throw illegalTransition(load.status, "unassigned");
  // Notify the removed driver (best-effort).
  if (load.assigned_driver_id) {
    const { data: driver } = await getServiceClient().from("drivers").select("*").eq("id", load.assigned_driver_id).single();
    if (driver) {
      try {
        const { sid } = await getProvider().send(driver.whatsapp_phone, "reasignacion",
          [driver.name, load.cargo_description, load.destination]);
        await insertMessage({ provider: "twilio", provider_message_sid: sid, direction: "out",
          to_phone: driver.whatsapp_phone, driver_id: driver.id, load_id: load.id,
          template_name: "reasignacion", body: renderTemplate("reasignacion", [driver.name, load.cargo_description, load.destination]), status: "sent" });
      } catch (err) { logger.error({ err }, "reassign notice failed"); }
    }
  }
  // Free the load, then reassign to the new driver/unit → sent again.
  await updateLoad(loadId, { status: "unassigned", assigned_driver_id: null, assigned_unit_id: null, no_response: false, confirm_due_at: null, reminder_sent_at: null });
  await appendEvent(loadId, load.status, "unassigned", "office", userId, input.reason);
  const settings = await getSettings();
  const due = new Date(Date.now() + settings.confirm_window_minutes * 60_000).toISOString();
  const { data, error } = await updateLoad(loadId, { status: "sent", assigned_driver_id: input.driver_id, assigned_unit_id: input.unit_id, confirm_due_at: due });
  if (error) { const mapped = mapPostgresError(error); if (mapped) throw mapped; throw error; }
  await appendEvent(loadId, "unassigned", "sent", "office", userId, "reasignación");
  await sendAssignment(data);
  return data;
}

export async function advance(loadId: string, input: AdvanceInput, userId: string) {
  const load = await getLoad(loadId);
  if (!isLegalTransition(load.status, input.to)) throw illegalTransition(load.status, input.to);
  const { data, error } = await updateLoad(loadId, { status: input.to });
  if (error) throw error;
  await appendEvent(loadId, load.status, input.to, "office", userId, null);
  return data;
}

export async function cancel(loadId: string, input: CancelInput, userId: string) {
  const load = await getLoad(loadId);
  if (!isLegalTransition(load.status, "cancelled")) throw illegalTransition(load.status, "cancelled");
  const { data, error } = await updateLoad(loadId, { status: "cancelled", cancel_reason: input.reason });
  if (error) throw error;
  await appendEvent(loadId, load.status, "cancelled", "office", userId, input.reason);
  return data;
}

export async function remind(loadId: string) {
  const settings = await getSettings();
  const rows = await claimManualRemind(loadId, settings.manual_remind_min_gap_minutes);
  if (rows.length === 0) throw new DomainError(429, "REMIND_TOO_SOON", "Ya se envió un recordatorio hace poco.");
  const load = rows[0];
  const { data: driver } = await getServiceClient().from("drivers").select("*").eq("id", load.assigned_driver_id).single();
  const vars = [driver!.name, load.cargo_description, load.destination];
  const { sid } = await getProvider().send(driver!.whatsapp_phone, "recordatorio", vars);
  await insertMessage({ provider: "twilio", provider_message_sid: sid, direction: "out",
    to_phone: driver!.whatsapp_phone, driver_id: driver!.id, load_id: load.id,
    template_name: "recordatorio", body: renderTemplate("recordatorio", vars), status: "sent" });
  await appendEvent(load.id, "sent", "sent", "office", "office", "recordatorio manual");
  return { ok: true };
}

export async function resend(loadId: string) {
  const load = await getLoad(loadId);
  if (load.status !== "sent") throw new DomainError(409, "NOT_SENT", "Solo se puede reenviar una asignación en estado enviado.");
  await sendAssignment(load);
  await appendEvent(loadId, "sent", "sent", "office", "office", "reenvío de asignación");
  return { ok: true };
}
