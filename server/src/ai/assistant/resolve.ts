import type { Db } from "./types.js";
import { ClarifyError } from "./types.js";

async function resolveOne(
  db: Db, table: "drivers" | "units" | "clients", column: "name" | "plate",
  term: string, noun: string,
): Promise<string> {
  const t = term.trim();
  const { data } = await db.from(table).select(`id, ${column}`).ilike(column, `%${t}%`).limit(5);
  const rows = (data ?? []) as Array<Record<string, any>>;
  if (rows.length === 0) throw new ClarifyError(`No encontré ${noun} que coincida con "${t}".`);
  if (rows.length > 1) {
    const names = rows.map((r) => r[column]).join(", ");
    throw new ClarifyError(`Hay varios que coinciden con "${t}": ${names}. Especifica cuál.`);
  }
  return rows[0].id as string;
}

export const resolveDriverId = (db: Db, name: string) => resolveOne(db, "drivers", "name", name, "un conductor");
export const resolveUnitId = (db: Db, plate: string) => resolveOne(db, "units", "plate", plate, "una unidad (placa)");
export const resolveClientId = (db: Db, name: string) => resolveOne(db, "clients", "name", name, "un cliente");
