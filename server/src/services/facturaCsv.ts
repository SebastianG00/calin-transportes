export interface FacturaCsvRow {
  fecha_emision: string; ruc_emisor: string; razon_social: string;
  serie: string; numero: string; moneda: string; subtotal: string;
  igv: string; total: string; cliente: string; factura_id: string;
}

const HEADERS: (keyof FacturaCsvRow)[] = [
  "fecha_emision", "ruc_emisor", "razon_social", "serie", "numero",
  "moneda", "subtotal", "igv", "total", "cliente", "factura_id",
];

function cell(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: string[][]): string {
  return [headers.map(cell).join(","), ...rows.map((r) => r.map(cell).join(","))].join("\r\n");
}

export function facturasToCsv(rows: FacturaCsvRow[]): string {
  return toCsv(HEADERS as string[], rows.map((r) => HEADERS.map((h) => r[h] ?? "")));
}
