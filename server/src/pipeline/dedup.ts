import { hammingDistance } from "./image.js";

// PROVISIONAL — tune on real re-sent photos. Small = only near-identical images
// count as the same document.
export const DEDUP_HAMMING_THRESHOLD = 6;

export function isDuplicate(
  phash: string,
  priorHashes: string[],
  threshold: number = DEDUP_HAMMING_THRESHOLD,
): boolean {
  return priorHashes.some((h) => hammingDistance(phash, h) <= threshold);
}
