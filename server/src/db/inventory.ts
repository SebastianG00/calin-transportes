import { getServiceClient } from "./client.js";
import { DomainError } from "../domain/errors.js";
import type { InventoryItemInput, InventoryMovementInput } from "@tp/types";

export interface ItemWithStock {
  id: string; nombre: string; categoria: string; unidad_medida: string;
  stock_minimo: number; activo: boolean; stock: number; low: boolean;
}

/** Derived stock: sum(entradas) − sum(salidas) per item. Computed in JS (small scale). */
export async function listItems(): Promise<ItemWithStock[]> {
  const db = getServiceClient();
  const [{ data: items, error: e1 }, { data: moves, error: e2 }] = await Promise.all([
    db.from("inventory_items").select("*").eq("activo", true).order("nombre"),
    db.from("inventory_movements").select("item_id, tipo, cantidad"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const stockBy = new Map<string, number>();
  for (const m of (moves ?? []) as any[]) {
    const d = m.tipo === "entrada" ? Number(m.cantidad) : -Number(m.cantidad);
    stockBy.set(m.item_id, (stockBy.get(m.item_id) ?? 0) + d);
  }
  return (items ?? []).map((it: any) => {
    const stock = stockBy.get(it.id) ?? 0;
    return {
      id: it.id, nombre: it.nombre, categoria: it.categoria, unidad_medida: it.unidad_medida,
      stock_minimo: Number(it.stock_minimo), activo: it.activo,
      stock, low: stock <= Number(it.stock_minimo),
    };
  });
}

export async function createItem(input: InventoryItemInput) {
  const { data, error } = await getServiceClient().from("inventory_items").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateItem(id: string, input: Partial<InventoryItemInput>) {
  const { data, error } = await getServiceClient().from("inventory_items")
    .update({ ...input, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

async function currentStock(itemId: string): Promise<number> {
  const { data, error } = await getServiceClient()
    .from("inventory_movements").select("tipo, cantidad").eq("item_id", itemId);
  if (error) throw error;
  return (data ?? []).reduce((acc: number, m: any) =>
    acc + (m.tipo === "entrada" ? Number(m.cantidad) : -Number(m.cantidad)), 0);
}

export async function recordMovement(itemId: string, input: InventoryMovementInput) {
  if (input.tipo === "salida") {
    const stock = await currentStock(itemId);
    if (stock - input.cantidad < 0) {
      throw new DomainError(400, "INSUFFICIENT_STOCK",
        `No hay stock suficiente: disponible ${stock}, solicitado ${input.cantidad}.`);
    }
  }
  const row = {
    item_id: itemId, tipo: input.tipo, cantidad: input.cantidad,
    unit_id: input.unit_id ?? null, motivo: input.motivo ?? null,
    ...(input.fecha ? { fecha: input.fecha } : {}),
  };
  const { data, error } = await getServiceClient().from("inventory_movements").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function listMovements(itemId: string) {
  const { data, error } = await getServiceClient().from("inventory_movements")
    .select("*, unit:units(plate)").eq("item_id", itemId).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
