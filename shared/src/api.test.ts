import { describe, it, expect } from "vitest";
import { CreateLoadInput } from "./api.js";
import { normalizeE164 } from "./provider.js";

describe("CreateLoadInput", () => {
  it("accepts a valid load", () => {
    const r = CreateLoadInput.safeParse({
      client_id: "11111111-1111-1111-1111-111111111111",
      cargo_description: "Cerveza",
      weight_kg: 9000,
      origin: "Lima",
      destination: "Arequipa",
      scheduled_date: "2026-07-20",
      price: 3500,
      unit_id: "22222222-2222-2222-2222-222222222222",
      driver_id: "33333333-3333-3333-3333-333333333333",
    });
    expect(r.success).toBe(true);
  });
  it("rejects non-positive weight", () => {
    const r = CreateLoadInput.safeParse({
      client_id: "11111111-1111-1111-1111-111111111111",
      cargo_description: "x", weight_kg: 0, origin: "a", destination: "b",
      scheduled_date: "2026-07-20", price: 1,
      unit_id: "22222222-2222-2222-2222-222222222222",
      driver_id: "33333333-3333-3333-3333-333333333333",
    });
    expect(r.success).toBe(false);
  });
});

describe("normalizeE164", () => {
  it("strips the whatsapp: prefix and keeps +digits", () => {
    expect(normalizeE164("whatsapp:+51987654321")).toBe("+51987654321");
    expect(normalizeE164("+51987654321")).toBe("+51987654321");
  });
});
