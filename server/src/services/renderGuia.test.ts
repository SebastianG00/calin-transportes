import { describe, it, expect } from "vitest";
import { renderGuiaHtml, DEFAULT_GUIA_TEMPLATE } from "./renderGuia.js";

describe("renderGuiaHtml (pure)", () => {
  it("fills placeholders with exact values", () => {
    const html = renderGuiaHtml({
      templateBody: "Peso: {{peso}} kg — Placa: {{placa}}. {{requisitos}}",
      data: { peso: "8900", placa: "ABC-123" },
      clauses: [],
    });
    expect(html).toContain("Peso: 8900 kg");
    expect(html).toContain("Placa: ABC-123");
  });

  it("marks a missing placeholder instead of leaving it blank", () => {
    const html = renderGuiaHtml({ templateBody: "Cliente: {{cliente}}. {{requisitos}}", data: {}, clauses: [] });
    expect(html).toContain("[FALTA: cliente]");
  });

  it("renders clauses grouped by bucket and always includes a blank signature block", () => {
    const html = renderGuiaHtml({
      templateBody: "{{requisitos}}",
      data: {},
      clauses: [
        { title: "Peso", body: "≤ 9 t.", bucket: "reconcile" },
        { title: "Sin olores", body: "Camión limpio.", bucket: "attest" },
      ],
    });
    expect(html).toContain("Peso");
    expect(html).toContain("Sin olores");
    expect(html.toLowerCase()).toContain("firma"); // blank signature/receptor block
  });

  it("HTML-escapes interpolated values (no injection from load data)", () => {
    const html = renderGuiaHtml({ templateBody: "{{x}} {{requisitos}}", data: { x: "<script>alert(1)</script>" }, clauses: [] });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("DEFAULT_GUIA_TEMPLATE contains the requisitos marker", () => {
    expect(DEFAULT_GUIA_TEMPLATE).toContain("{{requisitos}}");
  });
});
