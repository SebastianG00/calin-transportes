// Image primitives for the delivery pipeline. jimp/jsqr are used ONLY to turn
// bytes into an RGBA pixel buffer + decode a QR; all scoring math below is pure
// and unit-tested on hand-built arrays (no native deps in the hot path).
import { Jimp } from "jimp";
import jsQR from "jsqr";

export interface Rgba {
  width: number;
  height: number;
  data: Uint8ClampedArray; // RGBA, 4 bytes per pixel
}

export function toGrayscale(img: Rgba): Uint8Array {
  const { data } = img;
  const out = new Uint8Array(data.length / 4);
  for (let i = 0; i < out.length; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    out[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  return out;
}

export function meanLuminance(gray: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < gray.length; i++) sum += gray[i];
  return gray.length ? sum / gray.length : 0;
}

// Variance of the Laplacian — the classic blur metric. Low = blurry/flat.
export function blurScore(gray: Uint8Array, width: number, height: number): number {
  const lap: number[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const c = gray[y * width + x];
      const up = gray[(y - 1) * width + x];
      const down = gray[(y + 1) * width + x];
      const left = gray[y * width + (x - 1)];
      const right = gray[y * width + (x + 1)];
      lap.push(up + down + left + right - 4 * c);
    }
  }
  if (lap.length === 0) return 0;
  const mean = lap.reduce((a, b) => a + b, 0) / lap.length;
  const variance = lap.reduce((a, v) => a + (v - mean) ** 2, 0) / lap.length;
  return variance;
}

// dHash: sample down to a 9x8 grayscale grid, compare each pixel to its right
// neighbour → 64 bits → 16 hex chars. Sampling avoids any jimp resize API churn.
export function dHash(img: Rgba): string {
  const gray = toGrayscale(img);
  const W = 9, H = 8;
  const small = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const sx = Math.min(img.width - 1, Math.floor((x + 0.5) * img.width / W));
      const sy = Math.min(img.height - 1, Math.floor((y + 0.5) * img.height / H));
      small[y * W + x] = gray[sy * img.width + sx];
    }
  }
  let bits = "";
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W - 1; x++) {
      bits += small[y * W + x] < small[y * W + x + 1] ? "1" : "0";
    }
  }
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Math.max(a.length, b.length) * 4;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) { dist += x & 1; x >>= 1; }
  }
  return dist;
}

export async function decodeToRgba(buf: Buffer): Promise<Rgba> {
  const img = await Jimp.read(buf);
  return {
    width: img.bitmap.width,
    height: img.bitmap.height,
    data: new Uint8ClampedArray(
      img.bitmap.data.buffer,
      img.bitmap.data.byteOffset,
      img.bitmap.data.length,
    ),
  };
}

export function decodeQr(img: Rgba): string | null {
  const result = jsQR(img.data, img.width, img.height);
  return result?.data ?? null;
}
