import { describe, it, expect, beforeEach } from "vitest";
import { getServiceClient } from "./client.js";
import { resetDb, seedClient } from "../testutils/db.js";

describe("0007 tables", () => {
  beforeEach(async () => { await resetDb(); });

  it("inserts a per-client requirement clause", async () => {
    const clientId = await seedClient();
    const db = getServiceClient();
    const { data, error } = await db.from("requirement_clauses")
      .insert({ client_id: clientId, title: "Sin olores", body: "El camión debe llegar limpio y sin olores.", bucket: "attest" })
      .select().single();
    expect(error).toBeNull();
    expect(data!.bucket).toBe("attest");
    expect(data!.source).toBe("human");
  });

  it("rejects an invalid bucket via the CHECK constraint", async () => {
    const clientId = await seedClient();
    const db = getServiceClient();
    const { error } = await db.from("requirement_clauses")
      .insert({ client_id: clientId, title: "x", body: "y", bucket: "invalid" });
    expect(error).not.toBeNull();
  });
});
