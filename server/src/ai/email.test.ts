import { describe, it, expect, vi, beforeEach } from "vitest";

const create = vi.fn();
vi.mock("./client.js", () => ({
  getAnthropic: () => ({ messages: { create } }),
  CLAUDE_MODEL: "claude-opus-4-8",
}));

describe("composeEmail", () => {
  beforeEach(() => { create.mockReset(); });

  it("returns the model's text and passes the confirmed data in the prompt", async () => {
    create.mockResolvedValue({ content: [{ type: "text", text: "Estimado cliente, su carga de 8900 kg fue entregada." }] });
    const { composeEmail } = await import("./email.js");
    const text = await composeEmail({ cliente: "Backus", carga: "Lápices", peso: "8900", destino: "Arequipa" });
    expect(text).toContain("8900");
    const sent = create.mock.calls[0][0];
    expect(JSON.stringify(sent.messages)).toContain("8900"); // data reached the prompt
    expect(JSON.stringify(sent.system)).toMatch(/no inventes|solo los datos/i); // guardrail present
  });

  it("includes a revise instruction on redraft", async () => {
    create.mockResolvedValue({ content: [{ type: "text", text: "Versión más corta." }] });
    const { composeEmail } = await import("./email.js");
    await composeEmail({ cliente: "Backus", peso: "8900" }, "acórtalo");
    expect(JSON.stringify(create.mock.calls[0][0].messages)).toContain("acórtalo");
  });
});
