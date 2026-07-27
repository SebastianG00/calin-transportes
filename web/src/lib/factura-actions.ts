import { apiFetch, ApiError } from "@/lib/api"
import { supabase } from "@/lib/supabase"

const API_URL = import.meta.env.VITE_API_URL ?? ""

export interface FacturaField {
  value: string
  verbatim?: string
  source: "vlm" | "human"
  bbox?: [number, number, number, number] | null
}
export interface EnrichedFactura {
  factura: Record<string, unknown>
  photoUrl: string | null
}

export async function uploadFactura(file: File): Promise<{ id: string }> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const form = new FormData()
  form.append("file", file)
  const res = await fetch(`${API_URL}/api/facturas`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  const text = await res.text()
  const body = text ? JSON.parse(text) : null
  if (!res.ok) throw new ApiError(res.status, body?.code ?? "UNKNOWN", body?.message ?? "Error al subir.")
  return body as { id: string }
}

export function extractFactura(id: string): Promise<EnrichedFactura> {
  return apiFetch(`/api/facturas/${id}/extract`, { method: "POST" })
}

export function confirmFactura(
  id: string,
  body: { corrections?: Record<string, string>; client_id?: string | null },
) {
  return apiFetch(`/api/facturas/${id}/confirm`, { method: "POST", body: JSON.stringify(body) })
}

export function rejectFactura(id: string) {
  return apiFetch(`/api/facturas/${id}/reject`, { method: "POST", body: JSON.stringify({}) })
}

export async function exportFacturas(month: string): Promise<void> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const res = await fetch(`${API_URL}/api/facturas/export?month=${month}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    const text = await res.text()
    const body = text ? JSON.parse(text) : null
    throw new ApiError(res.status, body?.code ?? "UNKNOWN", body?.message ?? "Error al exportar.")
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `facturas-${month}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
