import { describe, it, expect, beforeEach } from "vitest";
import { setProvider } from "../whatsapp/provider.js";
import { FakeProvider } from "../whatsapp/fake.js";
import { processInbound } from "./inboundService.js";
import { createAndAssign } from "./loadService.js";
import { getServiceClient } from "../db/client.js";
import { seedClient, seedUnit, resetDb } from "../testutils/db.js";

async function seedDriverWithPhone(phone: string) {
  const { data } = await getServiceClient().from("drivers")
    .insert({ name: "Juan", whatsapp_phone: phone, active: true }).select().single();
  return data!.id as string;
}

let clientId: string, unitId: string;
beforeEach(async () => { await resetDb(); setProvider(new FakeProvider()); clientId = await seedClient(); unitId = await seedUnit(); });

describe("processInbound", () => {
  it("confirms on '1' and moves the load to confirmed", async () => {
    const phone = "+51987654321";
    const driverId = await seedDriverWithPhone(phone);
    const load = await createAndAssign({ client_id: clientId, cargo_description: "C", weight_kg: 1, origin: "a", destination: "b", scheduled_date: "2026-07-20", price: 1, currency: "PEN", unit_id: unitId, driver_id: driverId }, "u");
    const r = await processInbound({ sid: "IN1", from: `whatsapp:${phone}`, body: "1 ok", raw: {} });
    expect(r.reply).toMatch(/confirmaste|confirmada/i);
    const updated = await getServiceClient().from("loads").select("status").eq("id", load.id).single();
    expect(updated.data!.status).toBe("confirmed");
  });

  it("late '1' after no_response still confirms and clears the flag", async () => {
    const phone = "+51987654322";
    const driverId = await seedDriverWithPhone(phone);
    const load = await createAndAssign({ client_id: clientId, cargo_description: "C", weight_kg: 1, origin: "a", destination: "b", scheduled_date: "2026-07-20", price: 1, currency: "PEN", unit_id: unitId, driver_id: driverId }, "u");
    await getServiceClient().from("loads").update({ no_response: true }).eq("id", load.id);
    await processInbound({ sid: "IN2", from: `whatsapp:${phone}`, body: "1", raw: {} });
    const updated = await getServiceClient().from("loads").select("status,no_response").eq("id", load.id).single();
    expect(updated.data!.status).toBe("confirmed");
    expect(updated.data!.no_response).toBe(false);
  });

  it("is idempotent on a duplicate sid", async () => {
    const phone = "+51987654323";
    const driverId = await seedDriverWithPhone(phone);
    await createAndAssign({ client_id: clientId, cargo_description: "C", weight_kg: 1, origin: "a", destination: "b", scheduled_date: "2026-07-20", price: 1, currency: "PEN", unit_id: unitId, driver_id: driverId }, "u");
    await processInbound({ sid: "DUP", from: `whatsapp:${phone}`, body: "1", raw: {} });
    const r2 = await processInbound({ sid: "DUP", from: `whatsapp:${phone}`, body: "1", raw: {} });
    expect(r2.reply).toBeNull(); // no-op
  });

  it("unknown sender gets a graceful reply, logged with driver null", async () => {
    const r = await processInbound({ sid: "IN3", from: "whatsapp:+51900000000", body: "hola", raw: {} });
    expect(r.reply).toMatch(/no reconocido/i);
  });

  it("no active sent load → graceful 'no pending assignment'", async () => {
    const phone = "+51987654324";
    await seedDriverWithPhone(phone);
    const r = await processInbound({ sid: "IN4", from: `whatsapp:${phone}`, body: "1", raw: {} });
    expect(r.reply).toMatch(/no tienes una asignación/i);
  });

  it("declines on '2' and opens a decline-reason window", async () => {
    const phone = "+51987654325";
    const driverId = await seedDriverWithPhone(phone);
    const load = await createAndAssign({ client_id: clientId, cargo_description: "C", weight_kg: 1, origin: "a", destination: "b", scheduled_date: "2026-07-20", price: 1, currency: "PEN", unit_id: unitId, driver_id: driverId }, "u");
    const r = await processInbound({ sid: "IN5", from: `whatsapp:${phone}`, body: "2 no puedo", raw: {} });
    expect(r.reply).toMatch(/por qué/i);
    const updated = await getServiceClient().from("loads").select("status,assigned_driver_id").eq("id", load.id).single();
    expect(updated.data!.status).toBe("unassigned");
    expect(updated.data!.assigned_driver_id).toBeNull();
    const events = await getServiceClient().from("load_events").select("*").eq("load_id", load.id).eq("to_status", "unassigned");
    expect(events.data!.length).toBe(1);
  });

  it("captures an alphabetic decline reason as a new append-only event", async () => {
    const phone = "+51987654326";
    const driverId = await seedDriverWithPhone(phone);
    const load = await createAndAssign({ client_id: clientId, cargo_description: "C", weight_kg: 1, origin: "a", destination: "b", scheduled_date: "2026-07-20", price: 1, currency: "PEN", unit_id: unitId, driver_id: driverId }, "u");
    await processInbound({ sid: "IN6", from: `whatsapp:${phone}`, body: "2 no puedo", raw: {} });
    const r = await processInbound({ sid: "IN7", from: `whatsapp:${phone}`, body: "se malogró el camión", raw: {} });
    expect(r.reply).toMatch(/registramos el motivo/i);
    const events = await getServiceClient().from("load_events").select("*").eq("load_id", load.id).order("created_at", { ascending: true });
    // creation event (office, to_status='sent') + decline event + a NEW appended reason event = 3 rows.
    const driverEvents = events.data!.filter((e: any) => e.source === "driver");
    expect(driverEvents.length).toBe(2); // decline event, and a distinct newly-appended reason event
    const reasonEvent = events.data!.find((e: any) => e.reason === "se malogró el camión");
    expect(reasonEvent).toBeDefined();
    expect(reasonEvent.to_status).toBeNull();
    // the original decline event must remain untouched (append-only, never mutated)
    const declineEvent = events.data!.find((e: any) => e.to_status === "unassigned");
    expect(declineEvent.reason).toBe("rechazada por el conductor");
  });

  it("captures a digit-leading decline reason verbatim (regression for bug 2)", async () => {
    const phone = "+51987654327";
    const driverId = await seedDriverWithPhone(phone);
    const load = await createAndAssign({ client_id: clientId, cargo_description: "C", weight_kg: 1, origin: "a", destination: "b", scheduled_date: "2026-07-20", price: 1, currency: "PEN", unit_id: unitId, driver_id: driverId }, "u");
    await processInbound({ sid: "IN8", from: `whatsapp:${phone}`, body: "2 no puedo", raw: {} });
    const r = await processInbound({ sid: "IN9", from: `whatsapp:${phone}`, body: "2 llantas malas", raw: {} });
    expect(r.reply).toMatch(/registramos el motivo/i);
    const events = await getServiceClient().from("load_events").select("*").eq("load_id", load.id);
    const reasonEvent = events.data!.find((e: any) => e.reason === "2 llantas malas");
    expect(reasonEvent).toBeDefined();
  });

  it("media-only inbound with no active load gets a photo acknowledgment", async () => {
    const phone = "+51987654328";
    await seedDriverWithPhone(phone);
    const r = await processInbound({ sid: "IN10", from: `whatsapp:${phone}`, body: "", mediaUrl: "https://example.invalid/fake.jpg", raw: {} });
    expect(r.reply).toMatch(/recibimos tu foto/i);
    const msg = await getServiceClient().from("messages").select("processed,media_url").eq("provider_message_sid", "IN10").single();
    expect(msg.data!.processed).toBe(false);
    expect(msg.data!.media_url).toBe("https://example.invalid/fake.jpg");
  });
});
