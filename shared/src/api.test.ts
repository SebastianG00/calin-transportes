import { describe, it, expect } from "vitest";
import { CreateLoadInput, DriverInput, UnitExpenseInput, UnitMaintenanceInput, TaskInput } from "./api.js";
import { normalizeE164 } from "./provider.js";

describe("UnitExpenseInput", () => {
  it("accepts a fuel entry", () => {
    const r = UnitExpenseInput.safeParse({
      fecha: "2026-07-20", tipo: "combustible", galones: 45, monto: 850,
      driver_id: "33333333-3333-3333-3333-333333333333", nota: "Grifo Primax",
    });
    expect(r.success).toBe(true);
  });
  it("accepts a non-fuel expense without galones/driver", () => {
    const r = UnitExpenseInput.safeParse({ fecha: "2026-07-20", tipo: "gasto", monto: 120 });
    expect(r.success).toBe(true);
    if (r.success) { expect(r.data.galones).toBeNull(); expect(r.data.driver_id).toBeNull(); }
  });
  it("rejects an unknown tipo and a negative monto", () => {
    expect(UnitExpenseInput.safeParse({ fecha: "2026-07-20", tipo: "x", monto: 10 }).success).toBe(false);
    expect(UnitExpenseInput.safeParse({ fecha: "2026-07-20", tipo: "gasto", monto: -5 }).success).toBe(false);
  });
});

describe("UnitMaintenanceInput", () => {
  it("accepts a maintenance entry", () => {
    const r = UnitMaintenanceInput.safeParse({
      fecha: "2026-07-20", tipo: "mantenimiento", detalle: "Cambio de aceite", costo: 300,
    });
    expect(r.success).toBe(true);
  });
  it("rejects an unknown tipo", () => {
    expect(UnitMaintenanceInput.safeParse({ fecha: "2026-07-20", tipo: "otro" }).success).toBe(false);
  });
});

describe("DriverInput profile fields", () => {
  const base = { name: "Luis Gomez", whatsapp_phone: "+51999888777" };

  it("stays valid without the new profile fields (backward compatible)", () => {
    const r = DriverInput.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.dni).toBeNull();
      expect(r.data.licencia_categoria).toBeNull();
      expect(r.data.licencia_vence).toBeNull();
    }
  });

  it("accepts DNI, licencia categoría and vencimiento", () => {
    const r = DriverInput.safeParse({
      ...base, dni: "12345678", licencia_categoria: "A-IIIb", licencia_vence: "2027-05-01",
    });
    expect(r.success).toBe(true);
  });

  it("rejects a DNI that is not 8 digits", () => {
    expect(DriverInput.safeParse({ ...base, dni: "123" }).success).toBe(false);
  });
});

describe("CreateLoadInput", () => {
  it("accepts a valid load", () => {
    const r = CreateLoadInput.safeParse({
      client_id: "11111111-1111-1111-1111-111111111111",
      cargo_description: "Cerveza",
      weight_kg: 9000,
      origin: "Lima",
      destination: "Arequipa",
      scheduled_date: "2026-07-20",
      price: 3500,
      unit_id: "22222222-2222-2222-2222-222222222222",
      driver_id: "33333333-3333-3333-3333-333333333333",
    });
    expect(r.success).toBe(true);
  });
  it("rejects non-positive weight", () => {
    const r = CreateLoadInput.safeParse({
      client_id: "11111111-1111-1111-1111-111111111111",
      cargo_description: "x", weight_kg: 0, origin: "a", destination: "b",
      scheduled_date: "2026-07-20", price: 1,
      unit_id: "22222222-2222-2222-2222-222222222222",
      driver_id: "33333333-3333-3333-3333-333333333333",
    });
    expect(r.success).toBe(false);
  });
});

describe("TaskInput", () => {
  const base = { titulo: "Cobrar a Gloria", categoria: "Cobro" as const };
  it("accepts a task with just título + categoría, defaulting the rest", () => {
    const r = TaskInput.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.estado).toBe("pendiente");
      expect(r.data.prioridad).toBe("normal");
      expect(r.data.fecha_vencimiento).toBeNull();
      expect(r.data.load_id).toBeNull();
      expect(r.data.client_id).toBeNull();
    }
  });
  it("accepts all fields set", () => {
    expect(TaskInput.safeParse({
      ...base, estado: "en_proceso", prioridad: "critica",
      fecha_vencimiento: "2026-08-01",
      load_id: "11111111-1111-1111-1111-111111111111",
      client_id: "22222222-2222-2222-2222-222222222222",
    }).success).toBe(true);
  });
  it("rejects an unknown categoría/estado/prioridad and empty título", () => {
    expect(TaskInput.safeParse({ ...base, categoria: "Nope" }).success).toBe(false);
    expect(TaskInput.safeParse({ ...base, estado: "done" }).success).toBe(false);
    expect(TaskInput.safeParse({ ...base, prioridad: "high" }).success).toBe(false);
    expect(TaskInput.safeParse({ titulo: "", categoria: "Otro" }).success).toBe(false);
  });
});

describe("normalizeE164", () => {
  it("strips the whatsapp: prefix and keeps +digits", () => {
    expect(normalizeE164("whatsapp:+51987654321")).toBe("+51987654321");
    expect(normalizeE164("+51987654321")).toBe("+51987654321");
  });
});
