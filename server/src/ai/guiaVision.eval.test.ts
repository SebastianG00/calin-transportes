import { describe, it, expect } from "vitest";
import { mockSignedGuia } from "../testutils/guia.js";
import { extractGuia } from "./guiaVision.js";
import { ocrWordBoxes, groundFields } from "../pipeline/ocr.js";

const RUN = !!process.env.RUN_AI_EVAL; // opt-in: RUN_AI_EVAL=1 + a real ANTHROPIC_API_KEY

function iou(a: [number,number,number,number], b: [number,number,number,number]): number {
  const x0 = Math.max(a[0], b[0]), y0 = Math.max(a[1], b[1]);
  const x1 = Math.min(a[0]+a[2], b[0]+b[2]), y1 = Math.min(a[1]+a[3], b[1]+b[3]);
  const inter = Math.max(0, x1-x0) * Math.max(0, y1-y0);
  const uni = a[2]*a[3] + b[2]*b[3] - inter;
  return uni > 0 ? inter / uni : 0;
}

const SAMPLES = [
  { receptor: "Juan Perez", ruc_receptor: "20100047218", fecha_entrega: "01/08/2026", peso: "8900",
    bultos: "120", destino: "Arequipa", conductor: "Luis Gomez", placa: "ABC-123", guia_serie: "T001",
    guia_numero: "000456", observaciones: "recibido conforme", firma: true, sello: false },
  { receptor: "Maria Lopez", ruc_receptor: "20100128056", fecha_entrega: "15/09/2026", peso: "5200",
    bultos: "80", destino: "Trujillo", conductor: "Ana Diaz", placa: "XYZ-789", guia_serie: "T002",
    guia_numero: "000789", observaciones: "conforme", firma: true, sello: true },
];

describe.skipIf(!RUN)("guiaVision eval (live, opt-in)", () => {
  it("extracts fields, detects signature, and grounds boxes on mock guías", async () => {
    let fieldHits = 0, fieldTotal = 0, firmaTP = 0, firmaFN = 0, iouSum = 0, iouN = 0;
    for (const s of SAMPLES) {
      const g = await mockSignedGuia(s);
      const ext = await extractGuia(g.image, "image/png");
      for (const k of ["receptor", "peso", "placa", "destino", "guia_numero"] as const) {
        fieldTotal++;
        if (ext[k].value.replace(/\s/g, "").toLowerCase().includes(String(g.truth[k].value).replace(/\s/g, "").toLowerCase())) fieldHits++;
      }
      if (s.firma) { ext.firma_presente ? firmaTP++ : firmaFN++; }
      const words = await ocrWordBoxes(g.image);
      const boxes = groundFields({ peso: { verbatim: ext.peso.verbatim } }, words);
      if (boxes.peso) { iouSum += iou(boxes.peso, g.truth.peso.bbox); iouN++; }
    }
    expect(fieldHits / fieldTotal).toBeGreaterThan(0.7);      // extraction tripwire
    expect(firmaTP / (firmaTP + firmaFN)).toBeGreaterThan(0.9); // signature recall
    if (iouN) expect(iouSum / iouN).toBeGreaterThan(0.3);     // grounding tripwire
  }, 120_000);
});
