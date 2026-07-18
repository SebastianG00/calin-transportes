import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { EllipsisVerticalIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ApiError } from "@/lib/api"
import {
  advanceLoad,
  cancelLoad,
  nextAdvance,
  remindLoad,
} from "@/lib/load-actions"
import type { BoardLoad } from "@/lib/loads"

export function RowActions({
  load,
  onDone,
}: {
  load: BoardLoad
  onDone: () => void
}) {
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)

  const advance = nextAdvance(load.estado)
  const canRemind = load.estado === "enviado" || load.estado === "sin_respuesta"
  const canCancel = ["enviado", "sin_respuesta", "confirmado", "en_ruta"].includes(
    load.estado,
  )

  async function run(fn: () => Promise<unknown>, okMsg: string) {
    setBusy(true)
    try {
      await fn()
      toast.success(okMsg)
      onDone()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Ocurrió un error.")
    } finally {
      setBusy(false)
    }
  }

  async function handleCancel(e: FormEvent) {
    e.preventDefault()
    if (!reason.trim()) {
      toast.error("Indica un motivo.")
      return
    }
    setBusy(true)
    try {
      await cancelLoad(load.id, reason.trim())
      toast.success("Carga cancelada.")
      setCancelOpen(false)
      setReason("")
      onDone()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cancelar.")
    } finally {
      setBusy(false)
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="flex size-8 text-muted-foreground data-open:bg-muted"
              size="icon"
            />
          }
        >
          <EllipsisVerticalIcon />
          <span className="sr-only">Abrir menú</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem render={<Link to={`/cargas/${load.id}`} />}>
            Ver detalle
          </DropdownMenuItem>
          {advance && (
            <DropdownMenuItem
              disabled={busy}
              onClick={() =>
                run(() => advanceLoad(load.id, advance.to), `${advance.label} ✓`)
              }
            >
              {advance.label}
            </DropdownMenuItem>
          )}
          {canRemind && (
            <DropdownMenuItem
              disabled={busy}
              onClick={() =>
                run(() => remindLoad(load.id), "Recordatorio enviado.")
              }
            >
              Recordar
            </DropdownMenuItem>
          )}
          {canCancel && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={busy}
                onClick={() => setCancelOpen(true)}
              >
                Cancelar carga
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={cancelOpen} onOpenChange={setCancelOpen}>
        <SheetContent className="sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Cancelar carga</SheetTitle>
          </SheetHeader>
          <form className="flex flex-col gap-4 p-4" onSubmit={handleCancel}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cancel-reason">Motivo</Label>
              <Input
                id="cancel-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej. el cliente canceló el pedido"
                required
              />
            </div>
            <SheetFooter className="px-0">
              <Button type="submit" variant="destructive" disabled={busy}>
                {busy ? "Cancelando…" : "Confirmar cancelación"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
