import { describe, it, expect, vi } from "vitest";
import { runOnce, type Sweep } from "./runner.js";

describe("runOnce", () => {
  it("runs all sweeps and isolates a failing one", async () => {
    const good: Sweep = { name: "good", run: vi.fn().mockResolvedValue({ acted: 2 }) };
    const bad: Sweep = { name: "bad", run: vi.fn().mockRejectedValue(new Error("boom")) };
    const good2: Sweep = { name: "good2", run: vi.fn().mockResolvedValue({ acted: 0 }) };
    const results = await runOnce([good, bad, good2]);
    expect(good.run).toHaveBeenCalled();
    expect(good2.run).toHaveBeenCalled(); // bad did not stop the others
    expect(results.find((r) => r.name === "bad")?.ok).toBe(false);
    expect(results.find((r) => r.name === "good")?.acted).toBe(2);
  });
});
