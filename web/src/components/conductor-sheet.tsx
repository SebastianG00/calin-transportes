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
import { createDriver, updateDriver } from "@/lib/driver-actions"
import type { DriverRow } from "@/hooks/use-drivers"

export function ConductorSheet({
  mode,
  driver,
  trigger,
  open: openProp,
  onOpenChange,
  onDone,
}: {
  mode: "create" | "edit"
  driver?: DriverRow
  trigger?: ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onDone: () => void
}) {
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = onOpenChange ?? setOpenState
  const [busy, setBusy] = useState(false)
  const [nombre, setNombre] = useState(driver?.nombre ?? "")
  const [email, setEmail] = useState(driver?.email ?? "")
  const [whatsapp, setWhatsapp] = useState(driver?.whatsapp ?? "+51")
  const [activo, setActivo] = useState(driver?.active ?? true)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      // Sanitize the phone to E.164: keep a leading + and digits only
      // (so "+51 987 654 321" or "(51) 987-654-321" become "+51987654321").
      const cleanedPhone = whatsapp.trim().replace(/[^\d+]/g, "")
      const body = {
        name: nombre.trim(),
        email: email.trim() ? email.trim() : null,
        whatsapp_phone: cleanedPhone,
        active: activo,
      }
      if (mode === "create") await createDriver(body)
      else await updateDriver(driver!.id, body)
      toast.success(mode === "create" ? "Conductor creado." : "Conductor actualizado.")
      setOpen(false)
      onDone()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el conductor.")
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
            {mode === "create" ? "Nuevo conductor" : "Editar conductor"}
          </SheetTitle>
        </SheetHeader>
        <form className="flex flex-col gap-4 p-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-nombre">Nombre</Label>
            <Input
              id="c-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-email">Email</Label>
            <Input
              id="c-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="opcional"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-wa">WhatsApp (E.164)</Label>
            <Input
              id="c-wa"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+51987654321"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Estado</Label>
            <Select
              value={activo ? "activo" : "inactivo"}
              onValueChange={(v) => setActivo(v === "activo")}
              items={[
                { value: "activo", label: "Activo" },
                { value: "inactivo", label: "Inactivo" },
              ]}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
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
