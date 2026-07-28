export const CATEGORIAS = ["Llantas","Lubricantes","Filtros","Repuestos","Otros"] as const
export type Categoria = (typeof CATEGORIAS)[number]
export interface ItemWithStock {
  id: string; nombre: string; categoria: Categoria; unidad_medida: string;
  stock_minimo: number; activo: boolean; stock: number; low: boolean
}
export interface Movement {
  id: string; item_id: string; tipo: "entrada" | "salida"; cantidad: number;
  unit_id: string | null; motivo: string | null; fecha: string; created_at: string;
  unit?: { plate: string } | null
}
