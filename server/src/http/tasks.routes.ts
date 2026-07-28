import { Router } from "express";
import { TaskInput } from "@tp/types";
import { createTask, updateTask, deleteTask } from "../db/tasks.js";

export const tasksRouter = Router();
tasksRouter.post("/tasks", async (req, res, next) => { try { res.status(201).json(await createTask(TaskInput.parse(req.body))); } catch (e) { next(e); } });
tasksRouter.patch("/tasks/:id", async (req, res, next) => { try { res.json(await updateTask(req.params.id, TaskInput.partial().parse(req.body))); } catch (e) { next(e); } });
tasksRouter.delete("/tasks/:id", async (req, res, next) => { try { res.json(await deleteTask(req.params.id)); } catch (e) { next(e); } });
