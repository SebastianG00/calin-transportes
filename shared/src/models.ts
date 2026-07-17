import { z } from "zod";
import { LoadStatus } from "./status.js";

export const LoadStatusEnum = z.enum([
  "unassigned", "sent", "confirmed", "en_route", "delivered", "cancelled",
]);

export const Client = z.object({
  id: z.string().uuid(),
  name: z.string(),
  ruc: z.string().length(11),
  contact_name: z.string().nullable(),
  contact_phone: z.string().nullable(),
  active: z.boolean(),
  created_at: z.string(),
});
export type Client = z.infer<typeof Client>;

export const Driver = z.object({
  id: z.string().uuid(),
  name: z.string(),
  whatsapp_phone: z.string(),
  active: z.boolean(),
  created_at: z.string(),
});
export type Driver = z.infer<typeof Driver>;

export const Unit = z.object({
  id: z.string().uuid(),
  plate: z.string(),
  capacity_kg: z.number().nullable(),
  active: z.boolean(),
  created_at: z.string(),
});
export type Unit = z.infer<typeof Unit>;

export const Load = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  cargo_description: z.string(),
  weight_kg: z.number(),
  origin: z.string(),
  destination: z.string(),
  scheduled_date: z.string(),
  price: z.number(),
  currency: z.string(),
  status: LoadStatusEnum,
  no_response: z.boolean(),
  assigned_unit_id: z.string().uuid().nullable(),
  assigned_driver_id: z.string().uuid().nullable(),
  confirm_due_at: z.string().nullable(),
  reminder_sent_at: z.string().nullable(),
  last_reminded_at: z.string().nullable(),
  confirmed_at: z.string().nullable(),
  cancel_reason: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Load = z.infer<typeof Load>;

export const LoadEvent = z.object({
  id: z.string().uuid(),
  load_id: z.string().uuid(),
  from_status: LoadStatusEnum.nullable(),
  to_status: LoadStatusEnum.nullable(),
  source: z.enum(["office", "driver", "timer", "system"]),
  actor: z.string(),
  reason: z.string().nullable(),
  created_at: z.string(),
});
export type LoadEvent = z.infer<typeof LoadEvent>;

export const Message = z.object({
  id: z.string().uuid(),
  provider: z.string(),
  provider_message_sid: z.string(),
  direction: z.enum(["in", "out"]),
  from_phone: z.string().nullable(),
  to_phone: z.string().nullable(),
  driver_id: z.string().uuid().nullable(),
  load_id: z.string().uuid().nullable(),
  template_name: z.string().nullable(),
  body: z.string().nullable(),
  media_url: z.string().nullable(),
  media_storage_path: z.string().nullable(),
  status: z.string().nullable(),
  processed: z.boolean(),
  created_at: z.string(),
});
export type Message = z.infer<typeof Message>;
