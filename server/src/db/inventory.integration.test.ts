import { describe, it, expect, beforeEach } from "vitest";
import { getServiceClient } from "./client.js";
import { resetDb, seedUnit } from "../testutils/db.js";
import { createItem, listItems, recordMovement, listMovements } from "./inventory.js";
import { DomainError } from "../domain/errors.js";

const db = getServiceClient();

describe("inventory db", () => {
  beforeEach(async () => { await resetDb(); });

  it("computes stock = entradas − salidas and the low flag", async () => {
    const item = await createItem({ nombre: "Llanta 295/80", categoria: "Llantas", unidad_medida: "unidad", stock_minimo: 4, activo: true } as any);
    await recordMovement((item as any).id, { tipo: "entrada", cantidad: 6, unit_id: null, motivo: null, fecha: null } as any);
    await recordMovement((item as any).id, { tipo: "salida",  cantidad: 2, unit_id: null, motivo: null, fecha: null } as any);
    const rows = await listItems();
    const found = rows.find((r) => r.id === (item as any).id)!;
    expect(found.stock).toBe(4);
    expect(found.low).toBe(true); // 4 <= stock_minimo 4
  });

  it("rejects a salida that would drive stock negative (INSUFFICIENT_STOCK)", async () => {
    const item = await createItem({ nombre: "Aceite", categoria: "Lubricantes", unidad_medida: "litros", stock_minimo: 0, activo: true } as any);
    await recordMovement((item as any).id, { tipo: "entrada", cantidad: 3 } as any);
    await expect(
      recordMovement((item as any).id, { tipo: "salida", cantidad: 5 } as any),
    ).rejects.toBeInstanceOf(DomainError);
    // no movement was written for the rejected salida (still just the 1 entrada)
    const moves = await listMovements((item as any).id);
    expect(moves.length).toBe(1);
  });

  it("stores the optional unit link on a salida", async () => {
    const unitId = await seedUnit();
    const item = await createItem({ nombre: "Filtro", categoria: "Filtros", unidad_medida: "unidad", stock_minimo: 0, activo: true } as any);
    await recordMovement((item as any).id, { tipo: "entrada", cantidad: 5 } as any);
    await recordMovement((item as any).id, { tipo: "salida", cantidad: 1, unit_id: unitId, motivo: "cambio" } as any);
    const moves = await listMovements((item as any).id);
    expect((moves![0] as any).unit_id).toBe(unitId);
  });
});
