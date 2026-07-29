import { describe, it, expect, vi } from "vitest";
import { z, ZodError } from "zod";
import { errorHandler } from "./errorHandler.js";
import { DomainError } from "../domain/errors.js";

function mockRes() {
  const res: any = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}
const req = {} as any;
const next = (() => {}) as any;

describe("errorHandler", () => {
  it("labels Zod field errors in Spanish (task + inventory fields)", () => {
    // simulate a bad task/item create body → ZodError on titulo + stock_minimo
    let err: ZodError;
    try {
      z.object({ titulo: z.string().min(1), stock_minimo: z.number() }).parse({ titulo: "", stock_minimo: "x" });
      throw new Error("should have thrown");
    } catch (e) { err = e as ZodError; }

    const res = mockRes();
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.code).toBe("VALIDATION");
    expect(body.message).toContain("Título:");       // titulo → Título (not the raw field name)
    expect(body.message).toContain("Stock mínimo:"); // stock_minimo → Stock mínimo
  });

  it("passes DomainError through with its status + code", () => {
    const res = mockRes();
    errorHandler(new DomainError(400, "INVALID_INTENT", "Intención no válida."), req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0]).toMatchObject({ code: "INVALID_INTENT", message: "Intención no válida." });
  });

  it("maps a Postgres unique violation (23505) to a friendly 409", () => {
    const res = mockRes();
    errorHandler({ code: "23505" }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].code).toBe("DUPLICATE");
  });
});
