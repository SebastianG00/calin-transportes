import { describe, it, expect, vi, beforeEach } from "vitest";

const create = vi.fn();
vi.mock("./client.js", () => ({
  getAnthropic: () => ({ messages: { create } }),
  CLAUDE_MODEL: "claude-opus-4-8",
}));

describe("draftWhatsapp", () => {
  beforeEach(() => { create.mockReset(); });

  it("passes the confirmed facts and returns the model text", async () => {
    create.mockResolvedValue({ content: [{ type: "text", text: "Hola Juan, confirma la carga a Arequipa. 🚚" }] });
    const { draftWhatsapp } = await import("./whatsappDraft.js");
    const text = await draftWhatsapp(
      { chofer: "Juan", destino: "Arequipa", placa: "ABC-123" },
      "recordar_confirmacion",
    );
    expect(text).toBe("Hola Juan, confirma la carga a Arequipa. 🚚");
    const sent = create.mock.calls[0][0];
    const msgs = JSON.stringify(sent.messages);
    expect(msgs).toContain("Arequipa");        // fact reached the prompt
    expect(msgs).toContain("ABC-123");          // fact reached the prompt
    expect(JSON.stringify(sent.system)).toMatch(/no inventes|solo los datos/i); // guardrail present
  });

  it("includes the intent objective and the free-text instruction", async () => {
    create.mockResolvedValue({ content: [{ type: "text", text: "ok" }] });
    const { draftWhatsapp } = await import("./whatsappDraft.js");
    await draftWhatsapp({ chofer: "Ana" }, "personalizado", "tono más formal");
    const msgs = JSON.stringify(create.mock.calls[0][0].messages);
    expect(msgs).toContain("tono más formal");
    expect(msgs).toContain("según la instrucción libre"); // intent objective reached the prompt
  });

  it("propagates the 503 when the AI client is unconfigured", async () => {
    vi.resetModules();
    vi.doMock("./client.js", () => ({
      getAnthropic: () => { throw new Error("AI_UNCONFIGURED"); },
      CLAUDE_MODEL: "claude-opus-4-8",
    }));
    const { draftWhatsapp } = await import("./whatsappDraft.js");
    await expect(draftWhatsapp({ chofer: "Ana" }, "recordar_confirmacion")).rejects.toThrow("AI_UNCONFIGURED");
    vi.doUnmock("./client.js");
    vi.resetModules();
  });
});
