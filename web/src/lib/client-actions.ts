import { apiFetch } from "@/lib/api"

export interface ClientDetail {
  id: string
  name: string
  ruc: string
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
}

export function updateClient(id: string, patch: Partial<Omit<ClientDetail, "id">>): Promise<ClientDetail> {
  return apiFetch(`/api/clients/${id}`, { method: "PATCH", body: JSON.stringify(patch) })
}
