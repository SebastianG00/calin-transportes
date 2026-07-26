// Pure, deterministic validation. NEVER mutates — returns {pass, reason_code}
// checks that the pipeline records and the human resolves. Reconciliation uses
// the load we created as ground truth. Messages are plain Spanish for the queue.
import { isValidRuc, hasValidRucPrefix, isValidSerieNumero, type SunatQrFields } from "@tp/types";

export interface Check {
  field: string;
  pass: boolean;
  reason_code: string;
  message: string;
}

export interface LoadFacts {
  clientRuc: string;
  scheduledDate: string; // YYYY-MM-DD
  windowDays?: number;
}

export interface Validation {
  overall: "green" | "amber" | "red";
  flags: Check[];
}

// PROVISIONAL — tune with real data.
export const DATE_WINDOW_DAYS = 3;

// Reason codes that are hard failures (red); everything else failing is amber.
const RED_CODES = new Set(["RUC_INVALID", "RUC_MISMATCH", "SERIE_NUMERO_INVALID", "PLACA_MISMATCH"]);

function daysBetween(a: string, b: string): number {
  const ms = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10)) -
             Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.abs(Math.round(ms / 86_400_000));
}

export function checkFormat(qr: SunatQrFields): Check[] {
  const checks: Check[] = [];
  const rucOk = isValidRuc(qr.ruc) && hasValidRucPrefix(qr.ruc);
  checks.push({
    field: "ruc", pass: rucOk,
    reason_code: rucOk ? "RUC_OK" : "RUC_INVALID",
    message: rucOk ? "" : `RUC ${qr.ruc} no pasa el dígito verificador.`,
  });

  const snOk = isValidSerieNumero(qr.serie, qr.numero);
  checks.push({
    field: "serie", pass: snOk,
    reason_code: snOk ? "SERIE_NUMERO_OK" : "SERIE_NUMERO_INVALID",
    message: snOk ? "" : `Serie-número inválido: ${qr.serie}-${qr.numero}.`,
  });

  const today = new Date().toISOString().slice(0, 10);
  const notFuture = qr.fecha <= today;
  checks.push({
    field: "fecha", pass: notFuture,
    reason_code: notFuture ? "DATE_OK" : "DATE_FUTURE",
    message: notFuture ? "" : `Fecha de emisión ${qr.fecha} está en el futuro.`,
  });

  return checks;
}

export function reconcileWithLoad(qr: SunatQrFields, load: LoadFacts): Check[] {
  const checks: Check[] = [];
  const rucMatch = qr.ruc === load.clientRuc;
  checks.push({
    field: "ruc", pass: rucMatch,
    reason_code: rucMatch ? "RUC_MATCH" : "RUC_MISMATCH",
    message: rucMatch ? "" : `RUC del guía ${qr.ruc} ≠ RUC del cliente ${load.clientRuc}.`,
  });

  const window = load.windowDays ?? DATE_WINDOW_DAYS;
  const inWindow = daysBetween(qr.fecha, load.scheduledDate) <= window;
  checks.push({
    field: "fecha", pass: inWindow,
    reason_code: inWindow ? "DATE_IN_WINDOW" : "DATE_OUT_OF_WINDOW",
    message: inWindow ? "" : `Fecha ${qr.fecha} fuera de ±${window} días de la carga (${load.scheduledDate}).`,
  });

  return checks;
}

export function composeValidation(checks: Check[]): Validation {
  const failed = checks.filter((c) => !c.pass);
  if (failed.length === 0) return { overall: "green", flags: [] };
  const overall = failed.some((c) => RED_CODES.has(c.reason_code)) ? "red" : "amber";
  return { overall, flags: failed };
}

export interface GuiaLoadFacts {
  weightKg: number;
  destination: string;
  scheduledDate: string; // YYYY-MM-DD
  plate: string;
  windowDays?: number;
}

// PROVISIONAL — tune on real guías. Peso within ±10% of the load weight passes.
export const PESO_TOLERANCE_FRAC = 0.1;

function normPlate(s: string): string { return s.toUpperCase().replace(/[\s-]/g, ""); }
function stripAccents(s: string): string { return s.normalize("NFD").replace(/[̀-ͯ]/g, ""); }
function normText(s: string): string { return stripAccents(s.toLowerCase()).replace(/[\s.,-]/g, ""); }

/** Parse a peso string that may carry a unit ("8900 kg") or thousands/decimal
 *  separators ("8,900", "8.900", "8,900.00") into kilograms. Returns NaN when
 *  there's no parseable number. */
function parsePeso(raw: string): number {
  const s = raw
    .toLowerCase()
    .replace(/kgs?\.?/g, "")   // strip unit
    .replace(/\s/g, "")        // strip spaces (incl. "8 900")
    .replace(/[.,]\d{1,2}$/, "") // drop a trailing 1-2 digit decimal group
    .replace(/[.,]/g, "");     // remaining separators are thousands
  return s === "" ? NaN : Number(s);
}

/** Reconcile VLM-read guía fields against the load. Blank fields are skipped
 *  (pass) — there's nothing to reconcile. Never mutates. */
export function reconcileGuiaWithLoad(
  fields: { peso?: string; destino?: string; fecha_entrega?: string; placa?: string },
  load: GuiaLoadFacts,
): Check[] {
  const checks: Check[] = [];

  const peso = parsePeso(fields.peso ?? "");
  if (fields.peso && Number.isFinite(peso)) {
    const ok = Math.abs(peso - load.weightKg) <= load.weightKg * PESO_TOLERANCE_FRAC;
    checks.push({ field: "peso", pass: ok, reason_code: ok ? "PESO_OK" : "PESO_MISMATCH",
      message: ok ? "" : `Peso ${peso} kg difiere del peso de la carga (${load.weightKg} kg).` });
  }

  if (fields.destino) {
    const a = normText(fields.destino), b = normText(load.destination);
    const ok = a.includes(b) || b.includes(a);
    checks.push({ field: "destino", pass: ok, reason_code: ok ? "DESTINO_OK" : "DESTINO_MISMATCH",
      message: ok ? "" : `Destino "${fields.destino}" ≠ destino de la carga "${load.destination}".` });
  }

  if (fields.placa) {
    const ok = normPlate(fields.placa) === normPlate(load.plate);
    checks.push({ field: "placa", pass: ok, reason_code: ok ? "PLACA_OK" : "PLACA_MISMATCH",
      message: ok ? "" : `Placa ${fields.placa} ≠ placa de la unidad ${load.plate}.` });
  }

  if (fields.fecha_entrega) {
    const window = load.windowDays ?? DATE_WINDOW_DAYS;
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(fields.fecha_entrega)
      ? daysBetween(fields.fecha_entrega, load.scheduledDate) <= window : true;
    checks.push({ field: "fecha", pass: ok, reason_code: ok ? "DATE_IN_WINDOW" : "DATE_OUT_OF_WINDOW",
      message: ok ? "" : `Fecha de entrega ${fields.fecha_entrega} fuera de ±${window} días de la carga (${load.scheduledDate}).` });
  }

  return checks;
}
