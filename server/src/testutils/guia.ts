// Deterministic synthetic guía images for tests — a white "sheet" with a real
// SUNAT-format QR composited in. No real photos needed (see spec).
import { Jimp } from "jimp";
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
