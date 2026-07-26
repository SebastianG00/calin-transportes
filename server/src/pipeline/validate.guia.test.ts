import { describe, it, expect } from "vitest";
import { reconcileGuiaWithLoad, composeValidation } from "./validate.js";

const load = { weightKg: 8900, destination: "Arequipa", scheduledDate: "2026-08-01", plate: "ABC-123" };

describe("reconcileGuiaWithLoad (pure)", () => {
  it("all-match → green", () => {
    const checks = reconcileGuiaWithLoad(
      { peso: "8900", destino: "Arequipa", fecha_entrega: "2026-08-02", placa: "ABC-123" }, load);
    expect(composeValidation(checks).overall).toBe("green");
  });

  it("peso out of tolerance and plate mismatch → amber/red flags", () => {
    const checks = reconcileGuiaWithLoad(
      { peso: "5000", destino: "Arequipa", fecha_entrega: "2026-08-02", placa: "XYZ-999" }, load);
    const codes = checks.filter((c) => !c.pass).map((c) => c.reason_code);
    expect(codes).toContain("PESO_MISMATCH");
    expect(codes).toContain("PLACA_MISMATCH");
    expect(composeValidation(checks).overall).not.toBe("green");
  });

  it("destino compared case/space-insensitively and by containment", () => {
    const checks = reconcileGuiaWithLoad(
      { peso: "8900", destino: "AREQUIPA - Cerro Colorado", fecha_entrega: "2026-08-01", placa: "ABC-123" }, load);
    expect(checks.find((c) => c.field === "destino")!.pass).toBe(true);
  });

  it("blank guía fields don't produce mismatches (nothing to reconcile)", () => {
    const checks = reconcileGuiaWithLoad({ peso: "", destino: "", fecha_entrega: "", placa: "" }, load);
    expect(checks.every((c) => c.pass)).toBe(true);
  });

  it("destino matches across accents (Peruvian place names)", () => {
    const accented = { ...load, destination: "Cañete" };
    const checks = reconcileGuiaWithLoad(
      { peso: "8900", destino: "Canete", fecha_entrega: "2026-08-01", placa: "ABC-123" }, accented);
    expect(checks.find((c) => c.field === "destino")!.pass).toBe(true);
  });

  it("peso parses thousands separators and unit suffixes", () => {
    for (const peso of ["8,900", "8.900", "8900 kg", "8 900", "8,900.00"]) {
      const checks = reconcileGuiaWithLoad(
        { peso, destino: "Arequipa", fecha_entrega: "2026-08-01", placa: "ABC-123" }, load);
      const c = checks.find((x) => x.field === "peso");
      expect(c, `peso "${peso}" should be reconciled, not skipped`).toBeDefined();
      expect(c!.pass, `peso "${peso}" should pass`).toBe(true);
    }
  });

  it("a formatted peso that truly differs still flags (not silently skipped)", () => {
    const checks = reconcileGuiaWithLoad(
      { peso: "5,000 kg", destino: "Arequipa", fecha_entrega: "2026-08-01", placa: "ABC-123" }, load);
    const c = checks.find((x) => x.field === "peso");
    expect(c).toBeDefined();
    expect(c!.reason_code).toBe("PESO_MISMATCH");
  });
});
