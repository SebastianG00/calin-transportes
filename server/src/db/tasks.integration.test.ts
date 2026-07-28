import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "../testutils/db.js";
import { createTask, updateTask, deleteTask, listTasks } from "./tasks.js";

describe("tasks db", () => {
  beforeEach(async () => { await resetDb(); });

  it("creates, lists, updates estado, and deletes a task", async () => {
    const created = await createTask({
      titulo: "Cobrar a Gloria", categoria: "Cobro",
      estado: "pendiente", prioridad: "critica",
      fecha_vencimiento: null, load_id: null, client_id: null,
    });
    const id = (created as { id: string }).id;
    expect((created as { estado: string }).estado).toBe("pendiente");

    const afterCreate = await listTasks();
    expect((afterCreate as { id: string }[]).some((t) => t.id === id)).toBe(true);

    const updated = await updateTask(id, { estado: "hecho" });
    expect((updated as { estado: string }).estado).toBe("hecho");

    await deleteTask(id);
    const afterDelete = await listTasks();
    expect((afterDelete as { id: string }[]).some((t) => t.id === id)).toBe(false);
  });
});
