import { apiFetch } from "@/lib/api"

export type ClauseBucket = "reconcile" | "verify" | "attest"

export interface ClauseRow {
  id: string
  client_id: string | null
  title: string
  body: string
  bucket: ClauseBucket
  params: Record<string, unknown>
  source: "human" | "ai"
  active: boolean
}

export interface ClauseInput {
  client_id?: string | null
  title: string
  body: string
  bucket: ClauseBucket
  params?: Record<string, unknown>
  source?: "human" | "ai"
}

export function createClause(input: ClauseInput): Promise<ClauseRow> {
  return apiFetch("/api/clauses", { method: "POST", body: JSON.stringify(input) })
}
export function updateClause(id: string, patch: Partial<ClauseInput>): Promise<ClauseRow> {
  return apiFetch(`/api/clauses/${id}`, { method: "PATCH", body: JSON.stringify(patch) })
}
export function deleteClause(id: string): Promise<ClauseRow> {
  return apiFetch(`/api/clauses/${id}`, { method: "DELETE" })
}

export interface ClauseDraft {
  title: string
  body: string
  bucket: ClauseBucket
  params: Record<string, unknown>
}

export function draftClauses(prose: string): Promise<ClauseDraft[]> {
  return apiFetch("/api/clauses/draft", { method: "POST", body: JSON.stringify({ prose }) })
}
