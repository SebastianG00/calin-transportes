import { z } from "zod/v4";
import type { QueryTool, QueryResult, Db } from "../types.js";
import { resolveUnitId } from "../resolve.js";

export const fleetTools: QueryTool[] = [
  {
    name: "units_needing_maintenance",
    description: "Lista unidades sin mantenimiento reciente (sin registro desde una fecha de corte). Params: since (opcional, 'AAAA-MM-DD'; por defecto hace 90 días).",
    schema: z.object({ since: z.string().optional() }),
    async run(params: { since?: string }, db: Db): Promise<QueryResult> {
      const cutoff = params.since ?? new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
      const { data: units } = await db.from("units").select("id, plate").eq("active", true).limit(200);
      const { data: recent } = await db.from("unit_maintenance").select("unit_id").gte("fecha", cutoff);
      const recentIds = new Set((recent ?? []).map((r: any) => r.unit_id));
      const stale = (units ?? []).filter((u: any) => !recentIds.has(u.id)).slice(0, 50);
      return {
        columns: ["Placa"], rows: stale.map((u: any) => [u.plate]),
        summary: `${stale.length} unidad(es) sin mantenimiento desde ${cutoff}.`,
      };
    },
  },
  {
    name: "last_maintenance_by_unit",
    description: "Muestra el último mantenimiento de una unidad por su placa. Params: plate (obligatorio).",
    schema: z.object({ plate: z.string() }),
    async run(params: { plate: string }, db: Db): Promise<QueryResult> {
      const unitId = await resolveUnitId(db, params.plate);
      const { data } = await db.from("unit_maintenance").select("fecha, tipo, detalle, costo")
        .eq("unit_id", unitId).order("fecha", { ascending: false }).limit(1);
      const m: any = (data ?? [])[0];
      if (!m) return { columns: ["Fecha", "Tipo", "Detalle"], rows: [], summary: "Esa unidad no tiene mantenimientos registrados." };
      return {
        columns: ["Fecha", "Tipo", "Detalle", "Costo"],
        rows: [[m.fecha, m.tipo, m.detalle ?? "—", m.costo ?? "—"]],
        summary: `Último mantenimiento el ${m.fecha} (${m.tipo}).`,
      };
    },
  },
  {
    name: "tasks_pending",
    description: "Lista tareas pendientes (estado 'pendiente'), ordenadas por prioridad. Params: due_today (opcional, 'true' para solo las que vencen hoy o antes).",
    schema: z.object({ due_today: z.string().optional() }),
    async run(params: { due_today?: string }, db: Db): Promise<QueryResult> {
      const today = new Date().toISOString().slice(0, 10);
      let q = db.from("tasks").select("titulo, prioridad, fecha_vencimiento").eq("estado", "pendiente");
      if (params.due_today === "true") q = q.not("fecha_vencimiento", "is", null).lte("fecha_vencimiento", today);
      const { data } = await q.limit(50);
      // NOTE: migration 0011_tasks.sql's CHECK constraint allows prioridad in
      // ('critica','importante','normal') — NOT 'alta'/'baja'. Rank map corrected to match.
      const rank: Record<string, number> = { critica: 0, importante: 1, normal: 2 };
      const rows = (data ?? []).sort((a: any, b: any) => (rank[a.prioridad] ?? 9) - (rank[b.prioridad] ?? 9))
        .map((t: any) => [t.titulo, t.prioridad, t.fecha_vencimiento ?? "—"]);
      return { columns: ["Tarea", "Prioridad", "Vence"], rows, summary: `${rows.length} tarea(s) pendiente(s).` };
    },
  },
];
