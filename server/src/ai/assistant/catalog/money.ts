import { z } from "zod/v4";
import type { QueryTool, QueryResult, Db } from "../types.js";
import { parsePeriod } from "../dates.js";
import { resolveUnitId } from "../resolve.js";

const num = (s: unknown) => {
  const n = parseFloat(String(s ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export const moneyTools: QueryTool[] = [
  {
    name: "facturado_total",
    description: "Suma el total de las facturas CONFIRMADAS en un periodo. Params: period (obligatorio, p. ej. 'julio', 'AAAA-MM').",
    schema: z.object({ period: z.string() }),
    async run(params: { period: string }, db: Db): Promise<QueryResult> {
      const range = parsePeriod(params.period);
      let q = db.from("facturas").select("extracted, confirmed_at").eq("review_status", "confirmed");
      if (range) q = q.gte("confirmed_at", `${range.from}T00:00:00Z`).lte("confirmed_at", `${range.to}T23:59:59Z`);
      const { data } = await q.limit(1000);
      const rows = (data ?? []) as any[];
      const total = rows.reduce((acc, r) => acc + num(r.extracted?.total?.value), 0);
      return {
        columns: ["Facturas confirmadas", "Total (suma de montos)"],
        rows: [[rows.length, Number(total.toFixed(2))]],
        summary: `Se facturaron ${Number(total.toFixed(2))} en ${rows.length} factura(s) confirmada(s) en el periodo.`,
      };
    },
  },
  {
    name: "facturas_pending",
    description: "Lista las facturas pendientes de confirmar (review_status 'pending'). Sin params.",
    schema: z.object({}),
    async run(_params, db: Db): Promise<QueryResult> {
      const { count } = await db.from("facturas").select("*", { count: "exact", head: true }).eq("review_status", "pending");
      const { data } = await db.from("facturas").select("created_at, extracted, client:clients(name)")
        .eq("review_status", "pending").order("created_at", { ascending: false }).limit(50);
      const rows = (data ?? []).map((f: any) => [f.created_at?.slice(0, 10) ?? "—", f.client?.name ?? "—", f.extracted?.total?.value || "—"]);
      return { columns: ["Fecha", "Cliente", "Total"], rows, summary: `${count ?? rows.length} factura(s) pendiente(s) de confirmar.` };
    },
  },
  {
    name: "fuel_spend_by_unit",
    description: "Suma el gasto de combustible de una unidad. Params: plate (obligatorio), period (opcional).",
    schema: z.object({ plate: z.string(), period: z.string().optional() }),
    async run(params: { plate: string; period?: string }, db: Db): Promise<QueryResult> {
      const unitId = await resolveUnitId(db, params.plate);
      const range = parsePeriod(params.period);
      let q = db.from("unit_expenses").select("fecha, monto, galones").eq("unit_id", unitId).eq("tipo", "combustible");
      if (range) q = q.gte("fecha", range.from).lte("fecha", range.to);
      const { data } = await q.limit(1000);
      const rows = (data ?? []) as any[];
      const total = rows.reduce((acc, r) => acc + num(r.monto), 0);
      return {
        columns: ["Registros de combustible", "Gasto total"],
        rows: [[rows.length, Number(total.toFixed(2))]],
        summary: `Gasto de combustible: ${Number(total.toFixed(2))} en ${rows.length} carga(s) de combustible.`,
      };
    },
  },
];
