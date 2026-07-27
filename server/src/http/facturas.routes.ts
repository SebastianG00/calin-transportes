import { Router } from "express";
import multer from "multer";
import * as svc from "../services/facturaService.js";

export const facturasRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

facturasRouter.post("/facturas", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ code: "NO_FILE", message: "Falta la imagen." });
    res.status(201).json(await svc.uploadFactura(req.file.buffer, req.file.mimetype));
  } catch (e) { next(e); }
});

facturasRouter.get("/facturas", async (req, res, next) => {
  try { res.json(await svc.listFacturas((req.query.status as string) || undefined)); } catch (e) { next(e); }
});

// NOTE: /facturas/export MUST be declared before /facturas/:id
facturasRouter.get("/facturas/export", async (req, res, next) => {
  try {
    const month = (req.query.month as string) ?? new Date().toISOString().slice(0, 7);
    const csv = await svc.exportFacturasCsv(month);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="facturas-${month}.csv"`);
    res.send(csv);
  } catch (e) { next(e); }
});

facturasRouter.get("/facturas/:id", async (req, res, next) => {
  try { res.json(await svc.getFacturaDetail(req.params.id)); } catch (e) { next(e); }
});

facturasRouter.post("/facturas/:id/extract", async (req, res, next) => {
  try { res.json(await svc.extractFacturaDoc(req.params.id)); } catch (e) { next(e); }
});

facturasRouter.post("/facturas/:id/confirm", async (req, res, next) => {
  try {
    res.json(await svc.confirmFactura(req.params.id, {
      corrections: req.body?.corrections, client_id: req.body?.client_id,
    }, req.userId!));
  } catch (e) { next(e); }
});

facturasRouter.post("/facturas/:id/reject", async (req, res, next) => {
  try { res.json(await svc.rejectFactura(req.params.id, req.userId!)); } catch (e) { next(e); }
});
