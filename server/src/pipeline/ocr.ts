import { createWorker } from "tesseract.js";

export interface Word { text: string; bbox: [number, number, number, number]; } // [x, y, w, h]

/** Tesseract adapter: OCR the image into word boxes. Thin + side-effecting.
 *  NOTE: the exact path to per-word boxes depends on the installed tesseract.js
 *  version. Verify against node_modules/tesseract.js: recent versions expose
 *  words under `data.blocks[].paragraphs[].lines[].words[]` and require the
 *  `{ blocks: true }` recognize option; older ones expose `data.words`. Adapt
 *  the extraction below to whichever the installed version returns. */
export async function ocrWordBoxes(image: Buffer): Promise<Word[]> {
  const worker = await createWorker("spa");
  try {
    const { data } = await worker.recognize(image, {}, { blocks: true });
    const words =
      (data as { words?: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }> }).words ??
      ((data.blocks ?? []) as any[]).flatMap((b) =>
        (b.paragraphs ?? []).flatMap((p: any) => (p.lines ?? []).flatMap((l: any) => l.words ?? [])),
      );
    return (words ?? []).map((w: any) => ({
      text: String(w.text ?? ""),
      bbox: [w.bbox.x0, w.bbox.y0, w.bbox.x1 - w.bbox.x0, w.bbox.y1 - w.bbox.y0] as [number, number, number, number],
    }));
  } finally {
    await worker.terminate();
  }
}

// Lowercase, strip accents (NFD), then drop whitespace/punctuation so grounding
// matches across accent differences between the VLM verbatim and the OCR read
// (e.g. "Cañete" ↔ "Canete", "José" ↔ "Jose") — common in Peruvian place/proper names.
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[\s,.\-]/g, "");
}

function unionBox(boxes: Word["bbox"][]): Word["bbox"] {
  const x0 = Math.min(...boxes.map((b) => b[0]));
  const y0 = Math.min(...boxes.map((b) => b[1]));
  const x1 = Math.max(...boxes.map((b) => b[0] + b[2]));
  const y1 = Math.max(...boxes.map((b) => b[1] + b[3]));
  return [x0, y0, x1 - x0, y1 - y0];
}

/** Pure: for each field's `verbatim`, find the shortest contiguous run of OCR
 *  words whose concatenated normalized text equals the normalized verbatim, and
 *  return the union of their boxes. No match (or empty verbatim) → null. */
export function groundFields(
  fields: Record<string, { verbatim: string }>,
  words: Word[],
): Record<string, [number, number, number, number] | null> {
  const nWords = words.map((w) => ({ n: norm(w.text), bbox: w.bbox }));
  const out: Record<string, [number, number, number, number] | null> = {};
  for (const [key, f] of Object.entries(fields)) {
    const target = norm(f.verbatim ?? "");
    out[key] = target ? match(target, nWords) : null;
  }
  return out;
}

function match(target: string, nWords: Array<{ n: string; bbox: Word["bbox"] }>): Word["bbox"] | null {
  for (let i = 0; i < nWords.length; i++) {
    let joined = "";
    for (let j = i; j < nWords.length && joined.length <= target.length + 4; j++) {
      joined += nWords[j].n;
      if (joined === target) return unionBox(nWords.slice(i, j + 1).map((w) => w.bbox));
    }
  }
  // Fallback: a single word that contains the target (e.g. "000456" contains "456").
  for (const w of nWords) if (w.n.includes(target)) return w.bbox;
  // Last resort: fuzzy span match — recovers a single OCR misread ("ABC-123" → "ABC-l23")
  // that breaks the exact match. Purely additive: only runs when the two matches above
  // both missed, so it can only turn a null into a box, never change an existing match.
  return fuzzyMatch(target, nWords);
}

/** Iterative Levenshtein distance (two-row DP). */
function levenshtein(a: string, b: string): number {
  const n = b.length;
  if (a.length === 0) return n;
  if (n === 0) return a.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  const curr = new Array<number>(n + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr.slice();
  }
  return prev[n];
}

/** Find the contiguous OCR-word span whose joined text is closest to `target` within a
 *  conservative, length-scaled edit budget (~1 edit / 6 chars). Skipped for short targets
 *  (< 6 chars) where a small edit distance would over-match. Returns the best span's box. */
function fuzzyMatch(target: string, nWords: Array<{ n: string; bbox: Word["bbox"] }>): Word["bbox"] | null {
  if (target.length < 6) return null;
  const maxDist = Math.floor(target.length / 6);
  let best: Word["bbox"] | null = null;
  let bestDist = maxDist + 1;
  for (let i = 0; i < nWords.length; i++) {
    let joined = "";
    for (let j = i; j < nWords.length && joined.length <= target.length + maxDist; j++) {
      joined += nWords[j].n;
      if (joined.length < target.length - maxDist) continue; // too short to be within budget yet
      const d = levenshtein(joined, target);
      if (d < bestDist) { bestDist = d; best = unionBox(nWords.slice(i, j + 1).map((w) => w.bbox)); }
    }
  }
  return bestDist <= maxDist ? best : null;
}
