import { describe, it, expect, vi, beforeEach } from "vitest";

describe("getAnthropic", () => {
  beforeEach(() => { vi.resetModules(); });

  it("throws AI_UNCONFIGURED when the key is empty", async () => {
    vi.doMock("../config.js", () => ({ config: { ANTHROPIC_API_KEY: "", CLAUDE_MODEL: "claude-opus-4-8" } }));
    const { getAnthropic } = await import("./client.js");
    expect(() => getAnthropic()).toThrowError(/AI_UNCONFIGURED|no está configurado/i);
  });

  it("returns a client when the key is set", async () => {
    vi.doMock("../config.js", () => ({ config: { ANTHROPIC_API_KEY: "sk-test", CLAUDE_MODEL: "claude-opus-4-8" } }));
    const { getAnthropic } = await import("./client.js");
    expect(getAnthropic()).toBeTruthy();
  });
});
