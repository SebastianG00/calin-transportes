import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export type UiStatus =
  | "sin_asignar"
  | "enviado"
  | "sin_respuesta"
  | "confirmado"
  | "en_ruta"
  | "entregado"
  | "cancelado"

/** Row shape returned by the Supabase select (with embedded names). */
export interface LoadRow {
  id: string
  cargo_description: string
  weight_kg: number
  origin: string
  destination: string
  price: number
  currency: string
  status:
    | "unassigned"
    | "sent"
    | "confirmed"
    | "en_route"
    | "delivered"
    | "cancelled"
  no_response: boolean
  confirm_due_at: string | null
  confirmed_at: string | null
  updated_at: string
  created_at: string
  client: { name: string } | null
  driver: { name: string } | null
  unit: { plate: string } | null
}

/** Shape the board table/cards consume. */
export interface BoardLoad {
  id: string
  cliente: string
  carga: string
  pesoKg: number
  origen: string
  destino: string
  conductor: string
  unidad: string
  estado: UiStatus
  confirmacion: string
  precio: string
}

export interface BoardMetrics {
  activas: number
  sinRespuesta: number
  entregadasHoy: number
  tasaConfirmacion: string
}

export function toUiStatus(
  status: LoadRow["status"],
  noResponse: boolean,
): UiStatus {
  switch (status) {
    case "unassigned":
      return "sin_asignar"
    case "sent":
      return noResponse ? "sin_respuesta" : "enviado"
    case "confirmed":
      return "confirmado"
    case "en_route":
      return "en_ruta"
    case "delivered":
      return "entregado"
    case "cancelled":
      return "cancelado"
  }
}

function confirmacionText(row: LoadRow): string {
  const ui = toUiStatus(row.status, row.no_response)
  if (ui === "confirmado" && row.confirmed_at) {
    return format(new Date(row.confirmed_at), "HH:mm")
  }
  if (ui === "sin_respuesta") return "⚠ sin respuesta"
  if (ui === "enviado" && row.confirm_due_at) {
    return `vence ${formatDistanceToNow(new Date(row.confirm_due_at), {
      locale: es,
      addSuffix: true,
    })}`
  }
  return "—"
}

export function toBoardLoad(row: LoadRow): BoardLoad {
  return {
    id: row.id,
    cliente: row.client?.name ?? "—",
    carga: row.cargo_description,
    pesoKg: row.weight_kg,
    origen: row.origin,
    destino: row.destination,
    conductor: row.driver?.name ?? "Sin asignar",
    unidad: row.unit?.plate ?? "—",
    estado: toUiStatus(row.status, row.no_response),
    confirmacion: confirmacionText(row),
    precio: `${row.currency === "PEN" ? "S/" : row.currency} ${row.price.toLocaleString("es-PE")}`,
  }
}

export function computeMetrics(rows: LoadRow[]): BoardMetrics {
  const activas = rows.filter((r) =>
    ["sent", "confirmed", "en_route"].includes(r.status),
  ).length
  const sinRespuesta = rows.filter(
    (r) => r.status === "sent" && r.no_response,
  ).length
  const today = new Date().toDateString()
  const entregadasHoy = rows.filter(
    (r) =>
      r.status === "delivered" &&
      new Date(r.updated_at).toDateString() === today,
  ).length
  const sentish = rows.filter((r) =>
    ["sent", "confirmed", "en_route", "delivered"].includes(r.status),
  ).length
  const reached = rows.filter((r) =>
    ["confirmed", "en_route", "delivered"].includes(r.status),
  ).length
  const tasaConfirmacion =
    sentish === 0 ? "—" : `${Math.round((reached / sentish) * 100)}%`
  return { activas, sinRespuesta, entregadasHoy, tasaConfirmacion }
}
