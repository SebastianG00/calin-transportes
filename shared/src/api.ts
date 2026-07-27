import { z } from "zod";

export const CreateLoadInput = z.object({
  client_id: z.string().uuid(),
  cargo_description: z.string().min(1),
  weight_kg: z.number().positive(),
  origin: z.string().min(1),
  destination: z.string().min(1),
  scheduled_date: z.string().min(1),
  price: z.number().nonnegative(),
  currency: z.string().default("PEN"),
  unit_id: z.string().uuid(),
  driver_id: z.string().uuid(),
});
export type CreateLoadInput = z.infer<typeof CreateLoadInput>;

export const ReassignInput = z.object({
  unit_id: z.string().uuid(),
  driver_id: z.string().uuid(),
  reason: z.string().min(1),
});
export type ReassignInput = z.infer<typeof ReassignInput>;

export const AdvanceInput = z.object({ to: z.enum(["en_route", "delivered"]) });
export type AdvanceInput = z.infer<typeof AdvanceInput>;

export const CancelInput = z.object({ reason: z.string().min(1) });
export type CancelInput = z.infer<typeof CancelInput>;

export const DriverInput = z.object({
  name: z.string().min(1),
  whatsapp_phone: z.string().regex(/^\+\d{8,15}$/, "usa formato +51999999999 (sin espacios)"),
  email: z.string().email().nullable().default(null),
  active: z.boolean().default(true),
  dni: z.string().regex(/^\d{8}$/, "DNI: 8 dígitos").nullable().default(null),
  licencia_categoria: z.string().nullable().default(null),
  licencia_vence: z.string().nullable().default(null),
});
export type DriverInput = z.infer<typeof DriverInput>;

export const UnitInput = z.object({
  plate: z.string().min(1),
  capacity_kg: z.number().positive().nullable().default(null),
  tipo: z.string().nullable().default(null),
  active: z.boolean().default(true),
});
export type UnitInput = z.infer<typeof UnitInput>;

export const UnitExpenseInput = z.object({
  fecha: z.string().min(1),
  tipo: z.enum(["combustible", "gasto"]),
  galones: z.number().positive().nullable().default(null),
  monto: z.number().nonnegative(),
  driver_id: z.string().uuid().nullable().default(null),
  nota: z.string().nullable().default(null),
});
export type UnitExpenseInput = z.infer<typeof UnitExpenseInput>;

export const UnitMaintenanceInput = z.object({
  fecha: z.string().min(1),
  tipo: z.enum(["mantenimiento", "lavado"]),
  detalle: z.string().nullable().default(null),
  costo: z.number().nonnegative().nullable().default(null),
});
export type UnitMaintenanceInput = z.infer<typeof UnitMaintenanceInput>;

export const TaskInput = z.object({
  titulo: z.string().min(1),
  categoria: z.enum(["Carga", "Cobro", "Mantenimiento", "Cliente", "Otro"]),
  estado: z.enum(["pendiente", "en_proceso", "hecho"]).default("pendiente"),
  prioridad: z.enum(["critica", "importante", "normal"]).default("normal"),
  fecha_vencimiento: z.string().nullable().default(null),
  load_id: z.string().uuid().nullable().default(null),
  client_id: z.string().uuid().nullable().default(null),
});
export type TaskInput = z.infer<typeof TaskInput>;
