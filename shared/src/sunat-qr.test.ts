import { describe, it, expect } from "vitest";
import {
  parseSunatQr,
  hasValidRucPrefix,
  isValidSerieNumero,
  parseSunatDate,
} from "./sunat-qr.js";

describe("parseSunatQr", () => {
  it("parses a factura (tipoDoc 01) payload", () => {
    // ruc|tipoDoc|serie|numero|igv|montoTotal|fecha|tipoDocAdq|rucDestinatario
    const r = parseSunatQr("20100047218|01|F001|123|18.00|118.00|2026-07-18|6|20131312955");
    expect(r).not.toBeNull();
    expect(r).toMatchObject({
      ruc: "20100047218",
      tipoDoc: "01",
      docType: "factura",
      serie: "F001",
      numero: "123",
      fecha: "2026-07-18",
      montoTotal: "118.00",
      rucDestinatario: "20131312955",
    });
  });

  it("parses a GRE remitente (tipoDoc 09) payload with GRE field order", () => {
    // ruc|tipoDoc|serie|numero|fecha|rucDestinatario
    const r = parseSunatQr("20100047218|09|T001|55|2026-07-18|20131312955");
    expect(r).toMatchObject({
      ruc: "20100047218",
      docType: "gre_remitente",
      serie: "T001",
      numero: "55",
      fecha: "2026-07-18",
      rucDestinatario: "20131312955",
    });
    expect(r?.montoTotal).toBeUndefined();
  });

  it("maps tipoDoc 31 to gre_transportista", () => {
    expect(parseSunatQr("20100047218|31|V001|9|2026-07-18|20131312955")?.docType)
      .toBe("gre_transportista");
  });

  it("returns null for an empty / non-pipe payload", () => {
    expect(parseSunatQr("")).toBeNull();
    expect(parseSunatQr("not a sunat qr")).toBeNull();
  });

  it("returns null when required fields are missing", () => {
    expect(parseSunatQr("20100047218|01")).toBeNull();
  });
});

describe("hasValidRucPrefix", () => {
  it("accepts 10/15/16/17/20 prefixes", () => {
    for (const p of ["10", "15", "16", "17", "20"]) {
      expect(hasValidRucPrefix(p + "131312955")).toBe(true);
    }
  });
  it("rejects other prefixes and bad shapes", () => {
    expect(hasValidRucPrefix("30131312955")).toBe(false);
    expect(hasValidRucPrefix("2013")).toBe(false);
  });
});

describe("isValidSerieNumero", () => {
  it("accepts a letter-led 4-char serie and 1-8 digit numero", () => {
    expect(isValidSerieNumero("F001", "123")).toBe(true);
    expect(isValidSerieNumero("T001", "55")).toBe(true);
  });
  it("rejects malformed serie/numero", () => {
    expect(isValidSerieNumero("F1", "123")).toBe(false);
    expect(isValidSerieNumero("F001", "abc")).toBe(false);
    expect(isValidSerieNumero("F001", "")).toBe(false);
  });
});

describe("parseSunatDate", () => {
  it("normalizes YYYY-MM-DD and DD/MM/YYYY", () => {
    expect(parseSunatDate("2026-07-18")).toBe("2026-07-18");
    expect(parseSunatDate("18/07/2026")).toBe("2026-07-18");
  });
  it("returns null for garbage", () => {
    expect(parseSunatDate("nope")).toBeNull();
    expect(parseSunatDate("2026-13-40")).toBeNull();
  });
});
