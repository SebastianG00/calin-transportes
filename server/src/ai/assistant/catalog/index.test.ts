import { describe, it, expect } from "vitest";
import { CATALOG, CATALOG_NAMES } from "./index.js";

describe("CATALOG", () => {
  it("aggregates all four groups with unique names", () => {
    expect(CATALOG.length).toBe(12);
    expect(new Set(CATALOG_NAMES).size).toBe(CATALOG_NAMES.length); // no dupes
    for (const t of CATALOG) {
      expect(typeof t.name).toBe("string");
      expect(typeof t.description).toBe("string");
      expect(typeof t.run).toBe("function");
    }
  });
});
