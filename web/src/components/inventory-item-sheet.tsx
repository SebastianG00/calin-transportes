import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter,
} from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createItem } from "@/lib/inventory-actions"
import { CATEGORIAS, type Categoria } from "@/lib/inventory"

const catItems = CATEGORIAS.map((c) => ({ value: c, label: c }))

export function InventoryItemSheet({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState("")
  const [categoria, setCategoria] = useState<Categoria>("Llantas")
  const [unidad, setUnidad] = useState("")
  const [minimo, setMinimo] = useState("0")
  const [busy, setBusy] = useState(false)

  async function onSave() {
    if (!nombre.trim()) { toast.error("Ingresa un nombre."); return }
    setBusy(true)
    try {
      await createItem({ nombre, categoria, unidad_medida: unidad.trim() || "unidad", stock_minimo: Number(minimo) || 0 })
      toast.success("Ítem creado")
      setOpen(false); setNombre(""); setCategoria("Llantas"); setUnidad(""); setMinimo("0"); onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar.")
    } finally { setBusy(false) }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button>Nuevo ítem</Button>} />
      <SheetContent>
        <SheetHeader><SheetTitle>Nuevo ítem</SheetTitle></SheetHeader>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <Label>Nombre</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Llanta 295/80" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Categoría</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria((v ?? "Llantas") as Categoria)} items={catItems}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{catItems.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Unidad de medida</Label>
            <Input value={unidad} onChange={(e) => setUnidad(e.target.value)} placeholder="unidad / litros / juego" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Stock mínimo</Label>
            <Input type="number" min="0" value={minimo} onChange={(e) => setMinimo(e.target.value)} />
          </div>
        </div>
        <SheetFooter>
          <Button onClick={onSave} disabled={busy}>{busy ? "Guardando…" : "Guardar"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
