import { z } from "zod/v4";
import type { QueryTool, QueryResult, Db } from "../types.js";
import { parsePeriod } from "../dates.js";
import { resolveDriverId, resolveUnitId } from "../resolve.js";

const LOAD_COLS = "scheduled_date,destination,status,weight_kg,driver:drivers(name),unit:units(plate)";

/** Aggregate load volume per client (count or total weight), paging through ALL matching
 *  loads so a busy period can't silently undercount past a fixed row cap. `pageSize` is
 *  injectable so the pagination loop is unit-testable without seeding thousands of rows. */
export async function aggregateClientVolume(
  db: Db,
  range: { from: string; to: string } | null,
  metric: "peso" | "cargas",
  pageSize = 1000,
): Promise<Map<string, number>> {
  const agg = new Map<string, number>();
  for (let from = 0; ; from += pageSize) {
    let q = db.from("loads").select("weight_kg,client:clients(name)");
    if (range) q = q.gte("scheduled_date", range.from).lte("scheduled_date", range.to);
    const { data } = await q.range(from, from + pageSize - 1);
    const rows = (data ?? []) as any[];
    for (const l of rows) {
      const name = l.client?.name ?? "—";
      agg.set(name, (agg.get(name) ?? 0) + (metric === "peso" ? Number(l.weight_kg ?? 0) : 1));
    }
    if (rows.length < pageSize) break;
  }
  return agg;
}

export const entityTools: QueryTool[] = [
  {
    name: "loads_by_driver",
    description: "Lista las cargas asignadas a un conductor. Params: driver_name (obligatorio), period (opcional).",
    schema: z.object({ driver_name: z.string(), period: z.string().optional() }),
    async run(params: { driver_name: string; period?: string }, db: Db): Promise<QueryResult> {
      const driverId = await resolveDriverId(db, params.driver_name); // throws ClarifyError if 0/many
      const range = parsePeriod(params.period);
      let q = db.from("loads").select(LOAD_COLS).eq("assigned_driver_id", driverId);
      if (range) q = q.gte("scheduled_date", range.from).lte("scheduled_date", range.to);
      const { data } = await q.order("scheduled_date", { ascending: false }).limit(50);
      const rows = (data ?? []).map((l: any) => [l.scheduled_date, l.destination ?? "—", l.status, l.unit?.plate ?? "—"]);
      return { columns: ["Fecha", "Destino", "Estado", "Placa"], rows, summary: `${rows.length} carga(s) para ese conductor.` };
    },
  },
  {
    name: "last_load_by_unit",
    description: "Muestra la última carga (más reciente) de una unidad por su placa. Params: plate (obligatorio).",
    schema: z.object({ plate: z.string() }),
    async run(params: { plate: string }, db: Db): Promise<QueryResult> {
      const unitId = await resolveUnitId(db, params.plate);
      const { data } = await db.from("loads").select(LOAD_COLS).eq("assigned_unit_id", unitId)
        .order("scheduled_date", { ascending: false }).limit(1);
      const l: any = (data ?? [])[0];
      if (!l) return { columns: ["Fecha", "Destino", "Estado"], rows: [], summary: "Esa unidad no tiene cargas registradas." };
      return {
        columns: ["Fecha", "Destino", "Estado", "Chofer"],
        rows: [[l.scheduled_date, l.destination ?? "—", l.status, l.driver?.name ?? "—"]],
        summary: `Última carga: ${l.destination ?? "—"} (${l.status}).`,
      };
    },
  },
  {
    name: "top_clients_by_volume",
    description: "Ranking de clientes por volumen en un periodo. Params: period (opcional), metric ('peso' o 'cargas', por defecto 'cargas').",
    schema: z.object({ period: z.string().optional(), metric: z.enum(["peso", "cargas"]).optional() }),
    async run(params: { period?: string; metric?: "peso" | "cargas" }, db: Db): Promise<QueryResult> {
      const metric = params.metric ?? "cargas";
      const range = parsePeriod(params.period);
      const agg = await aggregateClientVolume(db, range, metric);
      const ranked = [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 50);
      const unit = metric === "peso" ? "kg" : "cargas";
      const rows = ranked.map(([name, v]) => [name, metric === "peso" ? Number(v.toFixed(0)) : v]);
      const top = ranked[0];
      return {
        columns: ["Cliente", metric === "peso" ? "Peso (kg)" : "Cargas"], rows,
        summary: top ? `${top[0]} lidera con ${Number(top[1].toFixed(0))} ${unit}.` : "No hay datos en el periodo.",
      };
    },
  },
];
