import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { DomainError } from "../domain/errors.js";
import { logger } from "../logger.js";

const FIELD_LABELS: Record<string, string> = {
  whatsapp_phone: "WhatsApp",
  email: "Email",
  name: "Nombre",
  weight_kg: "Peso",
  price: "Precio",
  plate: "Placa",
  capacity_kg: "Capacidad",
  tipo: "Tipo",
  cargo_description: "Carga",
  origin: "Origen",
  destination: "Destino",
  scheduled_date: "Fecha",
  client_id: "Cliente",
  driver_id: "Conductor",
  unit_id: "Unidad",
  reason: "Motivo",
};

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof DomainError) return res.status(err.status).json({ code: err.code, message: err.message });
  if (err instanceof ZodError) {
    const message =
      err.issues
        .map((i) => {
          const field = String(i.path[0] ?? "");
          const label = FIELD_LABELS[field] ?? field;
          return label ? `${label}: ${i.message}` : i.message;
        })
        .join("; ") || "Datos inválidos.";
    return res.status(400).json({ code: "VALIDATION", message, issues: err.issues });
  }
  // Postgres/Supabase unique-constraint violation → friendly 409 instead of a 500.
  const code = (err as { code?: string } | null)?.code;
  if (code === "23505") {
    return res.status(409).json({
      code: "DUPLICATE",
      message: "Ya existe un registro con ese dato (teléfono o placa duplicado).",
    });
  }
  logger.error({ err }, "unhandled error");
  return res.status(500).json({ code: "INTERNAL", message: "Error interno." });
}
