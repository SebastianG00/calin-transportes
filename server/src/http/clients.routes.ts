import { Router } from "express";
import { ClientInput } from "@tp/types";
import { listClients, getClient, updateClient } from "../db/clients.js";

export const clientsRouter = Router();

clientsRouter.get("/clients", async (_req, res, next) => {
  try { res.json(await listClients()); } catch (e) { next(e); }
});
clientsRouter.get("/clients/:id", async (req, res, next) => {
  try { res.json(await getClient(req.params.id)); } catch (e) { next(e); }
});
clientsRouter.patch("/clients/:id", async (req, res, next) => {
  try { res.json(await updateClient(req.params.id, ClientInput.partial().parse(req.body))); } catch (e) { next(e); }
});
