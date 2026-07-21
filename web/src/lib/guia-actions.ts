import { apiFetch } from "@/lib/api"

export interface GuiaRow {
  id: string
  load_id: string
  status: "draft" | "approved"
  html: string
  approved_at: string | null
  created_at: string
}

export interface BuildGuiaInput {
  templateId?: string | null
  clauseIds: string[]
  oneOffClauses: { title: string; body: string; bucket: "reconcile" | "verify" | "attest" }[]
}

export function buildGuia(loadId: string, input: BuildGuiaInput): Promise<GuiaRow> {
  return apiFetch(`/api/loads/${loadId}/guias`, { method: "POST", body: JSON.stringify(input) })
}
export function fetchLoadGuias(loadId: string): Promise<GuiaRow[]> {
  return apiFetch(`/api/loads/${loadId}/guias`)
}
export function fetchGuia(id: string): Promise<GuiaRow> {
  return apiFetch(`/api/guias/${id}`)
}
export function approveGuia(id: string): Promise<GuiaRow> {
  return apiFetch(`/api/guias/${id}/approve`, { method: "POST" })
}
