// Deterministic SUNAT QR parsing + pure field-format checks (no AI, no I/O).
// Field ORDERS below are PROVISIONAL — confirm against the real SUNAT spec and
// real guía photos, then lock. The parser is table-driven so that is config,
// not rework (see plan Global Constraints).

export type DocType =
  | "gre_remitente"
  | "gre_transportista"
  | "factura"
  | "other";

export const TIPO_DOC_TO_DOCTYPE: Record<string, DocType> = {
  "01": "factura",
  "09": "gre_remitente",
  "31": "gre_transportista",
};

export interface SunatQrFields {
  ruc: string;
  tipoDoc: string;
  docType: DocType;
  serie: string;
  numero: string;
  fecha: string;
  rucDestinatario?: string;
  montoTotal?: string;
}

// PROVISIONAL field orders, keyed by tipoDoc. `_` marks positions we skip.
const FACTURA_ORDER = [
  "ruc", "tipoDoc", "serie", "numero", "_igv", "montoTotal",
  "fecha", "_tipoDocAdq", "rucDestinatario",
] as const;
const GRE_ORDER = [
  "ruc", "tipoDoc", "serie", "numero", "fecha", "rucDestinatario",
] as const;

function orderFor(tipoDoc: string): readonly string[] {
  return tipoDoc === "01" ? FACTURA_ORDER : GRE_ORDER;
}

export function parseSunatQr(payload: string): SunatQrFields | null {
  if (!payload || !payload.includes("|")) return null;
  const parts = payload.split("|").map((s) => s.trim());
  const tipoDoc = parts[1];
  const docType = TIPO_DOC_TO_DOCTYPE[tipoDoc] ?? "other";
  const order = orderFor(tipoDoc);
  if (parts.length < order.length) return null;

  const get = (key: string): string | undefined => {
    const idx = order.indexOf(key);
    return idx >= 0 ? parts[idx] : undefined;
  };

  const ruc = get("ruc");
  const serie = get("serie");
  const numero = get("numero");
  const rawFecha = get("fecha");
  if (!ruc || !serie || !numero || !rawFecha) return null;
  const fecha = parseSunatDate(rawFecha);
  if (!fecha) return null;

  return {
    ruc, tipoDoc, docType, serie, numero, fecha,
    rucDestinatario: get("rucDestinatario"),
    montoTotal: get("montoTotal"),
  };
}

const RUC_PREFIXES = ["10", "15", "16", "17", "20"];
export function hasValidRucPrefix(ruc: string): boolean {
  return /^\d{11}$/.test(ruc) && RUC_PREFIXES.includes(ruc.slice(0, 2));
}

// Serie: a letter followed by 3 alphanumerics (e.g. F001, T001). Numero: 1-8 digits.
export function isValidSerieNumero(serie: string, numero: string): boolean {
  return /^[A-Z][A-Z0-9]{3}$/i.test(serie) && /^\d{1,8}$/.test(numero);
}

export function parseSunatDate(raw: string): string | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  let y: number, m: number, d: number;
  if (iso) { y = +iso[1]; m = +iso[2]; d = +iso[3]; }
  else if (dmy) { d = +dmy[1]; m = +dmy[2]; y = +dmy[3]; }
  else return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return null; // rejects 2026-13-40 etc.
  }
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}
