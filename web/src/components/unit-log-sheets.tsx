import { useState, type FormEvent } from "react"
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
} from "@/components/ui/sheet"
import { ApiError } from "@/lib/api"
import { createExpense, createMaintenance } from "@/lib/unit-log-actions"
import { useDrivers } from "@/hooks/use-drivers"

const today = () => new Date().toISOString().slice(0, 10)

function Field({ id, label, children }: { id?: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

export function GastoSheet({
  unitId, open, onOpenChange, onDone,
}: { unitId: string; open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const { drivers } = useDrivers()
  const [busy, setBusy] = useState(false)
  const [tipo, setTipo] = useState<"combustible" | "gasto">("combustible")
  const [fecha, setFecha] = useState(today())
  const [galones, setGalones] = useState("")
  const [monto, setMonto] = useState("")
  const [driverId, setDriverId] = useState("none")
  const [nota, setNota] = useState("")

  const driverItems = [{ value: "none", label: "— Sin conductor —" }, ...drivers.map((d) => ({ value: d.id, label: d.nombre }))]

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await createExpense(unitId, {
        fecha,
        tipo,
        galones: tipo === "combustible" && galones ? Number(galones) : null,
        monto: Number(monto),
        driver_id: driverId === "none" ? null : driverId,
        nota: nota.trim() ? nota.trim() : null,
      })
      toast.success("Registro guardado.")
      onOpenChange(false)
      setGalones(""); setMonto(""); setNota("")
      onDone()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el registro.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>Registrar combustible / gasto</SheetTitle></SheetHeader>
        <form className="flex flex-col gap-4 p-4" onSubmit={handleSubmit}>
          <Field label="Tipo">
            <Select value={tipo} onValueChange={(v) => setTipo(v as "combustible" | "gasto")}
              items={[{ value: "combustible", label: "Combustible" }, { value: "gasto", label: "Gasto" }]}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="combustible">Combustible</SelectItem>
                <SelectItem value="gasto">Gasto</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field id="g-fecha" label="Fecha">
            <Input id="g-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </Field>
          {tipo === "combustible" && (
            <Field id="g-gal" label="Galones">
              <Input id="g-gal" type="number" step="0.1" min="0" value={galones} onChange={(e) => setGalones(e.target.value)} placeholder="opcional" />
            </Field>
          )}
          <Field id="g-monto" label="Monto (S/)">
            <Input id="g-monto" type="number" step="0.01" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} required />
          </Field>
          <Field label="Conductor">
            <Select value={driverId} onValueChange={(v) => setDriverId(v ?? "none")} items={driverItems}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {driverItems.map((it) => <SelectItem key={it.value} value={it.value}>{it.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field id="g-nota" label="Nota">
            <Input id="g-nota" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="p. ej. Grifo Primax (opcional)" />
          </Field>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export function MantenimientoSheet({
  unitId, open, onOpenChange, onDone,
}: { unitId: string; open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const [tipo, setTipo] = useState<"mantenimiento" | "lavado">("mantenimiento")
  const [fecha, setFecha] = useState(today())
  const [detalle, setDetalle] = useState("")
  const [costo, setCosto] = useState("")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await createMaintenance(unitId, {
        fecha,
        tipo,
        detalle: detalle.trim() ? detalle.trim() : null,
        costo: costo ? Number(costo) : null,
      })
      toast.success("Registro guardado.")
      onOpenChange(false)
      setDetalle(""); setCosto("")
      onDone()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el registro.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>Registrar mantenimiento / lavado</SheetTitle></SheetHeader>
        <form className="flex flex-col gap-4 p-4" onSubmit={handleSubmit}>
          <Field label="Tipo">
            <Select value={tipo} onValueChange={(v) => setTipo(v as "mantenimiento" | "lavado")}
              items={[{ value: "mantenimiento", label: "Mantenimiento" }, { value: "lavado", label: "Lavado" }]}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="lavado">Lavado</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field id="m-fecha" label="Fecha">
            <Input id="m-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </Field>
          <Field id="m-det" label="Detalle">
            <Input id="m-det" value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="p. ej. Cambio de aceite" />
          </Field>
          <Field id="m-costo" label="Costo (S/)">
            <Input id="m-costo" type="number" step="0.01" min="0" value={costo} onChange={(e) => setCosto(e.target.value)} placeholder="opcional" />
          </Field>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
