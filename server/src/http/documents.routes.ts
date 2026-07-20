import { Router } from "express";
import multer from "multer";
import { getServiceClient } from "../db/client.js";
import * as svc from "../services/documentService.js";

export const documentsRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

documentsRouter.post("/loads/:id/documents", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ code: "NO_FILE", message: "Falta la imagen." });
    const result = await svc.uploadGuia(req.params.id, req.file.buffer, req.file.mimetype);
    res.status(201).json(result);
  } catch (e) { next(e); }
});

documentsRouter.get("/documents", async (req, res, next) => {
  try {
    const status = (req.query.status as string) ?? "pending";
    const { data, error } = await getServiceClient()
      .from("load_documents")
      .select("*, load:loads(cargo_description, destination, client:clients(name))")
      .eq("review_status", status)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (e) { next(e); }
});

documentsRouter.get("/documents/:id", async (req, res, next) => {
  try { res.json(await svc.getDocumentDetail(req.params.id)); } catch (e) { next(e); }
});

documentsRouter.post("/documents/:id/confirm", async (req, res, next) => {
  try {
    res.json(await svc.confirmDocument(req.params.id, {
      corrections: req.body?.corrections, peso_kg: req.body?.peso_kg,
    }, req.userId!));
  } catch (e) { next(e); }
});

documentsRouter.post("/documents/:id/reject", async (req, res, next) => {
  try { res.json(await svc.rejectDocument(req.params.id, req.body?.reason ?? "", req.userId!)); } catch (e) { next(e); }
});
