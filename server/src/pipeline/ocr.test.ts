import { describe, it, expect } from "vitest";
import { groundFields, type Word } from "./ocr.js";

const words: Word[] = [
  { text: "Peso:", bbox: [10, 10, 40, 12] },
  { text: "8,900", bbox: [55, 10, 34, 12] },
  { text: "kg", bbox: [92, 10, 16, 12] },
  { text: "Placa", bbox: [10, 30, 40, 12] },
  { text: "ABC-123", bbox: [55, 30, 60, 12] },
];

describe("groundFields (pure)", () => {
  it("matches a single-token verbatim to its box", () => {
    const out = groundFields({ placa: { verbatim: "ABC-123" } }, words);
    expect(out.placa).toEqual([55, 30, 60, 12]);
  });

  it("unions boxes across contiguous tokens (normalizing commas/units)", () => {
    const out = groundFields({ peso: { verbatim: "8,900 kg" } }, words);
    // union of "8,900" (55,10,34,12) and "kg" (92,10,16,12) → x 55..108, y 10..22
    expect(out.peso).toEqual([55, 10, 53, 12]);
  });

  it("returns null when the verbatim is empty or not found", () => {
    const out = groundFields({ receptor: { verbatim: "" }, x: { verbatim: "Zzz" } }, words);
    expect(out.receptor).toBeNull();
    expect(out.x).toBeNull();
  });

  it("matches across accent differences (Peruvian place/proper names)", () => {
    const accented: Word[] = [
      { text: "Cañete", bbox: [10, 50, 60, 12] },
      { text: "José", bbox: [10, 70, 40, 12] },
      { text: "Ñañez", bbox: [55, 70, 40, 12] },
    ];
    // VLM verbatim without accents still grounds to the accented OCR word(s)
    expect(groundFields({ destino: { verbatim: "Canete" } }, accented).destino).toEqual([10, 50, 60, 12]);
    expect(groundFields({ receptor: { verbatim: "Jose Nanez" } }, accented).receptor).toEqual([10, 70, 85, 12]);
  });
});
