import { describe, it, expect } from "vitest";
import { isDuplicate, DEDUP_HAMMING_THRESHOLD } from "./dedup.js";

describe("isDuplicate", () => {
  it("is false with no priors", () => {
    expect(isDuplicate("0000000000000000", [])).toBe(false);
  });
  it("is true for an identical prior hash", () => {
    expect(isDuplicate("abcdef0123456789", ["abcdef0123456789"])).toBe(true);
  });
  it("is true within the threshold and false beyond it", () => {
    const base = "0000000000000000";
    const near = "0000000000000001"; // 1 bit off
    const far  = "ffffffffffffffff"; // 64 bits off
    expect(isDuplicate(near, [base], DEDUP_HAMMING_THRESHOLD)).toBe(true);
    expect(isDuplicate(far, [base], DEDUP_HAMMING_THRESHOLD)).toBe(false);
  });
});
