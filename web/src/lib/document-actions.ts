import { apiFetch, ApiError } from "@/lib/api"
import { supabase } from "@/lib/supabase"

export interface FieldCheck { value: string; source: "qr" | "human"; checks: string[] }
export interface ValidationFlag { field: string; reason_code: string; message: string }
export interface DocumentRow {
  id: string
  load_id: string
  doc_type: string
  ruc: string | null
  serie: string | null
  numero: string | null
  fecha: string | null
  extracted: Record<string, FieldCheck>
  validation: { overall: "green" | "amber" | "red"; flags: ValidationFlag[] }
  review_status: "pending" | "confirmed" | "rejected"
}
export interface PipelineResult {
  outcome: "retake" | "duplicate" | "created"
  reason?: string
  document?: DocumentRow
}
export interface DocumentDetail {
  document: DocumentRow
  load: Record<string, unknown>
  photoUrl: string | null
}

const API_URL = import.meta.env.VITE_API_URL ?? ""

export async function uploadGuia(loadId: string, file: File): Promise<PipelineResult> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const form = new FormData()
  form.append("file", file)
  const res = await fetch(`${API_URL}/api/loads/${loadId}/documents`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  const text = await res.text()
  const body = text ? JSON.parse(text) : null
  if (!res.ok) throw new ApiError(res.status, body?.code ?? "UNKNOWN", body?.message ?? "Error al subir.")
  return body as PipelineResult
}

export function fetchDocumentDetail(id: string): Promise<DocumentDetail> {
  return apiFetch(`/api/documents/${id}`)
}
export function confirmDocument(id: string, body: { corrections?: Record<string, string>; peso_kg?: number }) {
  return apiFetch(`/api/documents/${id}/confirm`, { method: "POST", body: JSON.stringify(body) })
}
export function rejectDocument(id: string, reason: string) {
  return apiFetch(`/api/documents/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) })
}
