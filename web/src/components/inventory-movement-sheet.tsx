import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter,
} from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { recordMovement } from "@/lib/inventory-actions"
import { useUnits } from "@/hooks/use-units"

export function InventoryMovementSheet({
  itemId, itemNombre, tipo, onDone, trigger,
}: {
  itemId: string; itemNombre: string; tipo: "entrada" | "salida"; onDone: () => void; trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [cantidad, setCantidad] = useState("1")
  const [motivo, setMotivo] = useState("")
  const [unitId, setUnitId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { units } = useUnits()
  const unitItems = [{ value: "", label: "— Sin unidad —" }, ...units.map((u) => ({ value: u.id, label: u.placa }))]

  async function onSave() {
    const n = Number(cantidad)
    if (!(n > 0)) { toast.error("Cantidad debe ser mayor que 0."); return }
    setBusy(true)
    try {
      await recordMovement(itemId, {
        tipo, cantidad: n,
        unit_id: tipo === "salida" && unitId ? unitId : null,
        motivo: motivo.trim() || null,
      })
      toast.success(tipo === "entrada" ? "Entrada registrada" : "Salida registrada")
      setOpen(false); setCantidad("1"); setMotivo(""); setUnitId(null); onDone()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo registrar.")
    } finally { setBusy(false) }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{tipo === "entrada" ? "Entrada" : "Salida"} — {itemNombre}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <Label>Cantidad</Label>
            <Input type="number" min="0" step="any" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          </div>
          {tipo === "salida" ? (
            <div className="flex flex-col gap-1.5">
              <Label>Unidad (opcional)</Label>
              <Select value={unitId ?? ""} onValueChange={(v) => setUnitId(v || null)} items={unitItems}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{unitItems.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label>Motivo (opcional)</Label>
            <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="compra / cambio por desgaste…" />
          </div>
        </div>
        <SheetFooter>
          <Button onClick={onSave} disabled={busy}>{busy ? "Guardando…" : "Registrar"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
