export type DriverStatus = "activo" | "en_espera" | "inactivo"

export interface Driver {
  id: number
  nombre: string
  email: string
  whatsapp: string
  estado: DriverStatus
  cargas: number
}

export const drivers: Driver[] = [
  {
    id: 1,
    nombre: "Juan Quispe",
    email: "juan.quispe@kalin.pe",
    whatsapp: "+51 987 654 321",
    estado: "activo",
    cargas: 42,
  },
  {
    id: 2,
    nombre: "Luis Mamani",
    email: "luis.mamani@kalin.pe",
    whatsapp: "+51 987 111 222",
    estado: "activo",
    cargas: 38,
  },
  {
    id: 3,
    nombre: "Carlos Huamán",
    email: "carlos.huaman@kalin.pe",
    whatsapp: "+51 987 333 444",
    estado: "en_espera",
    cargas: 27,
  },
  {
    id: 4,
    nombre: "Rosa Ttito",
    email: "rosa.ttito@kalin.pe",
    whatsapp: "+51 987 555 666",
    estado: "activo",
    cargas: 51,
  },
  {
    id: 5,
    nombre: "Pedro Ccopa",
    email: "pedro.ccopa@kalin.pe",
    whatsapp: "+51 987 777 888",
    estado: "activo",
    cargas: 33,
  },
  {
    id: 6,
    nombre: "Miguel Apaza",
    email: "miguel.apaza@kalin.pe",
    whatsapp: "+51 987 999 000",
    estado: "activo",
    cargas: 45,
  },
  {
    id: 7,
    nombre: "Ana Flores",
    email: "ana.flores@kalin.pe",
    whatsapp: "+51 986 222 333",
    estado: "inactivo",
    cargas: 12,
  },
  {
    id: 8,
    nombre: "Jorge Ramos",
    email: "jorge.ramos@kalin.pe",
    whatsapp: "+51 986 444 555",
    estado: "en_espera",
    cargas: 19,
  },
]

export const driverStatusConfig: Record<
  DriverStatus,
  { label: string; className: string }
> = {
  activo: {
    label: "Activo",
    className:
      "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  },
  en_espera: {
    label: "En espera",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  },
  inactivo: {
    label: "Inactivo",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
  },
}

export function driverInitials(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
