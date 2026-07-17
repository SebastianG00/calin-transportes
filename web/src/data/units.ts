export type UnitStatus = "activa" | "mantenimiento" | "inactiva"

export type MantEntry = {
  fecha: string
  tipo: "Lavado" | "Mantenimiento" | "Revisión"
  detalle: string
  costo: number
}

export interface Unit {
  id: number
  placa: string
  tipo: string
  capacidadKg: number
  estado: UnitStatus
  cargas: number
  conductor: string
  mantenimiento: MantEntry[]
}

export const units: Unit[] = [
  {
    id: 1,
    placa: "A4B-812",
    tipo: "Tracto",
    capacidadKg: 30000,
    estado: "activa",
    cargas: 42,
    conductor: "Juan Quispe",
    mantenimiento: [
      { fecha: "12 jul 2026", tipo: "Lavado", detalle: "Zona de carga y cabina", costo: 60 },
      { fecha: "05 jul 2026", tipo: "Mantenimiento", detalle: "Cambio de aceite y filtros", costo: 420 },
      { fecha: "28 jun 2026", tipo: "Revisión", detalle: "Frenos y suspensión", costo: 180 },
      { fecha: "10 jun 2026", tipo: "Mantenimiento", detalle: "Cambio de llantas delanteras", costo: 1200 },
    ],
  },
  {
    id: 2,
    placa: "B7C-193",
    tipo: "Furgón",
    capacidadKg: 12000,
    estado: "activa",
    cargas: 38,
    conductor: "Luis Mamani",
    mantenimiento: [
      { fecha: "08 jul 2026", tipo: "Mantenimiento", detalle: "Cambio de aceite y correa", costo: 480 },
      { fecha: "24 jun 2026", tipo: "Lavado", detalle: "Lavado completo exterior", costo: 55 },
      { fecha: "12 jun 2026", tipo: "Revisión", detalle: "Sistema eléctrico y luces", costo: 150 },
    ],
  },
  {
    id: 3,
    placa: "C2D-450",
    tipo: "Tracto",
    capacidadKg: 28000,
    estado: "mantenimiento",
    cargas: 27,
    conductor: "Carlos Huamán",
    mantenimiento: [
      { fecha: "14 jul 2026", tipo: "Mantenimiento", detalle: "Reparación de caja de cambios", costo: 1650 },
      { fecha: "30 jun 2026", tipo: "Revisión", detalle: "Frenos y neumáticos", costo: 210 },
      { fecha: "18 jun 2026", tipo: "Lavado", detalle: "Lavado de motor y chasis", costo: 90 },
      { fecha: "02 jun 2026", tipo: "Mantenimiento", detalle: "Cambio de aceite y filtros", costo: 430 },
    ],
  },
  {
    id: 4,
    placa: "D9E-771",
    tipo: "Furgón",
    capacidadKg: 10000,
    estado: "activa",
    cargas: 51,
    conductor: "Rosa Ttito",
    mantenimiento: [
      { fecha: "02 jul 2026", tipo: "Lavado", detalle: "Lavado completo exterior", costo: 55 },
      { fecha: "21 jun 2026", tipo: "Mantenimiento", detalle: "Cambio de aceite y filtros", costo: 400 },
      { fecha: "05 jun 2026", tipo: "Revisión", detalle: "Frenos y suspensión", costo: 175 },
    ],
  },
  {
    id: 5,
    placa: "E1F-208",
    tipo: "Plataforma",
    capacidadKg: 25000,
    estado: "activa",
    cargas: 33,
    conductor: "Pedro Ccopa",
    mantenimiento: [
      { fecha: "29 jun 2026", tipo: "Revisión", detalle: "Inspección técnica anual", costo: 260 },
      { fecha: "15 jun 2026", tipo: "Lavado", detalle: "Zona de carga y cabina", costo: 60 },
      { fecha: "01 jun 2026", tipo: "Mantenimiento", detalle: "Cambio de aceite y filtros", costo: 410 },
    ],
  },
  {
    id: 6,
    placa: "F3G-914",
    tipo: "Tracto",
    capacidadKg: 32000,
    estado: "activa",
    cargas: 45,
    conductor: "Miguel Apaza",
    mantenimiento: [
      { fecha: "10 jul 2026", tipo: "Lavado", detalle: "Lavado completo exterior", costo: 65 },
      { fecha: "26 jun 2026", tipo: "Mantenimiento", detalle: "Cambio de aceite y filtros", costo: 440 },
      { fecha: "14 jun 2026", tipo: "Revisión", detalle: "Frenos y dirección", costo: 195 },
      { fecha: "31 may 2026", tipo: "Mantenimiento", detalle: "Cambio de llantas traseras", costo: 1100 },
    ],
  },
  {
    id: 7,
    placa: "G5H-620",
    tipo: "Furgón",
    capacidadKg: 9000,
    estado: "inactiva",
    cargas: 12,
    conductor: "—",
    mantenimiento: [
      { fecha: "15 may 2026", tipo: "Mantenimiento", detalle: "Reparación de motor", costo: 2200 },
      { fecha: "28 abr 2026", tipo: "Revisión", detalle: "Diagnóstico general", costo: 240 },
      { fecha: "10 abr 2026", tipo: "Lavado", detalle: "Lavado completo exterior", costo: 55 },
    ],
  },
  {
    id: 8,
    placa: "H8J-431",
    tipo: "Plataforma",
    capacidadKg: 24000,
    estado: "mantenimiento",
    cargas: 19,
    conductor: "—",
    mantenimiento: [
      { fecha: "13 jul 2026", tipo: "Mantenimiento", detalle: "Cambio de embrague", costo: 1450 },
      { fecha: "27 jun 2026", tipo: "Lavado", detalle: "Zona de carga y cabina", costo: 60 },
      { fecha: "13 jun 2026", tipo: "Revisión", detalle: "Frenos y suspensión", costo: 185 },
    ],
  },
]

export const unitStatusConfig: Record<
  UnitStatus,
  { label: string; className: string }
> = {
  activa: {
    label: "Activa",
    className:
      "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  },
  mantenimiento: {
    label: "Mantenimiento",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  },
  inactiva: {
    label: "Inactiva",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
  },
}

export function ultimoMant(u: Unit): MantEntry | undefined {
  return u.mantenimiento[0]
}
