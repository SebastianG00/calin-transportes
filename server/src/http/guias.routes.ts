import { Router } from "express";
import { GuiaBuildInput } from "@tp/types";
import { buildGuia, approveGuia, listGuiasForLoad, getGuia } from "../services/guiaService.js";

export const guiasRouter = Router();

guiasRouter.post("/loads/:id/guias", async (req, res, next) => {
  try {
    const input = GuiaBuildInput.parse(req.body ?? {});
    res.status(201).json(await buildGuia(req.params.id, input));
  } catch (e) { next(e); }
});
guiasRouter.get("/loads/:id/guias", async (req, res, next) => {
  try { res.json(await listGuiasForLoad(req.params.id)); } catch (e) { next(e); }
});
guiasRouter.get("/guias/:id", async (req, res, next) => {
  try { res.json(await getGuia(req.params.id)); } catch (e) { next(e); }
});
guiasRouter.post("/guias/:id/approve", async (req, res, next) => {
  try { res.json(await approveGuia(req.params.id, req.userId!)); } catch (e) { next(e); }
});
