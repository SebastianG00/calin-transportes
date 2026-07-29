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
  return null;
}
