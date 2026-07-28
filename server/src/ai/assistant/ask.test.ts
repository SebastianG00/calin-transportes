import { describe, it, expect, vi, beforeEach } from "vitest";

const parse = vi.fn();
const create = vi.fn();
vi.mock("../client.js", () => ({
  getAnthropic: () => ({ messages: { parse, create } }),
  CLAUDE_MODEL: "claude-opus-4-8",
}));
// Stub the catalog with one fake tool so no DB is touched.
vi.mock("./catalog/index.js", () => ({
  CATALOG: [{
    name: "count_loads_by_status",
    description: "cuenta cargas",
    schema: { parse: (v: any) => v },
    run: vi.fn(async () => ({ columns: ["Estado"], rows: [["en_route"]], summary: "1 carga en ruta." })),
  }],
  CATALOG_NAMES: ["count_loads_by_status"],
}));

describe("askAssistant", () => {
  beforeEach(() => { parse.mockReset(); create.mockReset(); });

  it("runs the selected tool and returns its table + a gloss", async () => {
    parse.mockResolvedValue({ parsed_output: { tool: "count_loads_by_status", params: { status: "en_route" } } });
    create.mockResolvedValue({ content: [{ type: "text", text: "Hay 1 carga en ruta." }] });
    const { askAssistant } = await import("./ask.js");
    const res = await askAssistant("¿cuántas cargas en ruta hay?");
    expect(res.tool).toBe("count_loads_by_status");
    expect(res.table?.rows).toEqual([["en_route"]]);
    expect(res.answer).toBe("Hay 1 carga en ruta.");
    // the query summary reached the gloss prompt
    expect(JSON.stringify(create.mock.calls[0][0].messages)).toContain("1 carga en ruta");
  });

  it("returns the no-puedo answer when the model selects no tool", async () => {
    parse.mockResolvedValue({ parsed_output: { tool: "none", params: {} } });
    const { askAssistant } = await import("./ask.js");
    const res = await askAssistant("¿cuánto es 2+2?");
    expect(res.tool).toBeNull();
    expect(res.table).toBeNull();
    expect(res.answer).toMatch(/no puedo responder/i);
    expect(create).not.toHaveBeenCalled(); // no gloss call when nothing ran
  });

  it("returns the ClarifyError message as the answer", async () => {
    const { ClarifyError } = await import("./types.js");
    parse.mockResolvedValue({ parsed_output: { tool: "count_loads_by_status", params: {} } });
    const mod = await import("./catalog/index.js");
    (mod.CATALOG[0].run as any).mockRejectedValueOnce(new ClarifyError('No encontré un conductor llamado "X".'));
    const { askAssistant } = await import("./ask.js");
    const res = await askAssistant("cargas de X");
    expect(res.answer).toContain("No encontré");
    expect(res.table).toBeNull();
  });
});
