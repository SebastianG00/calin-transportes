import { describe, it, expect } from "vitest";
import { checkFormat, reconcileWithLoad, composeValidation } from "./validate.js";
import type { SunatQrFields } from "@tp/types";

const goodQr: SunatQrFields = {
  ruc: "20100047218", tipoDoc: "01", docType: "factura",
  serie: "F001", numero: "123", fecha: "2026-07-18",
  rucDestinatario: "20131312955", montoTotal: "118.00",
};

describe("checkFormat", () => {
  it("passes every check for a well-formed QR", () => {
    const checks = checkFormat(goodQr);
    expect(checks.every((c) => c.pass)).toBe(true);
  });
  it("flags an invalid RUC check digit", () => {
    const checks = checkFormat({ ...goodQr, ruc: "20100047219" });
    const ruc = checks.find((c) => c.reason_code === "RUC_INVALID");
    expect(ruc?.pass).toBe(false);
  });
  it("flags a future emission date", () => {
    const checks = checkFormat({ ...goodQr, fecha: "2999-01-01" });
    expect(checks.find((c) => c.reason_code === "DATE_FUTURE")?.pass).toBe(false);
  });
});

describe("reconcileWithLoad", () => {
  const load = { clientRuc: "20100047218", scheduledDate: "2026-07-18", windowDays: 3 };
  it("passes when RUC matches the client and date is in window", () => {
    const checks = reconcileWithLoad(goodQr, load);
    expect(checks.every((c) => c.pass)).toBe(true);
  });
  it("flags RUC_MISMATCH when the guía RUC != the load's client RUC", () => {
    const checks = reconcileWithLoad({ ...goodQr, ruc: "20131312955" }, load);
    const m = checks.find((c) => c.reason_code === "RUC_MISMATCH");
    expect(m?.pass).toBe(false);
    expect(m?.message).toMatch(/RUC/i);
  });
  it("flags DATE_OUT_OF_WINDOW when fecha is far from the scheduled date", () => {
    const checks = reconcileWithLoad({ ...goodQr, fecha: "2026-08-30" }, load);
    expect(checks.find((c) => c.reason_code === "DATE_OUT_OF_WINDOW")?.pass).toBe(false);
  });
});

describe("composeValidation", () => {
  it("green when all pass", () => {
    expect(composeValidation([{ field: "ruc", pass: true, reason_code: "RUC_OK", message: "" }]).overall).toBe("green");
  });
  it("red when a reconciliation check fails, amber when only a soft check fails", () => {
    const red = composeValidation([{ field: "ruc", pass: false, reason_code: "RUC_MISMATCH", message: "x" }]);
    expect(red.overall).toBe("red");
    const amber = composeValidation([{ field: "fecha", pass: false, reason_code: "DATE_OUT_OF_WINDOW", message: "x" }]);
    expect(amber.overall).toBe("amber");
  });
});
