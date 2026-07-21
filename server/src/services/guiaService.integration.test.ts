import { describe, it, expect, beforeEach } from "vitest";
import { getServiceClient } from "../db/client.js";
import { resetDb, seedClient, seedDriver, seedUnit } from "../testutils/db.js";
import { createClause } from "../db/clauses.js";
import { buildGuia, approveGuia, listGuiasForLoad } from "./guiaService.js";

async function seedLoad(clientId: string, driverId: string, unitId: string) {
  const { data, error } = await getServiceClient().from("loads").insert({
    client_id: clientId, cargo_description: "Lápices", weight_kg: 8900,
    origin: "Lima", destination: "Arequipa", scheduled_date: "2026-08-01",
    price: 3500, currency: "PEN", status: "en_route",
    assigned_driver_id: driverId, assigned_unit_id: unitId,
  }).select().single();
  if (error) throw error;
  return data.id as string;
}

describe("guiaService", () => {
  beforeEach(async () => { await resetDb(); });

  it("builds a draft guía with filled data + clause snapshot, then approves it", async () => {
    const clientId = await seedClient();
    const driverId = await seedDriver();
    const unitId = await seedUnit();
    const loadId = await seedLoad(clientId, driverId, unitId);
    const clause = await createClause({ client_id: clientId, title: "Sin olores", body: "Camión limpio.", bucket: "attest" });

    const guia = await buildGuia(loadId, { clauseIds: [clause.id], oneOffClauses: [] });
    expect(guia.status).toBe("draft");
    expect(guia.data.peso).toBe("8900");        // exact confirmed value
    expect(guia.html).toContain("8900");
    expect(guia.html).toContain("Sin olores");
    expect(guia.clauses).toHaveLength(1);

    expect((await listGuiasForLoad(loadId))).toHaveLength(1);

    // Non-UUID actor (as the test-auth path injects): approved_by FKs to
    // auth.users, so a UUID-shaped-but-nonexistent id would violate the FK.
    // Per the Slice-1 created_by convention, non-UUID actors persist as null.
    const approved = await approveGuia(guia.id, "test-user");
    expect(approved.status).toBe("approved");
    expect(approved.approved_at).not.toBeNull();
  });
});
