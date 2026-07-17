import { apiFetch } from "@/lib/api"
import type { UiStatus } from "@/lib/loads"

export interface CreateLoadBody {
  client_id: string
  cargo_description: string
  weight_kg: number
  origin: string
  destination: string
  scheduled_date: string
  price: number
  currency: string
  unit_id: string
  driver_id: string
}

export function createLoad(body: CreateLoadBody): Promise<unknown> {
  return apiFetch("/api/loads", { method: "POST", body: JSON.stringify(body) })
}

export function advanceLoad(
  id: string,
  to: "en_route" | "delivered",
): Promise<unknown> {
  return apiFetch(`/api/loads/${id}/advance`, {
    method: "POST",
    body: JSON.stringify({ to }),
  })
}

export function cancelLoad(id: string, reason: string): Promise<unknown> {
  return apiFetch(`/api/loads/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  })
}

export function remindLoad(id: string): Promise<unknown> {
  return apiFetch(`/api/loads/${id}/remind`, { method: "POST" })
}

export function resendLoad(id: string): Promise<unknown> {
  return apiFetch(`/api/loads/${id}/resend`, { method: "POST" })
}

export function nextAdvance(
  estado: UiStatus,
): { to: "en_route" | "delivered"; label: string } | null {
  if (estado === "confirmado") return { to: "en_route", label: "Marcar en ruta" }
  if (estado === "en_ruta") return { to: "delivered", label: "Marcar entregado" }
  return null
}
