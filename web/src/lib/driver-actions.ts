import { apiFetch } from "@/lib/api"

export interface DriverBody {
  name: string
  email: string | null
  whatsapp_phone: string
  active: boolean
  dni: string | null
  licencia_categoria: string | null
  licencia_vence: string | null
}

export function createDriver(body: DriverBody): Promise<unknown> {
  return apiFetch("/api/drivers", { method: "POST", body: JSON.stringify(body) })
}

export function updateDriver(
  id: string,
  body: Partial<DriverBody>,
): Promise<unknown> {
  return apiFetch(`/api/drivers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}
