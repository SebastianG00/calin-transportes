import { Router } from "express";
import { InventoryItemInput, InventoryMovementInput } from "@tp/types";
import { listItems, createItem, updateItem, recordMovement, listMovements } from "../db/inventory.js";

export const inventoryRouter = Router();

inventoryRouter.get("/inventory/items", async (_req, res, next) => {
  try { res.json(await listItems()); } catch (e) { next(e); }
});
inventoryRouter.post("/inventory/items", async (req, res, next) => {
  try { res.status(201).json(await createItem(InventoryItemInput.parse(req.body))); } catch (e) { next(e); }
});
inventoryRouter.patch("/inventory/items/:id", async (req, res, next) => {
  try { res.json(await updateItem(req.params.id, InventoryItemInput.partial().parse(req.body))); } catch (e) { next(e); }
});
inventoryRouter.get("/inventory/items/:id/movements", async (req, res, next) => {
  try { res.json(await listMovements(req.params.id)); } catch (e) { next(e); }
});
inventoryRouter.post("/inventory/items/:id/movements", async (req, res, next) => {
  try { res.status(201).json(await recordMovement(req.params.id, InventoryMovementInput.parse(req.body))); } catch (e) { next(e); }
});
