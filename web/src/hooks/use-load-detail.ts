import { useCallback, useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"
import { toUiStatus, type UiStatus } from "@/lib/loads"

type DbStatus =
  | "unassigned"
  | "sent"
  | "confirmed"
  | "en_route"
  | "delivered"
  | "cancelled"

export interface DetailLoad {
  id: string
  cliente: string
  clienteId: string
  carga: string
  pesoKg: number
  origen: string
  destino: string
  conductor: string
  conductorPhone: string | null
  unidad: string
  precio: string
  fecha: string
  estado: UiStatus
  status: DbStatus
  no_response: boolean
}

export type TimelineItem =
  | {
      id: string
      at: string
      kind: "event"
      source: string
      actor: string
      fromStatus: DbStatus | null
      toStatus: DbStatus | null
      reason: string | null
    }
  | {
      id: string
      at: string
      kind: "message"
      direction: "in" | "out"
      template: string | null
      body: string | null
      status: string | null
      sid: string
      fromPhone: string | null
      toPhone: string | null
    }

const one = <T,>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : v

const RAW =
  "*, client:clients(name), driver:drivers(name, whatsapp_phone), unit:units(plate)"

function toDetail(r: Record<string, unknown>): DetailLoad {
  const client = one(r.client as { name: string } | { name: string }[] | null)
  const driver = one(
    r.driver as
      | { name: string; whatsapp_phone: string }
      | { name: string; whatsapp_phone: string }[]
      | null,
  )
  const unit = one(r.unit as { plate: string } | { plate: string }[] | null)
  const status = r.status as DbStatus
  const currency = r.currency as string
  const price = r.price as number
  return {
    id: r.id as string,
    cliente: client?.name ?? "—",
    clienteId: r.client_id as string,
    carga: r.cargo_description as string,
    pesoKg: r.weight_kg as number,
    origen: r.origin as string,
    destino: r.destination as string,
    conductor: driver?.name ?? "Sin asignar",
    conductorPhone: driver?.whatsapp_phone ?? null,
    unidad: unit?.plate ?? "—",
    precio: `${currency === "PEN" ? "S/" : currency} ${price.toLocaleString("es-PE")}`,
    fecha: r.scheduled_date as string,
    estado: toUiStatus(status, r.no_response as boolean),
    status,
    no_response: r.no_response as boolean,
  }
}

export function useLoadDetail(id: string | undefined): {
  load: DetailLoad | null
  timeline: TimelineItem[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} {
  const [load, setLoad] = useState<DetailLoad | null>(null)
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!id) {
      setError("Carga no encontrada.")
      return
    }
    const [l, e, m] = await Promise.all([
      supabase.from("loads").select(RAW).eq("id", id).single(),
      supabase.from("load_events").select("*").eq("load_id", id),
      supabase.from("messages").select("*").eq("load_id", id),
    ])
    if (l.error) {
      setError(l.error.message)
      return
    }
    setError(null)
    setLoad(toDetail(l.data as Record<string, unknown>))
    const events: TimelineItem[] = (e.data ?? []).map((r) => ({
      id: r.id as string,
      at: r.created_at as string,
      kind: "event",
      source: r.source as string,
      actor: r.actor as string,
      fromStatus: (r.from_status as DbStatus | null) ?? null,
      toStatus: (r.to_status as DbStatus | null) ?? null,
      reason: (r.reason as string | null) ?? null,
    }))
    const msgs: TimelineItem[] = (m.data ?? []).map((r) => ({
      id: r.id as string,
      at: r.created_at as string,
      kind: "message",
      direction: r.direction as "in" | "out",
      template: (r.template_name as string | null) ?? null,
      body: (r.body as string | null) ?? null,
      status: (r.status as string | null) ?? null,
      sid: r.provider_message_sid as string,
      fromPhone: (r.from_phone as string | null) ?? null,
      toPhone: (r.to_phone as string | null) ?? null,
    }))
    setTimeline([...events, ...msgs].sort((a, b) => a.at.localeCompare(b.at)))
  }, [id])

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchAll().finally(() => {
      if (active) setLoading(false)
    })
    if (!id) return
    const channel = supabase
      .channel(`load-detail-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "load_events",
          filter: `load_id=eq.${id}`,
        },
        () => {
          fetchAll()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `load_id=eq.${id}`,
        },
        () => {
          fetchAll()
        },
      )
      .subscribe()
    const poll = setInterval(() => {
      fetchAll()
    }, 10_000)
    return () => {
      active = false
      clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [id, fetchAll])

  return { load, timeline, loading, error, refetch: fetchAll }
}

export function eventTitle(
  item: Extract<TimelineItem, { kind: "event" }>,
): string {
  if (item.fromStatus && item.toStatus && item.fromStatus === item.toStatus) {
    return item.reason ?? "Actualización"
  }
  switch (item.toStatus) {
    case "sent":
      return item.fromStatus && item.fromStatus !== "unassigned"
        ? "Solicitud reenviada"
        : "Carga creada y asignada"
    case "confirmed":
      return "Confirmada por el conductor"
    case "en_route":
      return "Marcada en ruta"
    case "delivered":
      return "Entregada"
    case "cancelled":
      return item.reason ? `Cancelada: ${item.reason}` : "Cancelada"
    case "unassigned":
      return "Reasignada"
    default:
      return item.reason ?? "Evento"
  }
}

export function messageTitle(
  item: Extract<TimelineItem, { kind: "message" }>,
): string {
  return item.direction === "out" ? "Oficina → Conductor" : "Conductor → Oficina"
}
