import { useState, type FormEvent } from "react"
import { PlusIcon } from "lucide-react"
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
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useMasterData } from "@/hooks/use-master-data"
import { ApiError } from "@/lib/api"
import { createLoad } from "@/lib/load-actions"

export function NuevaCargaSheet({ onCreated }: { onCreated: () => void }) {
  const { clients, drivers, units, loading } = useMasterData()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [clientId, setClientId] = useState("")
  const [unitId, setUnitId] = useState("")
  const [driverId, setDriverId] = useState("")
  const [cargo, setCargo] = useState("")
  const [weight, setWeight] = useState("")
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [price, setPrice] = useState("")

  function reset() {
    setClientId("")
    setUnitId("")
    setDriverId("")
    setCargo("")
    setWeight("")
    setOrigin("")
    setDestination("")
    setPrice("")
    setDate(new Date().toISOString().slice(0, 10))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!clientId || !unitId || !driverId) {
      toast.error("Selecciona cliente, unidad y conductor.")
      return
    }
    setSubmitting(true)
    try {
      await createLoad({
        client_id: clientId,
        unit_id: unitId,
        driver_id: driverId,
        cargo_description: cargo,
        weight_kg: Number(weight),
        origin,
        destination,
        scheduled_date: date,
        price: Number(price),
        currency: "PEN",
      })
      toast.success("Carga creada y asignada.")
      setOpen(false)
      reset()
      onCreated()
    } catch (err) {
      if (err instanceof ApiError && err.code === "DRIVER_HAS_ACTIVE_LOAD") {
        toast.error("Ese conductor ya tiene una carga activa.")
      } else if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error("No se pudo crear la carga.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" />}>
        <PlusIcon />
        <span className="hidden lg:inline">Nueva carga</span>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Nueva carga</SheetTitle>
          <SheetDescription>
            Se enviará la solicitud de confirmación al conductor por WhatsApp.
          </SheetDescription>
        </SheetHeader>
        <form className="flex flex-col gap-4 p-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label>Cliente</Label>
            <Select value={clientId} onValueChange={(v) => setClientId(v as string)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Conductor</Label>
            <Select value={driverId} onValueChange={(v) => setDriverId(v as string)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un conductor" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Unidad</Label>
            <Select value={unitId} onValueChange={(v) => setUnitId(v as string)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una unidad" />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cargo">Carga</Label>
            <Input
              id="cargo"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ej. Cerveza"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                min="1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price">Precio (S/)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="origin">Origen</Label>
              <Input
                id="origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Ej. Lima"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="destination">Destino</Label>
              <Input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Ej. Arequipa"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Fecha programada</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={submitting || loading}>
              {submitting ? "Creando…" : "Crear carga"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
