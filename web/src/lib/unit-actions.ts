import { apiFetch } from "@/lib/api"

export interface UnitBody {
  plate: string
  tipo: string | null
  capacity_kg: number | null
  active: boolean
}

export function createUnit(body: UnitBody): Promise<unknown> {
  return apiFetch("/api/units", { method: "POST", body: JSON.stringify(body) })
}

export function updateUnit(
  id: string,
  body: Partial<UnitBody>,
): Promise<unknown> {
  return apiFetch(`/api/units/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}
