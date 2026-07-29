import { describe, it, expect, beforeEach } from "vitest";
import { getServiceClient } from "../../../db/client.js";
import { resetDb, seedClient } from "../../../testutils/db.js";
import { moneyTools } from "./money.js";

const db = getServiceClient();
const tool = (name: string) => moneyTools.find((t) => t.name === name)!;

describe("facturado_total", () => {
  beforeEach(async () => { await resetDb(); });
  it("sums confirmed facturas per currency (never mixing PEN and USD)", async () => {
    const clientId = await seedClient();
    await db.from("facturas").insert([
      { image_path: "a.png", client_id: clientId, review_status: "confirmed", confirmed_at: "2026-07-10T12:00:00Z",
        extracted: { total: { value: "1180.00", verbatim: "1,180.00" }, moneda: { value: "PEN", verbatim: "PEN" } } },
      { image_path: "b.png", client_id: clientId, review_status: "confirmed", confirmed_at: "2026-07-12T12:00:00Z",
        extracted: { total: { value: "2500.00", verbatim: "2,500.00" }, moneda: { value: "PEN", verbatim: "PEN" } } },
      { image_path: "c.png", client_id: clientId, review_status: "confirmed", confirmed_at: "2026-07-15T12:00:00Z",
        extracted: { total: { value: "944.00", verbatim: "944.00" }, moneda: { value: "USD", verbatim: "USD" } } },
      { image_path: "d.png", client_id: clientId, review_status: "pending",
        extracted: { total: { value: "999.00", verbatim: "999.00" }, moneda: { value: "PEN", verbatim: "PEN" } } },
    ] as never);
    const res = await tool("facturado_total").run({ period: "2026-07" }, db);
    const byMoneda = Object.fromEntries(res.rows.map((r) => [r[0], { count: r[1], total: r[2] }]));
    expect(byMoneda.PEN).toEqual({ count: 2, total: 3680 }); // 1180 + 2500, pending 999 excluded
    expect(byMoneda.USD).toEqual({ count: 1, total: 944 });
    expect(res.summary).toContain("3680 PEN");
    expect(res.summary).toContain("944 USD");
  });

  it("reports no facturas when the period is empty", async () => {
    await seedClient();
    const res = await tool("facturado_total").run({ period: "2020-01" }, db);
    expect(res.summary).toMatch(/no hubo facturas/i);
  });
});
