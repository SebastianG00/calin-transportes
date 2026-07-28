import { describe, it, expect } from "vitest";
import { parsePeriod } from "./dates.js";

const now = new Date("2026-07-15T12:00:00Z");

describe("parsePeriod", () => {
  it("returns null for empty/unknown", () => {
    expect(parsePeriod(undefined, now)).toBeNull();
    expect(parsePeriod("cualquier cosa", now)).toBeNull();
  });
  it("parses an explicit YYYY-MM", () => {
    expect(parsePeriod("2026-07", now)).toEqual({ from: "2026-07-01", to: "2026-07-31" });
  });
  it("parses a Spanish month name to the current year", () => {
    expect(parsePeriod("julio", now)).toEqual({ from: "2026-07-01", to: "2026-07-31" });
  });
  it("parses 'este mes'", () => {
    expect(parsePeriod("este mes", now)).toEqual({ from: "2026-07-01", to: "2026-07-31" });
  });
  it("parses 'hoy'", () => {
    expect(parsePeriod("hoy", now)).toEqual({ from: "2026-07-15", to: "2026-07-15" });
  });
});
