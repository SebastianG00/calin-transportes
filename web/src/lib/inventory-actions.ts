import { apiFetch } from "@/lib/api"
import type { ItemWithStock, Movement } from "@/lib/inventory"

export function listItems(): Promise<ItemWithStock[]> { return apiFetch("/api/inventory/items") }
export function createItem(body: Record<string, unknown>): Promise<unknown> {
  return apiFetch("/api/inventory/items", { method: "POST", body: JSON.stringify(body) })
}
export function updateItem(id: string, body: Record<string, unknown>): Promise<unknown> {
  return apiFetch(`/api/inventory/items/${id}`, { method: "PATCH", body: JSON.stringify(body) })
}
export function listMovements(id: string): Promise<Movement[]> {
  return apiFetch(`/api/inventory/items/${id}/movements`)
}
export function recordMovement(id: string, body: Record<string, unknown>): Promise<unknown> {
  return apiFetch(`/api/inventory/items/${id}/movements`, { method: "POST", body: JSON.stringify(body) })
}
