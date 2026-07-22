// Deterministic synthetic guía images for tests — a white "sheet" with a real
// SUNAT-format QR composited in. No real photos needed (see spec).
import { Jimp, loadFont, measureText, measureTextHeight } from "jimp";
import { SANS_16_BLACK } from "@jimp/plugin-print/fonts";
import QRCode from "qrcode";

const SHEET_W = 600, SHEET_H = 800;

async function qrImage(payload: string) {
  const png = await QRCode.toBuffer(payload, { margin: 2, width: 300 });
  return Jimp.read(png);
}

export async function guiaWithQr(payload: string): Promise<Buffer> {
  const sheet = new Jimp({ width: SHEET_W, height: SHEET_H, color: 0xffffffff });
  const qr = await qrImage(payload);
  sheet.composite(qr, (SHEET_W - qr.bitmap.width) / 2, 60);
  return sheet.getBuffer("image/png");
}

export async function blankGuia(): Promise<Buffer> {
  const sheet = new Jimp({ width: SHEET_W, height: SHEET_H, color: 0xffffffff });
  return sheet.getBuffer("image/png");
}

export async function blurryGuia(payload: string): Promise<Buffer> {
  const sheet = new Jimp({ width: SHEET_W, height: SHEET_H, color: 0xffffffff });
  const qr = await qrImage(payload);
  sheet.composite(qr, (SHEET_W - qr.bitmap.width) / 2, 60);
  sheet.blur(12); // heavy blur → low variance-of-Laplacian
  return sheet.getBuffer("image/png");
}

export interface MockGuiaFields {
  receptor: string; ruc_receptor: string; fecha_entrega: string; peso: string; bultos: string;
  destino: string; conductor: string; placa: string; guia_serie: string; guia_numero: string;
  observaciones: string; firma: boolean; sello: boolean;
}
export interface MockGuia {
  image: Buffer;
  truth: Record<string, { value: string; bbox: [number, number, number, number] }>;
  firma_presente: boolean; sello_presente: boolean;
}

const ROWS: Array<[keyof MockGuiaFields, string]> = [
  ["guia_serie", "Serie"], ["guia_numero", "Numero"], ["fecha_entrega", "Fecha"],
  ["receptor", "Receptor"], ["ruc_receptor", "RUC"], ["destino", "Destino"],
  ["conductor", "Conductor"], ["placa", "Placa"], ["peso", "Peso"],
  ["bultos", "Bultos"], ["observaciones", "Obs"],
];

export async function mockSignedGuia(fields: MockGuiaFields): Promise<MockGuia> {
  const sheet = new Jimp({ width: SHEET_W, height: SHEET_H, color: 0xffffffff });
  const font = await loadFont(SANS_16_BLACK);
  const truth: MockGuia["truth"] = {};
  const x0 = 40;
  let y = 50;
  for (const [key, label] of ROWS) {
    const labelText = `${label}: `;
    const value = String(fields[key]);
    const labelW = measureText(font, labelText);
    const valueW = measureText(font, value);
    const h = measureTextHeight(font, value, valueW + 4);
    sheet.print({ font, x: x0, y, text: labelText + value });
    truth[key] = { value, bbox: [x0 + labelW, y, valueW, h] };
    y += h + 10;
  }
  // Signature scribble (a few dark diagonal strokes) in a "Firma" area.
  if (fields.firma) {
    const sy = SHEET_H - 120;
    for (let i = 0; i < 400; i++) {
      const px = 60 + Math.floor(80 * Math.abs(Math.sin(i / 12)));
      const py = sy + Math.floor(30 * Math.abs(Math.cos(i / 9)));
      sheet.setPixelColor(0x000000ff, px, py);
    }
  }
  // Stamp: a filled dark square if present.
  if (fields.sello) {
    for (let dx = 0; dx < 60; dx++) for (let dy = 0; dy < 60; dy++) {
      sheet.setPixelColor(0x222222ff, 300 + dx, SHEET_H - 130 + dy);
    }
  }
  const image = await sheet.getBuffer("image/png");
  return { image, truth, firma_presente: fields.firma, sello_presente: fields.sello };
}
