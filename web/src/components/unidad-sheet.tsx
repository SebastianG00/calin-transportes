import { useState, type FormEvent, type ReactElement } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ApiError } from "@/lib/api"
import { createUnit, updateUnit } from "@/lib/unit-actions"
import type { UnitRow } from "@/hooks/use-units"

export function UnidadSheet({
  mode,
  unit,
  trigger,
  open: openProp,
  onOpenChange,
  onDone,
}: {
  mode: "create" | "edit"
  unit?: UnitRow
  trigger?: ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onDone: () => void
}) {
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = onOpenChange ?? setOpenState
  const [busy, setBusy] = useState(false)
  const [placa, setPlaca] = useState(unit?.placa ?? "")
  const [tipo, setTipo] = useState(unit?.tipo ?? "")
  const [capacidad, setCapacidad] = useState(
    unit?.capacidadKg != null ? String(unit.capacidadKg) : "",
  )
  const [activa, setActiva] = useState(unit?.active ?? true)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const body = {
        plate: placa.trim(),
        tipo: tipo.trim() ? tipo.trim() : null,
        capacity_kg: capacidad.trim() ? Number(capacidad) : null,
        active: activa,
      }
      if (mode === "create") await createUnit(body)
      else await updateUnit(unit!.id, body)
      toast.success(mode === "create" ? "Unidad creada." : "Unidad actualizada.")
      setOpen(false)
      onDone()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar la unidad.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger && <SheetTrigger render={trigger} />}
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? "Nueva unidad" : "Editar unidad"}
          </SheetTitle>
        </SheetHeader>
        <form className="flex flex-col gap-4 p-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="u-placa">Placa</Label>
            <Input
              id="u-placa"
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="u-tipo">Tipo</Label>
            <Input
              id="u-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="Ej. Tracto, Furgón"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="u-cap">Capacidad (kg)</Label>
            <Input
              id="u-cap"
              type="number"
              min="0"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
              placeholder="opcional"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Estado</Label>
            <Select
              value={activa ? "activa" : "inactiva"}
              onValueChange={(v) => setActiva(v === "activa")}
              items={[
                { value: "activa", label: "Activa" },
                { value: "inactiva", label: "Inactiva" },
              ]}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activa">Activa</SelectItem>
                <SelectItem value="inactiva">Inactiva</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={busy}>
              {busy ? "Guardando…" : "Guardar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
