import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { getServiceClient } from "../db/client.js";
import { resetDb } from "../testutils/db.js";
import { exportFacturasCsv, confirmFactura, rejectFactura } from "./facturaService.js";

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
    // confirmed_by FKs to auth.users(id) and facturaService does not null out
    // non-existent ids the way documentService/guiaService do, so a
    // UUID-shaped-but-nonexistent id (e.g. "00000000-0000-0000-0000-000000000001")
    // would trip the FK constraint. Create a real (throwaway) auth user instead.
    let userId: string;

    beforeAll(async () => {
      const email = `factura-test-${Date.now()}@example.local`;
      const { data, error } = await getServiceClient().auth.admin.createUser({
        email, password: "Passw0rd!23456", email_confirm: true,
      });
      if (error) throw error;
      userId = data.user!.id;
    });

    afterAll(async () => {
      if (userId) await getServiceClient().auth.admin.deleteUser(userId);
    });

    it("confirmFactura flips pending → confirmed, then a second call throws NOT_PENDING", async () => {
      const id = await seedFactura("pending", fullExtracted());

      const confirmed = await confirmFactura(id, {}, userId);
      expect((confirmed as { review_status: string }).review_status).toBe("confirmed");

      await expect(confirmFactura(id, {}, userId)).rejects.toMatchObject({ code: "NOT_PENDING", status: 409 });
    });

    it("rejectFactura on an already-confirmed factura throws NOT_PENDING", async () => {
      const id = await seedFactura("pending", fullExtracted());
      await confirmFactura(id, {}, userId);

      await expect(rejectFactura(id, userId)).rejects.toMatchObject({ code: "NOT_PENDING", status: 409 });
    });
  });
});
