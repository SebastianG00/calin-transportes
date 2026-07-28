export interface DateRange { from: string; to: string }

const MONTHS: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};
const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const lastDay = (y: number, m: number) => new Date(y, m, 0).getDate();

/** Turn a loose Spanish period into an ISO date range, or null for "no filter". */
export function parsePeriod(period: string | undefined, now: Date = new Date()): DateRange | null {
  const p = (period ?? "").trim().toLowerCase();
  if (!p) return null;
  const y = now.getFullYear();
  const mNow = now.getMonth() + 1;
  const d = now.getDate();

  if (p === "hoy") return { from: iso(y, mNow, d), to: iso(y, mNow, d) };
  if (p === "esta semana" || p === "semana") {
    const dow = (now.getDay() + 6) % 7; // Monday=0
    const start = new Date(now); start.setDate(d - dow);
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return {
      from: iso(start.getFullYear(), start.getMonth() + 1, start.getDate()),
      to: iso(end.getFullYear(), end.getMonth() + 1, end.getDate()),
    };
  }
  if (p === "este mes" || p === "mes actual" || p === "el mes") {
    return { from: iso(y, mNow, 1), to: iso(y, mNow, lastDay(y, mNow)) };
  }
  const ym = p.match(/^(\d{4})-(\d{2})$/);
  if (ym) {
    const yy = Number(ym[1]); const mm = Number(ym[2]);
    if (mm >= 1 && mm <= 12) return { from: iso(yy, mm, 1), to: iso(yy, mm, lastDay(yy, mm)) };
  }
  if (MONTHS[p]) {
    const mm = MONTHS[p];
    return { from: iso(y, mm, 1), to: iso(y, mm, lastDay(y, mm)) };
  }
  return null;
}
