import { Router } from "express";
import { DriverInput, UnitInput } from "@tp/types";
import { listDrivers, createDriver, updateDriver } from "../db/drivers.js";
import { listUnits, createUnit, updateUnit } from "../db/units.js";

export const masterDataRouter = Router();
masterDataRouter.get("/drivers", async (_req, res, next) => { try { res.json(await listDrivers()); } catch (e) { next(e); } });
masterDataRouter.post("/drivers", async (req, res, next) => { try { res.status(201).json(await createDriver(DriverInput.parse(req.body))); } catch (e) { next(e); } });
masterDataRouter.patch("/drivers/:id", async (req, res, next) => { try { res.json(await updateDriver(req.params.id, DriverInput.partial().parse(req.body))); } catch (e) { next(e); } });
masterDataRouter.get("/units", async (_req, res, next) => { try { res.json(await listUnits()); } catch (e) { next(e); } });
masterDataRouter.post("/units", async (req, res, next) => { try { res.status(201).json(await createUnit(UnitInput.parse(req.body))); } catch (e) { next(e); } });
masterDataRouter.patch("/units/:id", async (req, res, next) => { try { res.json(await updateUnit(req.params.id, UnitInput.partial().parse(req.body))); } catch (e) { next(e); } });
