import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { DomainError } from "../domain/errors.js";
import { logger } from "../logger.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof DomainError) return res.status(err.status).json({ code: err.code, message: err.message });
  if (err instanceof ZodError) return res.status(400).json({ code: "VALIDATION", message: "Datos inválidos.", issues: err.issues });
  logger.error({ err }, "unhandled error");
  return res.status(500).json({ code: "INTERNAL", message: "Error interno." });
}
