import { describe, it, expect } from "vitest"
import { loadEvents, taskEvents } from "./calendar-events"

describe("loadEvents", () => {
  it("maps a load to a carga event colored by status, linking to its detail", () => {
    const ev = loadEvents([
      { id: "L1", cliente: "Backus", destino: "Arequipa", estado: "en_ruta", scheduled_date: "2026-08-01" },
    ] as never)
    expect(ev).toHaveLength(1)
    expect(ev[0].id).toBe("carga-L1")
    expect(ev[0].title).toBe("Backus → Arequipa")
    expect(ev[0].color).toBe("purple")     // en_ruta → purple
    expect(ev[0].categoria).toBe("cargas")
    expect(ev[0].href).toBe("/cargas/L1")
  })
  it("skips loads without a scheduled_date", () => {
    expect(loadEvents([{ id: "L2", cliente: "X", destino: "Y", estado: "enviado", scheduled_date: null }] as never)).toHaveLength(0)
  })
})

describe("taskEvents", () => {
  it("maps only tasks that have a fecha_vencimiento, colored by prioridad, linking to /tareas", () => {
    const ev = taskEvents([
      { id: "T1", titulo: "Cobrar", prioridad: "critica", fecha_vencimiento: "2026-08-02" },
      { id: "T2", titulo: "Sin fecha", prioridad: "normal", fecha_vencimiento: null },
    ] as never)
    expect(ev).toHaveLength(1)
    expect(ev[0].id).toBe("tarea-T1")
    expect(ev[0].title).toBe("Cobrar")
    expect(ev[0].color).toBe("pink")       // critica → pink
    expect(ev[0].categoria).toBe("tareas")
    expect(ev[0].href).toBe("/tareas")
  })
})
