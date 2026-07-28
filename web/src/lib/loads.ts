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
  scheduled_date: string
  confirm_due_at: string | null
  confirmed_at: string | null
  updated_at: string
  created_at: string
  client: { name: string } | null
  driver: { name: string } | null
  unit: { plate: string } | null
  documents: DocRow[] | null
}

/** Embedded delivery-document rows used to derive the Entrega chip. */
export interface DocRow {
  review_status: "pending" | "confirmed" | "rejected"
  validation: { overall?: string } | null
  confirmed_at: string | null
  created_at: string
}

export type EntregaTone = "muted" | "slate" | "green" | "amber" | "red" | "emerald"

/** Compact delivery-document indicator shown on the board. */
export interface EntregaChip {
  label: string
  tone: EntregaTone
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
  entrega: EntregaChip
  precio: string
  scheduled_date: string
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
  if (ui === "sin_respuesta") return "⚠ sin respuesta"
  if (ui === "enviado" && row.confirm_due_at) {
    return `vence ${formatDistanceToNow(new Date(row.confirm_due_at), {
      locale: es,
      addSuffix: true,
    })}`
  }
  // confirmed_at persists across confirmado → en_ruta → entregado, so the
  // driver-confirmation timestamp doesn't vanish once the load progresses.
  if (row.confirmed_at && ["confirmado", "en_ruta", "entregado"].includes(ui)) {
    return format(new Date(row.confirmed_at), "d MMM, HH:mm", { locale: es })
  }
  return "—"
}

/** Latest pending doc if any; otherwise the latest doc overall. */
function relevantDoc(docs: DocRow[] | null): DocRow | null {
  if (!docs || docs.length === 0) return null
  const pending = docs.filter((d) => d.review_status === "pending")
  const pool = pending.length > 0 ? pending : docs
  return [...pool].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  )[0]
}

/** Derive the board's Entrega chip from a load's delivery documents. */
export function entregaChip(docs: LoadRow["documents"]): EntregaChip {
  const doc = relevantDoc(docs)
  if (!doc) return { label: "—", tone: "muted" }
  if (doc.review_status === "confirmed") {
    const date = doc.confirmed_at
      ? format(new Date(doc.confirmed_at), "d MMM", { locale: es })
      : ""
    return { label: date ? `Confirmado · ${date}` : "Confirmado", tone: "emerald" }
  }
  if (doc.review_status === "rejected") return { label: "Rechazado", tone: "red" }
  // pending
  const overall = doc.validation?.overall
  if (overall === "green") return { label: "Revisión", tone: "green" }
  if (overall === "amber") return { label: "Revisión", tone: "amber" }
  if (overall === "red") return { label: "Revisión", tone: "red" }
  return { label: "Sin revisar", tone: "slate" }
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
    entrega: entregaChip(row.documents),
    precio: `${row.currency === "PEN" ? "S/" : row.currency} ${row.price.toLocaleString("es-PE")}`,
    scheduled_date: row.scheduled_date,
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
