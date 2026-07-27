import type { CalendarEvent } from "@/components/ui/full-calendar"

export type CalendarEventWithMeta = CalendarEvent & { categoria: "cargas" | "tareas"; href: string }

type Color = CalendarEvent["color"]
const STATUS_COLOR: Record<string, Color> = {
  confirmado: "green", en_ruta: "purple", sin_respuesta: "pink", enviado: "blue", entregado: "default",
}
const PRIORIDAD_COLOR: Record<string, Color> = {
  critica: "pink", importante: "purple", normal: "blue",
}
const dayRange = (iso: string): { start: Date; end: Date } => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  return { start: new Date(y, m - 1, d, 8, 0), end: new Date(y, m - 1, d, 14, 0) }
}

export function loadEvents(
  loads: Array<{ id: string; cliente: string; destino: string; estado: string; scheduled_date: string | null }>,
): CalendarEventWithMeta[] {
  return loads.filter((l) => l.scheduled_date).map((l) => ({
    id: `carga-${l.id}`, title: `${l.cliente} → ${l.destino}`,
    ...dayRange(l.scheduled_date as string),
    color: STATUS_COLOR[l.estado] ?? "default",
    categoria: "cargas", href: `/cargas/${l.id}`,
  }))
}

export function taskEvents(
  tasks: Array<{ id: string; titulo: string; prioridad: string; fecha_vencimiento: string | null }>,
): CalendarEventWithMeta[] {
  return tasks.filter((t) => t.fecha_vencimiento).map((t) => ({
    id: `tarea-${t.id}`, title: t.titulo,
    ...dayRange(t.fecha_vencimiento as string),
    color: PRIORIDAD_COLOR[t.prioridad] ?? "blue",
    categoria: "tareas", href: "/tareas",
  }))
}
