import { apiFetch } from "@/lib/api"

export type QueryRow = (string | number | null)[]
export interface AssistantAnswer {
  answer: string
  table: { columns: string[]; rows: QueryRow[] } | null
  tool: string | null
}

export function askAssistant(question: string): Promise<AssistantAnswer> {
  return apiFetch(`/api/assistant/ask`, { method: "POST", body: JSON.stringify({ question }) })
}
