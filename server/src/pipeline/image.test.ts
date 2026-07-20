import { describe, it, expect } from "vitest";
import {
  toGrayscale, meanLuminance, blurScore, dHash, hammingDistance, type Rgba,
} from "./image.js";

// Build a solid-color RGBA image.
function solid(width: number, height: number, v: number): Rgba {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = v; data[i * 4 + 1] = v; data[i * 4 + 2] = v; data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

// Build a sharp vertical black/white stripe pattern.
function stripes(width: number, height: number): Rgba {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = x % 2 === 0 ? 0 : 255;
      const i = (y * width + x) * 4;
      data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 255;
    }
  }
  return { width, height, data };
}

describe("meanLuminance", () => {
  it("is the flat gray value", () => {
    expect(Math.round(meanLuminance(toGrayscale(solid(4, 4, 128))))).toBe(128);
  });
});

describe("blurScore", () => {
  it("is ~0 for a flat image and high for sharp edges", () => {
    const flat = solid(16, 16, 128);
    const sharp = stripes(16, 16);
    const flatScore = blurScore(toGrayscale(flat), 16, 16);
    const sharpScore = blurScore(toGrayscale(sharp), 16, 16);
    expect(flatScore).toBeLessThan(1);
    expect(sharpScore).toBeGreaterThan(flatScore + 1000);
  });
});

describe("dHash + hammingDistance", () => {
  it("returns 16 hex chars and 0 distance to itself", () => {
    const h = dHash(stripes(32, 32));
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(hammingDistance(h, h)).toBe(0);
  });
  it("distance grows between dissimilar images", () => {
    const a = dHash(solid(32, 32, 20));
    const b = dHash(stripes(32, 32));
    expect(hammingDistance(a, b)).toBeGreaterThan(5);
  });
});
