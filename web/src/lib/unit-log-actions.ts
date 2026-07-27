import { apiFetch } from "@/lib/api"

export interface ExpenseBody {
  fecha: string
  tipo: "combustible" | "gasto"
  galones: number | null
  monto: number
  driver_id: string | null
  nota: string | null
}

export interface MaintenanceBody {
  fecha: string
  tipo: "mantenimiento" | "lavado"
  detalle: string | null
  costo: number | null
}

export function createExpense(unitId: string, body: ExpenseBody): Promise<unknown> {
  return apiFetch(`/api/units/${unitId}/expenses`, { method: "POST", body: JSON.stringify(body) })
}

export function createMaintenance(unitId: string, body: MaintenanceBody): Promise<unknown> {
  return apiFetch(`/api/units/${unitId}/maintenance`, { method: "POST", body: JSON.stringify(body) })
}
