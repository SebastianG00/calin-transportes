import { describe, it, expect, beforeEach } from "vitest";
import { getServiceClient } from "../../../db/client.js";
import { resetDb, seedClient, seedDriver, seedUnit } from "../../../testutils/db.js";
import { entityTools } from "./entities.js";
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
