import { z } from "zod/v4";
import type { QueryTool, QueryResult, Db } from "../types.js";
import { parsePeriod } from "../dates.js";

const STATUS = ["unassigned", "sent", "confirmed", "en_route", "delivered", "cancelled"] as const;
const LOAD_COLS = "scheduled_date,destination,status,driver:drivers(name),unit:units(plate)";
const loadRow = (l: any) => [l.driver?.name ?? "—", l.unit?.plate ?? "—", l.destination ?? "—", l.status];
const LOAD_HEADERS = ["Chofer", "Placa", "Destino", "Estado"];

export const loadsTools: QueryTool[] = [
  {
    name: "count_loads_by_status",
    description:
      "Cuenta y lista cargas por estado (unassigned, sent, confirmed, en_route, delivered, cancelled). Params: status (opcional, uno de esos valores), period (opcional, p. ej. 'julio', 'este mes', 'esta semana', 'hoy' o 'AAAA-MM').",
    schema: z.object({ status: z.enum(STATUS).optional(), period: z.string().optional() }),
    async run(params: { status?: string; period?: string }, db: Db): Promise<QueryResult> {
      const range = parsePeriod(params.period);
      const applyFilters = (q: any) => {
        if (params.status) q = q.eq("status", params.status);
        if (range) q = q.gte("scheduled_date", range.from).lte("scheduled_date", range.to);
        return q;
      };
      const { count } = await applyFilters(db.from("loads").select("*", { count: "exact", head: true }));
      const { data } = await applyFilters(db.from("loads").select(LOAD_COLS)).limit(50);
      const rows = (data ?? []).map(loadRow);
      const label = params.status ? ` en estado ${params.status}` : "";
      return { columns: LOAD_HEADERS, rows, summary: `${count ?? rows.length} carga(s)${label}.` };
    },
  },
  {
    name: "loads_unconfirmed",
    description: "Lista las cargas enviadas al chofer que aún no han sido confirmadas (estado 'sent'). Sin params.",
    schema: z.object({}),
    async run(_params, db: Db): Promise<QueryResult> {
      const { count } = await db.from("loads").select("*", { count: "exact", head: true }).eq("status", "sent");
      const { data } = await db.from("loads").select(LOAD_COLS).eq("status", "sent").limit(50);
      const rows = (data ?? []).map(loadRow);
      return { columns: LOAD_HEADERS, rows, summary: `${count ?? rows.length} carga(s) sin confirmar.` };
    },
  },
  {
    name: "deliveries_in_period",
    description: "Cuenta y lista las cargas entregadas (estado 'delivered') en un periodo. Params: period (obligatorio, p. ej. 'julio', 'este mes', 'AAAA-MM').",
    schema: z.object({ period: z.string() }),
    async run(params: { period: string }, db: Db): Promise<QueryResult> {
      const range = parsePeriod(params.period);
      const apply = (q: any) => {
        q = q.eq("status", "delivered");
        if (range) q = q.gte("scheduled_date", range.from).lte("scheduled_date", range.to);
        return q;
      };
      const { count } = await apply(db.from("loads").select("*", { count: "exact", head: true }));
      const { data } = await apply(db.from("loads").select(LOAD_COLS)).limit(50);
      const rows = (data ?? []).map(loadRow);
      return { columns: LOAD_HEADERS, rows, summary: `${count ?? rows.length} entrega(s) en el periodo.` };
    },
  },
];
