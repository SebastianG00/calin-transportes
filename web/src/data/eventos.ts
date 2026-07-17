import type { CalendarEvent } from "@/components/ui/full-calendar"
import { type LoadStatus, loads } from "@/data/loads"

export type EventoCategoria = "cargas" | "oficina" | "personal"

export type Evento = CalendarEvent & {
  categoria: EventoCategoria
}

const statusColor: Record<LoadStatus, CalendarEvent["color"]> = {
  confirmado: "green",
  en_ruta: "purple",
  sin_respuesta: "pink",
  enviado: "blue",
  entregado: "default",
}

// Distinct July 2026 dates for the ~8 cargas (today is 2026-07-16).
const cargaDays = [3, 7, 10, 14, 16, 21, 24, 28]

const cargaEventos: Evento[] = loads.map((load, i) => {
  const day = cargaDays[i % cargaDays.length]
  return {
    id: `carga-${load.id}`,
    title: `${load.cliente} → ${load.destino}`,
    start: new Date(2026, 6, day, 8, 0),
    end: new Date(2026, 6, day, 14, 0),
    color: statusColor[load.estado],
    categoria: "cargas",
  }
})

const oficinaEventos: Evento[] = [
  {
    id: "oficina-1",
    title: "Pago a conductores",
    start: new Date(2026, 6, 15, 9, 0),
    end: new Date(2026, 6, 15, 11, 0),
    color: "purple",
    categoria: "oficina",
  },
  {
    id: "oficina-2",
    title: "Reunión con Alicorp",
    start: new Date(2026, 6, 18, 15, 0),
    end: new Date(2026, 6, 18, 16, 30),
    color: "purple",
    categoria: "oficina",
  },
  {
    id: "oficina-3",
    title: "Cierre contable",
    start: new Date(2026, 6, 30, 16, 0),
    end: new Date(2026, 6, 30, 18, 0),
    color: "purple",
    categoria: "oficina",
  },
]

const personalEventos: Evento[] = [
  {
    id: "personal-1",
    title: "Feriado — Fiestas Patrias",
    start: new Date(2026, 6, 28, 0, 0),
    end: new Date(2026, 6, 29, 23, 59),
    color: "blue",
    categoria: "personal",
  },
]

export const eventos: Evento[] = [
  ...cargaEventos,
  ...oficinaEventos,
  ...personalEventos,
]
