export type TareaEstado = "pendiente" | "en_proceso" | "hecho"
export type TareaCategoria =
  | "Carga"
  | "Cobro"
  | "Mantenimiento"
  | "Cliente"
  | "Otro"
export type TareaPrioridad = "critica" | "importante" | "normal"

export interface Tarea {
  id: string
  titulo: string
  categoria: TareaCategoria
  estado: TareaEstado
  prioridad: TareaPrioridad
  fecha_vencimiento: string | null
  load_id: string | null
  client_id: string | null
}

export const estadoConfig: Record<TareaEstado, { label: string }> = {
  pendiente: { label: "Pendiente" },
  en_proceso: { label: "En proceso" },
  hecho: { label: "Hecho" },
}

export const prioridadConfig: Record<
  TareaPrioridad,
  { label: string; className: string }
> = {
  critica: {
    label: "Crítica",
    className:
      "border-red-300 text-red-600 dark:border-red-500/40 dark:text-red-300",
  },
  importante: {
    label: "Importante",
    className:
      "border-amber-300 text-amber-700 dark:border-amber-500/40 dark:text-amber-300",
  },
  normal: {
    label: "Normal",
    className:
      "border-blue-300 text-blue-600 dark:border-blue-500/40 dark:text-blue-300",
  },
}
