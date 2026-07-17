export type LoadStatus =
  | "enviado"
  | "confirmado"
  | "sin_respuesta"
  | "en_ruta"
  | "entregado"

export interface Load {
  id: number
  cliente: string
  carga: string
  pesoKg: number
  origen: string
  destino: string
  conductor: string
  unidad: string
  estado: LoadStatus
  confirmacion: string
  precio: string
}

export const loads: Load[] = [
  {
    id: 1,
    cliente: "Gloria",
    carga: "Leche",
    pesoKg: 7200,
    origen: "Lima",
    destino: "Huancayo",
    conductor: "Carlos Huamán",
    unidad: "C2D-450",
    estado: "sin_respuesta",
    confirmacion: "⚠ hace 34 min",
    precio: "S/ 4,100",
  },
  {
    id: 2,
    cliente: "Backus",
    carga: "Cerveza",
    pesoKg: 9000,
    origen: "Lima",
    destino: "Arequipa",
    conductor: "Juan Quispe",
    unidad: "A4B-812",
    estado: "enviado",
    confirmacion: "en 22 min",
    precio: "S/ 3,500",
  },
  {
    id: 3,
    cliente: "Alicorp",
    carga: "Aceite",
    pesoKg: 4500,
    origen: "Callao",
    destino: "Trujillo",
    conductor: "Luis Mamani",
    unidad: "B7C-193",
    estado: "enviado",
    confirmacion: "en 8 min",
    precio: "S/ 2,900",
  },
  {
    id: 4,
    cliente: "Tai Loy",
    carga: "Útiles",
    pesoKg: 3100,
    origen: "Lima",
    destino: "Ica",
    conductor: "Rosa Ttito",
    unidad: "D9E-771",
    estado: "confirmado",
    confirmacion: "14:32",
    precio: "S/ 1,800",
  },
  {
    id: 5,
    cliente: "Química Suiza",
    carga: "Insumos",
    pesoKg: 5000,
    origen: "Callao",
    destino: "Cusco",
    conductor: "Pedro Ccopa",
    unidad: "E1F-208",
    estado: "confirmado",
    confirmacion: "13:10",
    precio: "S/ 5,400",
  },
  {
    id: 6,
    cliente: "Backus",
    carga: "Cerveza",
    pesoKg: 12000,
    origen: "Lima",
    destino: "Piura",
    conductor: "Miguel Apaza",
    unidad: "F3G-914",
    estado: "en_ruta",
    confirmacion: "desde 11:05",
    precio: "S/ 6,200",
  },
  {
    id: 7,
    cliente: "Alicorp",
    carga: "Fideos",
    pesoKg: 6200,
    origen: "Lima",
    destino: "Tacna",
    conductor: "Juan Quispe",
    unidad: "A4B-812",
    estado: "entregado",
    confirmacion: "09:48",
    precio: "S/ 4,700",
  },
  {
    id: 8,
    cliente: "Gloria",
    carga: "Yogurt",
    pesoKg: 4000,
    origen: "Lima",
    destino: "Chincha",
    conductor: "Rosa Ttito",
    unidad: "D9E-771",
    estado: "entregado",
    confirmacion: "08:30",
    precio: "S/ 2,300",
  },
]
