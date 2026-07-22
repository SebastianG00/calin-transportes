import { describe, it, expect } from "vitest";
import { Jimp } from "jimp";
import { mockSignedGuia } from "./guia.js";

const FIELDS = {
  receptor: "Juan Perez", ruc_receptor: "20100047218", fecha_entrega: "01/08/2026",
  peso: "8900", bultos: "120", destino: "Arequipa", conductor: "Luis Gomez",
  placa: "ABC-123", guia_serie: "T001", guia_numero: "000456", observaciones: "recibido conforme",
  firma: true, sello: false,
};

describe("mockSignedGuia", () => {
  it("renders a PNG and returns a ground-truth box per text field", async () => {
    const g = await mockSignedGuia(FIELDS);
    const img = await Jimp.read(g.image);
    expect(img.bitmap.width).toBeGreaterThan(0);
    expect(g.firma_presente).toBe(true);
    expect(g.sello_presente).toBe(false);
    for (const k of ["receptor", "peso", "placa", "guia_numero"]) {
      const b = g.truth[k].bbox;
      expect(b[2]).toBeGreaterThan(0); // width
      expect(b[3]).toBeGreaterThan(0); // height
      expect(b[0]).toBeGreaterThanOrEqual(0);
    }
    expect(g.truth.peso.value).toBe("8900");
  });
});
