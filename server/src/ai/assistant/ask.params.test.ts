import { describe, it, expect } from "vitest";
import { z } from "zod/v4";
import { CATALOG } from "./catalog/index.js";
import { SELECTION_PARAM_KEYS } from "./ask.js";

// Regression guard for the "model returns empty params" bug: the selection schema
// must expose an explicit field for EVERY param key any catalog tool needs, or the
// model has no structured slot to fill and required-param tools silently fail.
describe("selection params cover the whole catalog", () => {
  it("every catalog tool param key is fillable via SELECTION_PARAM_KEYS", () => {
    const covered = new Set<string>(SELECTION_PARAM_KEYS);
    const missing: string[] = [];
    for (const t of CATALOG) {
      const shape = (t.schema as z.ZodObject<any>).shape as Record<string, unknown>;
      for (const key of Object.keys(shape)) {
        if (!covered.has(key)) missing.push(`${t.name}.${key}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
