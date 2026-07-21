import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, seedClient } from "../testutils/db.js";
import { listClauses, createClause, updateClause, deactivateClause } from "./clauses.js";

describe("clauses CRUD", () => {
  beforeEach(async () => { await resetDb(); });

  it("creates, lists (global + client), updates, and deactivates", async () => {
    const clientId = await seedClient();
    await createClause({ client_id: null, title: "EPP", body: "Chofer con EPP.", bucket: "attest" });
    const c = await createClause({ client_id: clientId, title: "Peso", body: "≤ 9 t.", bucket: "reconcile", params: { max_peso_kg: 9000 } });

    const forClient = await listClauses(clientId);
    expect(forClient.map((r) => r.title).sort()).toEqual(["EPP", "Peso"]);

    const globalOnly = await listClauses();
    expect(globalOnly.map((r) => r.title)).toEqual(["EPP"]);

    const updated = await updateClause(c.id, { title: "Peso máximo" });
    expect(updated.title).toBe("Peso máximo");

    const gone = await deactivateClause(c.id);
    expect(gone.active).toBe(false);
    expect((await listClauses(clientId)).map((r) => r.title)).toEqual(["EPP"]);
  });
});
