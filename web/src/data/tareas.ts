export type TareaEstado = "pendiente" | "en_proceso" | "hecho"
export type TareaCategoria =
  | "Carga"
  | "Cobro"
  | "Mantenimiento"
  | "Cliente"
  | "Otro"
export type TareaPrioridad = "critica" | "importante" | "normal"

export interface Tarea {
  id: number
  codigo: string
  titulo: string
  categoria: TareaCategoria
  estado: TareaEstado
  prioridad: TareaPrioridad
}

export const tareas: Tarea[] = [
  {
    id: 1,
    codigo: "TAREA-1001",
    titulo: "Confirmar carga con Backus (Arequipa)",
    categoria: "Carga",
    estado: "en_proceso",
    prioridad: "critica",
  },
  {
    id: 2,
    codigo: "TAREA-1002",
    titulo: "Cobrar a Gloria — factura vencida",
    categoria: "Cobro",
    estado: "pendiente",
    prioridad: "critica",
  },
  {
    id: 3,
    codigo: "TAREA-1003",
    titulo: "Mantenimiento C2D-450 (frenos)",
    categoria: "Mantenimiento",
    estado: "pendiente",
    prioridad: "importante",
  },
  {
    id: 4,
    codigo: "TAREA-1004",
    titulo: "Actualizar contacto de Alicorp",
    categoria: "Cliente",
    estado: "hecho",
    prioridad: "normal",
  },
  {
    id: 5,
    codigo: "TAREA-1005",
    titulo: "Reasignar carga a Pedro Ccopa",
    categoria: "Carga",
    estado: "en_proceso",
    prioridad: "critica",
  },
  {
    id: 6,
    codigo: "TAREA-1006",
    titulo: "Lavado de unidad F3G-914",
    categoria: "Mantenimiento",
    estado: "pendiente",
    prioridad: "normal",
  },
  {
    id: 7,
    codigo: "TAREA-1007",
    titulo: "Enviar guías del lunes al contador",
    categoria: "Otro",
    estado: "hecho",
    prioridad: "importante",
  },
  {
    id: 8,
    codigo: "TAREA-1008",
    titulo: "Renovar SOAT de A4B-812",
    categoria: "Mantenimiento",
    estado: "pendiente",
    prioridad: "importante",
  },
  {
    id: 9,
    codigo: "TAREA-1009",
    titulo: "Confirmar disponibilidad de Rosa Ttito",
    categoria: "Carga",
    estado: "en_proceso",
    prioridad: "normal",
  },
  {
    id: 10,
    codigo: "TAREA-1010",
    titulo: "Seguimiento a Química Suiza (Cusco)",
    categoria: "Cliente",
    estado: "pendiente",
    prioridad: "normal",
  },
]

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
