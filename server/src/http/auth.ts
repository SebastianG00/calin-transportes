import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

declare global { namespace Express { interface Request { userId?: string } } }

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === "test") { req.userId = req.header("x-test-user") ?? "test-user"; return next(); }
  const token = req.header("authorization")?.replace(/^Bearer /i, "");
  if (!token) return res.status(401).json({ code: "NO_AUTH", message: "Falta autenticación." });
  const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ code: "BAD_AUTH", message: "Sesión inválida." });
  req.userId = data.user.id; next();
}
