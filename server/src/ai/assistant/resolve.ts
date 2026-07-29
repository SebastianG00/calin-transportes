import type { Db } from "./types.js";
import { ClarifyError } from "./types.js";

// Lowercase + strip accents so "Juan" matches "Juán", "Nunez" matches "Núñez", etc.
// Postgres `ilike` is case-insensitive but NOT accent-insensitive (no `unaccent`
// extension installed), so we fetch the (small) table and match in JS instead.
const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

async function resolveOne(
  db: Db, table: "drivers" | "units" | "clients", column: "name" | "plate",
  term: string, noun: string,
): Promise<string> {
  const t = fold(term);
  const original = term.trim();
  const { data } = await db.from(table).select(`id, ${column}`);
  const rows = (data ?? []) as Array<Record<string, any>>;
  const matches = rows.filter((r) => fold(String(r[column] ?? "")).includes(t));
  if (matches.length === 0) throw new ClarifyError(`No encontré ${noun} que coincida con "${original}".`);
  if (matches.length > 1) {
    const names = matches.map((r) => r[column]).slice(0, 5).join(", ");
    throw new ClarifyError(`Hay varios que coinciden con "${original}": ${names}. Especifica cuál.`);
  }
  return matches[0].id as string;
}

export const resolveDriverId = (db: Db, name: string) => resolveOne(db, "drivers", "name", name, "un conductor");
export const resolveUnitId = (db: Db, plate: string) => resolveOne(db, "units", "plate", plate, "una unidad (placa)");
export const resolveClientId = (db: Db, name: string) => resolveOne(db, "clients", "name", name, "un cliente");
