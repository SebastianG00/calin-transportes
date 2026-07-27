import { describe, it, expect, vi } from "vitest";

vi.mock("./client.js", () => ({ getAnthropic: () => ({}), CLAUDE_MODEL: "claude-opus-4-8" }));

import { FACTURA_FIELDS } from "./facturaVision.js";

describe("facturaVision field set", () => {
  it("exports the 9 accountant fields in order", () => {
    expect(FACTURA_FIELDS).toEqual([
      "ruc_emisor", "razon_social", "fecha_emision", "serie", "numero",
      "moneda", "subtotal", "igv", "total",
    ]);
  });
});
