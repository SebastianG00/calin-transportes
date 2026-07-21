import { describe, it, expect, beforeEach } from "vitest";
import { getServiceClient } from "../src/db/client.js";
import { resetDb } from "../src/testutils/db.js";
import { seedDocumentContent, SEED_CLAUSES } from "./seed.js";

describe("seedDocumentContent", () => {
  beforeEach(async () => { await resetDb(); });

  it("seeds clauses + default template and is idempotent", async () => {
    await seedDocumentContent();
    await seedDocumentContent(); // run twice — no duplicates
    const db = getServiceClient();
    const clauses = await db.from("requirement_clauses").select("id").is("client_id", null);
    const tpls = await db.from("document_templates").select("id").eq("kind", "guia").is("client_id", null);
    expect(clauses.data!.length).toBe(SEED_CLAUSES.length);
    expect(tpls.data!.length).toBe(1);
  });
});
