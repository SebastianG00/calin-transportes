export interface Client {
  id: number
  nombre: string
  ruc: string
  contacto: string
}

export const clients: Client[] = [
  { id: 1, nombre: "Backus", ruc: "20100047218", contacto: "Ana Delgado · ana.delgado@backus.pe" },
  { id: 2, nombre: "Alicorp", ruc: "20100128056", contacto: "Jorge Salas · jorge.salas@alicorp.com.pe" },
  { id: 3, nombre: "Gloria", ruc: "20100190797", contacto: "Marisol Vega · marisol.vega@gloria.com.pe" },
  { id: 4, nombre: "Tai Loy", ruc: "20101872715", contacto: "Renzo Cruz · renzo.cruz@tailoy.com.pe" },
  { id: 5, nombre: "Química Suiza", ruc: "20100114409", contacto: "Patricia Rojas · patricia.rojas@qsuiza.com" },
]
