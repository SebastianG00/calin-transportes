import { describe, it, expect, vi, beforeEach } from "vitest";

const parse = vi.fn();
vi.mock("./client.js", () => ({ getAnthropic: () => ({ messages: { parse } }), CLAUDE_MODEL: "claude-opus-4-8" }));

const FULL = {
  receptor: { value: "Juan Pérez", verbatim: "Juan Perez" },
  ruc_receptor: { value: "20100047218", verbatim: "20100047218" },
  fecha_entrega: { value: "2026-08-01", verbatim: "01/08/2026" },
  peso: { value: "8900", verbatim: "8,900 kg" },
  bultos: { value: "120", verbatim: "120" },
  destino: { value: "Arequipa", verbatim: "Arequipa" },
  conductor: { value: "Luis Gómez", verbatim: "Luis Gomez" },
  placa: { value: "ABC-123", verbatim: "ABC-123" },
  guia_serie: { value: "T001", verbatim: "T001" },
  guia_numero: { value: "456", verbatim: "000456" },
  observaciones: { value: "recibido conforme", verbatim: "recibido conforme" },
  firma_presente: true, sello_presente: false,
};

describe("extractGuia", () => {
  beforeEach(() => { parse.mockReset(); });

  it("returns the structured extraction and sends an image + text block", async () => {
    parse.mockResolvedValue({ parsed_output: FULL });
    const { extractGuia, TEXT_FIELDS } = await import("./guiaVision.js");
    const out = await extractGuia(Buffer.from("fakepng"), "image/png");
    expect(out.peso.value).toBe("8900");
    expect(out.peso.verbatim).toBe("8,900 kg");
    expect(out.firma_presente).toBe(true);
    expect(TEXT_FIELDS).toHaveLength(11);
    const sent = parse.mock.calls[0][0];
    const content = sent.messages[0].content;
    expect(content.some((b: any) => b.type === "image" && b.source.type === "base64")).toBe(true);
    expect(JSON.stringify(sent.system)).toMatch(/no inventes|verbatim/i);
  });

  it("throws when the model returns no structured output", async () => {
    parse.mockResolvedValue({ parsed_output: null });
    const { extractGuia } = await import("./guiaVision.js");
    await expect(extractGuia(Buffer.from("x"), "image/png")).rejects.toThrow();
  });
});
