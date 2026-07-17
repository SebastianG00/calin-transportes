import { describe, it, expect } from "vitest";
import { isValidRuc } from "./ruc.js";

describe("isValidRuc (mod-11 check digit)", () => {
  it("accepts real valid RUCs", () => {
    expect(isValidRuc("20131312955")).toBe(true); // SUNAT, worked example in spec
    expect(isValidRuc("20100047218")).toBe(true); // Backus (real)
    expect(isValidRuc("20100128056")).toBe(true); // Alicorp (real)
  });
  it("rejects wrong check digit (one digit off)", () => {
    expect(isValidRuc("20131312954")).toBe(false);
    expect(isValidRuc("20131312956")).toBe(false);
  });
  it("rejects transposed digits", () => {
    expect(isValidRuc("20131321955")).toBe(false);
  });
  it("rejects wrong length / non-numeric", () => {
    expect(isValidRuc("2013131295")).toBe(false);
    expect(isValidRuc("201313129555")).toBe(false);
    expect(isValidRuc("2013131295a")).toBe(false);
    expect(isValidRuc("")).toBe(false);
  });
  it("rejects invalid type prefix", () => {
    expect(isValidRuc("30131312955")).toBe(false);
  });
});
