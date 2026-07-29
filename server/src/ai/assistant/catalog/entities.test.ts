import { describe, it, expect, beforeEach } from "vitest";
import { getServiceClient } from "../../../db/client.js";
import { resetDb, seedClient, seedDriver, seedUnit } from "../../../testutils/db.js";
import { entityTools, aggregateClientVolume } from "./entities.js";
import { ClarifyError } from "../types.js";

const db = getServiceClient();
const tool = (name: string) => entityTools.find((t) => t.name === name)!;

describe("loads_by_driver", () => {
  beforeEach(async () => { await resetDb(); });
  it("lists loads for the resolved driver", async () => {
    const clientId = await seedClient(); const driverId = await seedDriver(); const unitId = await seedUnit();
    const { data: d } = await db.from("drivers").select("name").eq("id", driverId).single();
    await db.from("loads").insert({
      client_id: clientId, cargo_description: "X", weight_kg: 100, origin: "Lima", destination: "Cusco",
      scheduled_date: "2026-07-10", price: 1, currency: "PEN", status: "en_route",
      assigned_driver_id: driverId, assigned_unit_id: unitId,
    } as never);
    const res = await tool("loads_by_driver").run({ driver_name: d!.name as string }, db);
    expect(res.rows.length).toBe(1);
  });
  it("throws ClarifyError for an unknown driver", async () => {
    await expect(tool("loads_by_driver").run({ driver_name: "Nadie-Zzz" }, db)).rejects.toBeInstanceOf(ClarifyError);
  });
});

describe("aggregateClientVolume (pagination)", () => {
  beforeEach(async () => { await resetDb(); });
  it("pages through ALL loads, not just the first page (no silent cap)", async () => {
    // two clients (distinct RUCs), one driver+unit, 3 delivered loads: 2 for A, 1 for B
    const { data: a } = await db.from("clients").insert({ name: "Cliente A", ruc: "20100000111", active: true } as never).select("id").single();
    const { data: b } = await db.from("clients").insert({ name: "Cliente B", ruc: "20100000222", active: true } as never).select("id").single();
    const driverId = await seedDriver(); const unitId = await seedUnit();
    const mk = (clientId: string, dest: string) => db.from("loads").insert({
      client_id: clientId, cargo_description: "X", weight_kg: 100, origin: "Lima", destination: dest,
      scheduled_date: "2026-07-10", price: 1, currency: "PEN", status: "delivered",
      assigned_driver_id: driverId, assigned_unit_id: unitId,
    } as never);
    await mk((a as any).id, "Cusco"); await mk((a as any).id, "Ica"); await mk((b as any).id, "Piura");

    // pageSize 1 → if pagination were broken, only 1 of 3 loads would be counted
    const agg = await aggregateClientVolume(db, null, "cargas", 1);
    expect(agg.get("Cliente A")).toBe(2);
    expect(agg.get("Cliente B")).toBe(1);
  });
});
