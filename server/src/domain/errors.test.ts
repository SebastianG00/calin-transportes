import { describe, it, expect } from "vitest";
import { mapPostgresError, illegalTransition, DomainError } from "./errors.js";

describe("mapPostgresError", () => {
  it("maps the active-load unique violation to a friendly 409", () => {
    const e = mapPostgresError({ code: "23505", message: 'duplicate key value violates unique constraint "one_active_load_per_driver"' });
    expect(e).toBeInstanceOf(DomainError);
    expect(e!.status).toBe(409);
    expect(e!.code).toBe("DRIVER_HAS_ACTIVE_LOAD");
    expect(e!.message).toMatch(/carga activa/i);
  });
  it("returns null for unrelated errors", () => {
    expect(mapPostgresError({ code: "23503", message: "fk" })).toBeNull();
  });
  it("does NOT map a 23505 on a different constraint (avoids over-matching)", () => {
    const e = mapPostgresError({ code: "23505", message: 'duplicate key value violates unique constraint "drivers_whatsapp_phone_key"' });
    expect(e).toBeNull();
  });
});

describe("illegalTransition", () => {
  it("is a 409 with a Spanish message", () => {
    const e = illegalTransition("delivered", "en_route");
    expect(e.status).toBe(409);
    expect(e.message).toMatch(/no se puede/i);
  });
});
