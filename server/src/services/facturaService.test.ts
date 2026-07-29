import { describe, it, expect, beforeEach } from "vitest";
import { getServiceClient } from "../db/client.js";
import { resetDb } from "../testutils/db.js";
import { exportFacturasCsv, confirmFactura, rejectFactura, actorUuid } from "./facturaService.js";

describe("actorUuid (confirmed_by guard)", () => {
  it("keeps a valid UUID, nulls everything else", () => {
    expect(actorUuid("3add9cf3-2843-4b5f-9f8e-8436244a1111")).toBe("3add9cf3-2843-4b5f-9f8e-8436244a1111");
    expect(actorUuid("office")).toBeNull();          // non-UUID actor
    expect(actorUuid(null)).toBeNull();              // unauthenticated
    expect(actorUuid(undefined)).toBeNull();
    expect(actorUuid("------------------------------------")).toBeNull(); // 36 chars, but junk
  });
});

function fullExtracted(overrides: Record<string, { value: string; verbatim?: string; source?: string }> = {}) {
  const base: Record<string, { value: string; verbatim: string; source: string }> = {
    ruc_emisor: { value: "20100047218", verbatim: "20100047218", source: "vlm" },
    razon_social: { value: "Acme SAC", verbatim: "Acme SAC", source: "vlm" },
    fecha_emision: { value: "2026-07-10", verbatim: "10/07/2026", source: "vlm" },
    serie: { value: "F001", verbatim: "F001", source: "vlm" },
    numero: { value: "123", verbatim: "123", source: "vlm" },
    moneda: { value: "PEN", verbatim: "S/", source: "vlm" },
    subtotal: { value: "1000", verbatim: "S/ 1,000.00", source: "vlm" },
    igv: { value: "180", verbatim: "S/ 180.00", source: "vlm" },
    total: { value: "1180", verbatim: "S/ 1,180.00", source: "vlm" },
  };
  return { ...base, ...overrides };
}

async function seedFactura(reviewStatus: string, extracted: Record<string, unknown>) {
  const { data, error } = await getServiceClient().from("facturas")
    .insert({ image_path: `uploads/test-${Date.now()}-${Math.random()}.png`, extracted, review_status: reviewStatus })
    .select("id").single();
  if (error) throw error;
  return data!.id as string;
}

describe("facturaService", () => {
  beforeEach(async () => { await resetDb(); });

  describe("exportFacturasCsv", () => {
    it("includes only confirmed invoices, filtered by month", async () => {
      const confirmedJuly = await seedFactura("confirmed", fullExtracted({
        fecha_emision: { value: "2026-07-10", verbatim: "10/07/2026", source: "vlm" },
        ruc_emisor: { value: "20111111111", verbatim: "20111111111", source: "vlm" },
        total: { value: "1180", verbatim: "S/ 1,180.00", source: "vlm" },
      }));
      const confirmedJune = await seedFactura("confirmed", fullExtracted({
        fecha_emision: { value: "2026-06-05", verbatim: "05/06/2026", source: "vlm" },
        ruc_emisor: { value: "20222222222", verbatim: "20222222222", source: "vlm" },
        total: { value: "999", verbatim: "S/ 999.00", source: "vlm" },
      }));
      const pendingJuly = await seedFactura("pending", fullExtracted({
        fecha_emision: { value: "2026-07-20", verbatim: "20/07/2026", source: "vlm" },
        ruc_emisor: { value: "20333333333", verbatim: "20333333333", source: "vlm" },
        total: { value: "777", verbatim: "S/ 777.00", source: "vlm" },
      }));

      const csv = await exportFacturasCsv("2026-07");

      // Header present.
      expect(csv.split("\r\n")[0]).toContain("fecha_emision");
      // Row (a) present: identifying values show up.
      expect(csv).toContain("20111111111");
      expect(csv).toContain("1180");
      // Row (b) — different month — absent.
      expect(csv).not.toContain("20222222222");
      expect(csv).not.toContain("999");
      // Row (c) — pending — absent.
      expect(csv).not.toContain("20333333333");
      expect(csv).not.toContain("777");

      void confirmedJune;
      void pendingJuly;
      void confirmedJuly;
    });

    it("copies the confirmed value, never verbatim", async () => {
      await seedFactura("confirmed", fullExtracted({
        fecha_emision: { value: "2026-07-10", verbatim: "10/07/2026", source: "vlm" },
        total: { value: "1180", verbatim: "S/ 1,180.00", source: "human" },
      }));

      const csv = await exportFacturasCsv("2026-07");

      expect(csv).toContain("1180");
      expect(csv).not.toContain("S/ 1,180.00");
    });
  });

  describe("pending guard", () => {
    // confirmed_by FKs to auth.users(id); actorUuid() nulls non-UUID actors
    // (e.g. "office") so they don't trip the FK — so tests can use a plain actor.
    const userId = "office";

    it("confirmFactura flips pending → confirmed with a non-UUID actor → confirmed_by null (no FK error)", async () => {
      const id = await seedFactura("pending", fullExtracted());

      const confirmed = await confirmFactura(id, {}, userId);
      expect((confirmed as { review_status: string }).review_status).toBe("confirmed");
      expect((confirmed as { confirmed_by: string | null }).confirmed_by).toBeNull();

      await expect(confirmFactura(id, {}, userId)).rejects.toMatchObject({ code: "NOT_PENDING", status: 409 });
    });

    it("rejectFactura on an already-confirmed factura throws NOT_PENDING", async () => {
      const id = await seedFactura("pending", fullExtracted());
      await confirmFactura(id, {}, userId);

      await expect(rejectFactura(id, userId)).rejects.toMatchObject({ code: "NOT_PENDING", status: 409 });
    });
  });
});
