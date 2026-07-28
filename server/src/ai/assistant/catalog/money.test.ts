import { describe, it, expect, beforeEach } from "vitest";
import { getServiceClient } from "../../../db/client.js";
import { resetDb, seedClient } from "../../../testutils/db.js";
import { moneyTools } from "./money.js";

const db = getServiceClient();
const tool = (name: string) => moneyTools.find((t) => t.name === name)!;

describe("facturado_total", () => {
  beforeEach(async () => { await resetDb(); });
  it("sums total.value across confirmed facturas in the period", async () => {
    const clientId = await seedClient();
    await db.from("facturas").insert([
      { image_path: "a.png", client_id: clientId, review_status: "confirmed",
        confirmed_at: "2026-07-10T12:00:00Z", extracted: { total: { value: "1180.00", verbatim: "1,180.00" } } },
      { image_path: "b.png", client_id: clientId, review_status: "pending",
        extracted: { total: { value: "999.00", verbatim: "999.00" } } },
    ] as never);
    const res = await tool("facturado_total").run({ period: "2026-07" }, db);
    expect(res.summary).toContain("1180");
    expect(res.rows[0][0]).toBe(1); // one confirmed factura
  });
});
