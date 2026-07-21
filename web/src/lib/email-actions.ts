import { apiFetch } from "@/lib/api"

export interface EmailRow {
  id: string
  load_id: string
  draft_text: string
  edited_text: string | null
  status: "draft" | "sent"
}

export function draftEmail(loadId: string): Promise<EmailRow> {
  return apiFetch(`/api/loads/${loadId}/emails`, { method: "POST" })
}
export function redraftEmail(id: string, revise: string): Promise<EmailRow> {
  return apiFetch(`/api/emails/${id}/redraft`, { method: "POST", body: JSON.stringify({ revise }) })
}
export function saveEmail(id: string, edited_text: string): Promise<EmailRow> {
  return apiFetch(`/api/emails/${id}`, { method: "PATCH", body: JSON.stringify({ edited_text }) })
}
