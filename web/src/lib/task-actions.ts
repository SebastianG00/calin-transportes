import { apiFetch } from "@/lib/api"
import type { TareaCategoria, TareaEstado, TareaPrioridad } from "@/lib/tareas"

export interface TaskBody {
  titulo: string
  categoria: TareaCategoria
  estado: TareaEstado
  prioridad: TareaPrioridad
  fecha_vencimiento: string | null
  load_id: string | null
  client_id: string | null
}
export function createTask(body: TaskBody): Promise<unknown> {
  return apiFetch("/api/tasks", { method: "POST", body: JSON.stringify(body) })
}
export function updateTask(id: string, body: Partial<TaskBody>): Promise<unknown> {
  return apiFetch(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) })
}
export function deleteTask(id: string): Promise<unknown> {
  return apiFetch(`/api/tasks/${id}`, { method: "DELETE" })
}
