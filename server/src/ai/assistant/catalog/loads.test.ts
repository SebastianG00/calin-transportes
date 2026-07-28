import { describe, it, expect, beforeEach } from "vitest";
import { getServiceClient } from "../../../db/client.js";
import { resetDb, seedClient, seedDriver, seedUnit } from "../../../testutils/db.js";
import { loadsTools } from "./loads.js";

const db = getServiceClient();
const tool = (name: string) => loadsTools.find((t) => t.name === name)!;

// seedClient() always inserts a fixed ruc (pipeline.integration.test.ts relies on that
// exact value as reconciliation ground truth), so it can only be called once per resetDb()
// without hitting the clients_ruc_key unique constraint. Seed one client per test and reuse
// it across seedLoad() calls; driver/unit are fine to seed per-call (they use a counter).
async function seedLoad(clientId: string, status: string, scheduled_date: string) {
  const [driverId, unitId] = [await seedDriver(), await seedUnit()];
  await db.from("loads").insert({
    client_id: clientId, cargo_description: "Lápices", weight_kg: 8900,
    origin: "Lima", destination: "Arequipa", scheduled_date,
    price: 3500, currency: "PEN", status, assigned_driver_id: driverId, assigned_unit_id: unitId,
  } as never);
}

describe("count_loads_by_status", () => {
  beforeEach(async () => { await resetDb(); });
  it("counts loads filtered by status", async () => {
    const clientId = await seedClient();
    await seedLoad(clientId, "en_route", "2026-07-10");
    await seedLoad(clientId, "delivered", "2026-07-11");
    const res = await tool("count_loads_by_status").run({ status: "en_route" }, db);
    expect(res.summary).toContain("1 carga");
    expect(res.rows.length).toBe(1);
    expect(res.columns).toEqual(["Chofer", "Placa", "Destino", "Estado"]);
  });
});

describe("deliveries_in_period", () => {
  beforeEach(async () => { await resetDb(); });
  it("counts delivered loads inside the period only", async () => {
    const clientId = await seedClient();
    await seedLoad(clientId, "delivered", "2026-07-10");
    await seedLoad(clientId, "delivered", "2026-08-10");
    const res = await tool("deliveries_in_period").run({ period: "2026-07" }, db);
    expect(res.summary).toContain("1 entrega");
  });
});
