import { describe, it, expect } from "vitest";
import { isLegalTransition, ACTIVE_STATUSES } from "./status.js";

describe("load status transitions", () => {
  it("allows the happy path", () => {
    expect(isLegalTransition("unassigned", "sent")).toBe(true);
    expect(isLegalTransition("sent", "confirmed")).toBe(true);
    expect(isLegalTransition("confirmed", "en_route")).toBe(true);
    expect(isLegalTransition("en_route", "delivered")).toBe(true);
  });
  it("allows decline and reassign back to unassigned", () => {
    expect(isLegalTransition("sent", "unassigned")).toBe(true);
    expect(isLegalTransition("confirmed", "unassigned")).toBe(true);
  });
  it("allows cancel from any non-delivered state", () => {
    for (const s of ["unassigned", "sent", "confirmed", "en_route"] as const) {
      expect(isLegalTransition(s, "cancelled")).toBe(true);
    }
  });
  it("rejects illegal moves", () => {
    expect(isLegalTransition("delivered", "cancelled")).toBe(false);
    expect(isLegalTransition("delivered", "en_route")).toBe(false);
    expect(isLegalTransition("unassigned", "confirmed")).toBe(false);
    expect(isLegalTransition("cancelled", "sent")).toBe(false);
    expect(isLegalTransition("en_route", "unassigned")).toBe(false);
    expect(isLegalTransition("sent", "sent")).toBe(false);
  });
  it("marks active statuses for the partial unique index", () => {
    expect(ACTIVE_STATUSES).toEqual(["sent", "confirmed", "en_route"]);
  });
});
