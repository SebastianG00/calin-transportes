import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getServiceClient } from "../../db/client.js";
import { setProvider } from "../../whatsapp/provider.js";
import { FakeProvider } from "../../whatsapp/fake.js";
import { noResponseSweep } from "./noResponse.js";

// Self-contained concurrency test for the no-response sweep. Seeds its own
// throwaway client/driver/unit/load (no shared testutils helper exists yet —
// that lands in a later task) and runs two sweep passes concurrently to prove
// the sweep's two independent atomic claims give at-most-once reminder
// semantics even when two runner instances race (Render's zero-downtime
// deploy briefly runs two processes; see spec §4).
describe("noResponseSweep concurrency", () => {
  const client = getServiceClient();
  let clientId: string;
  let driverId: string;
  let unitId: string;
  let loadId: string;
  let fake: FakeProvider;

  beforeAll(async () => {
    // 20131312955 passes the RUC mod-11 checksum and is distinct from the
    // three seeded production clients (Backus/Alicorp/Gloria).
    const { data: clientRow, error: clientErr } = await client
      .from("clients")
      .insert({ name: "Sweep Test Client", ruc: "20131312955", active: true })
      .select()
      .single();
    if (clientErr) throw clientErr;
    clientId = clientRow.id;

    const { data: driverRow, error: driverErr } = await client
      .from("drivers")
      .insert({ name: "Sweep Test Driver", whatsapp_phone: "+51999000111", active: true })
      .select()
      .single();
    if (driverErr) throw driverErr;
    driverId = driverRow.id;

    const { data: unitRow, error: unitErr } = await client
      .from("units")
      .insert({ plate: "SWP-001", capacity_kg: 1000, active: true })
      .select()
      .single();
    if (unitErr) throw unitErr;
    unitId = unitRow.id;

    const pastDue = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1h ago

    const { data: loadRow, error: loadErr } = await client
      .from("loads")
      .insert({
        client_id: clientId,
        cargo_description: "Sweep test cargo",
        weight_kg: 500,
        origin: "Lima",
        destination: "Arequipa",
        scheduled_date: new Date().toISOString().slice(0, 10),
        price: 100,
        currency: "PEN",
        status: "sent",
        no_response: false,
        assigned_unit_id: unitId,
        assigned_driver_id: driverId,
        confirm_due_at: pastDue,
      })
      .select()
      .single();
    if (loadErr) throw loadErr;
    loadId = loadRow.id;

    fake = new FakeProvider();
    setProvider(fake);
  });

  afterAll(async () => {
    if (loadId) {
      await client.from("messages").delete().eq("load_id", loadId);
      await client.from("load_events").delete().eq("load_id", loadId);
      await client.from("loads").delete().eq("id", loadId);
    }
    if (driverId) await client.from("drivers").delete().eq("id", driverId);
    if (unitId) await client.from("units").delete().eq("id", unitId);
    if (clientId) await client.from("clients").delete().eq("id", clientId);
  });

  it("flags no_response and sends the reminder exactly once under concurrent sweeps", async () => {
    await Promise.all([noResponseSweep.run(), noResponseSweep.run()]);

    const { data: load, error } = await client.from("loads").select("*").eq("id", loadId).single();
    if (error) throw error;

    expect(load.no_response).toBe(true);
    expect(load.reminder_sent_at).not.toBeNull();

    const reminders = fake.sent.filter((m) => m.template === "recordatorio");
    expect(reminders).toHaveLength(1);
    expect(reminders[0].to).toBe("+51999000111");
  });
});
