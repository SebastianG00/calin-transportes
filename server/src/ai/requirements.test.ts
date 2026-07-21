import { describe, it, expect, vi, beforeEach } from "vitest";

const parse = vi.fn();
vi.mock("./client.js", () => ({
  getAnthropic: () => ({ messages: { parse } }),
  CLAUDE_MODEL: "claude-opus-4-8",
}));

describe("draftClauses", () => {
  beforeEach(() => { parse.mockReset(); });

  it("maps structured output into clause drafts tagged by bucket", async () => {
    parse.mockResolvedValue({
      parsed_output: {
        clauses: [
          { title: "Peso máximo", body: "No exceder 9 toneladas.", bucket: "reconcile", params: { max_peso_kg: 9000 } },
          { title: "Camión limpio", body: "Sin olores ni residuos.", bucket: "attest", params: {} },
        ],
      },
    });
    const { draftClauses } = await import("./requirements.js");
    const out = await draftClauses("El camión no debe pasar 9 toneladas y debe llegar limpio y sin olores.");
    expect(out).toHaveLength(2);
    expect(out[0].bucket).toBe("reconcile");
    expect(out[0].params).toEqual({ max_peso_kg: 9000 });
    expect(out[1].title).toBe("Camión limpio");
  });

  it("returns [] when the model yields no clauses", async () => {
    parse.mockResolvedValue({ parsed_output: { clauses: [] } });
    const { draftClauses } = await import("./requirements.js");
    expect(await draftClauses("texto sin requisitos")).toEqual([]);
  });
});
