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
  email: z.string().nullable(),
  active: z.boolean(),
  dni: z.string().nullable().default(null),
  licencia_categoria: z.string().nullable().default(null),
  licencia_vence: z.string().nullable().default(null),
  created_at: z.string(),
});
export type Driver = z.infer<typeof Driver>;

export const Unit = z.object({
  id: z.string().uuid(),
  plate: z.string(),
  capacity_kg: z.number().nullable(),
  tipo: z.string().nullable(),
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

export const ClauseBucket = z.enum(["reconcile", "verify", "attest"]);
export type ClauseBucket = z.infer<typeof ClauseBucket>;

export const RequirementClause = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid().nullable(),
  title: z.string(),
  body: z.string(),
  bucket: ClauseBucket,
  params: z.record(z.unknown()),
  source: z.enum(["human", "ai"]),
  active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type RequirementClause = z.infer<typeof RequirementClause>;

export const ClauseInput = z.object({
  client_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  bucket: ClauseBucket,
  params: z.record(z.unknown()).optional(),
  source: z.enum(["human", "ai"]).optional(),
  active: z.boolean().optional(),
});
export type ClauseInput = z.infer<typeof ClauseInput>;

export const DocumentTemplate = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid().nullable(),
  kind: z.enum(["guia", "email"]),
  name: z.string(),
  body: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type DocumentTemplate = z.infer<typeof DocumentTemplate>;

export const TemplateInput = z.object({
  client_id: z.string().uuid().nullable().optional(),
  kind: z.enum(["guia", "email"]),
  name: z.string().min(1),
  body: z.string().min(1),
});
export type TemplateInput = z.infer<typeof TemplateInput>;

export const GuiaBuildInput = z.object({
  templateId: z.string().uuid().nullable().optional(),
  clauseIds: z.array(z.string().uuid()).default([]),
  oneOffClauses: z
    .array(z.object({ title: z.string().min(1), body: z.string().min(1), bucket: ClauseBucket }))
    .default([]),
});
export type GuiaBuildInput = z.infer<typeof GuiaBuildInput>;

export const DeliveryGuia = z.object({
  id: z.string().uuid(),
  load_id: z.string().uuid(),
  template_id: z.string().uuid().nullable(),
  clauses: z.array(z.object({ title: z.string(), body: z.string(), bucket: ClauseBucket })),
  data: z.record(z.unknown()),
  status: z.enum(["draft", "approved"]),
  approved_by: z.string().uuid().nullable(),
  approved_at: z.string().nullable(),
  html: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type DeliveryGuia = z.infer<typeof DeliveryGuia>;

export const DeliveryEmail = z.object({
  id: z.string().uuid(),
  load_id: z.string().uuid(),
  template_id: z.string().uuid().nullable(),
  draft_text: z.string(),
  edited_text: z.string().nullable(),
  status: z.enum(["draft", "sent"]),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type DeliveryEmail = z.infer<typeof DeliveryEmail>;

// Editable client fields (Clientes page). RUC stays 11 chars; contact fields optional.
export const ClientInput = z.object({
  name: z.string().min(1),
  ruc: z.string().length(11),
  contact_name: z.string().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  contact_email: z.string().email().nullable().optional(),
});
export type ClientInput = z.infer<typeof ClientInput>;
