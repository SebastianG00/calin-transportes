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
import { createTask, updateTask } from "@/lib/task-actions"
import {
  estadoConfig,
  prioridadConfig,
  type Tarea,
  type TareaCategoria,
  type TareaEstado,
  type TareaPrioridad,
} from "@/lib/tareas"

const categoriaItems: { value: TareaCategoria; label: string }[] = [
  { value: "Carga", label: "Carga" },
  { value: "Cobro", label: "Cobro" },
  { value: "Mantenimiento", label: "Mantenimiento" },
  { value: "Cliente", label: "Cliente" },
  { value: "Otro", label: "Otro" },
]

const estadoItems: { value: TareaEstado; label: string }[] = (
  Object.entries(estadoConfig) as [TareaEstado, { label: string }][]
).map(([value, cfg]) => ({ value, label: cfg.label }))

const prioridadItems: { value: TareaPrioridad; label: string }[] = (
  Object.entries(prioridadConfig) as [TareaPrioridad, { label: string }][]
).map(([value, cfg]) => ({ value, label: cfg.label }))

export function TareaSheet({
  mode,
  tarea,
  trigger,
  open: openProp,
  onOpenChange,
  onDone,
}: {
  mode: "create" | "edit"
  tarea?: Tarea
  trigger?: ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onDone: () => void
}) {
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = onOpenChange ?? setOpenState
  const [busy, setBusy] = useState(false)
  const [titulo, setTitulo] = useState(tarea?.titulo ?? "")
  const [categoria, setCategoria] = useState<TareaCategoria>(
    tarea?.categoria ?? "Carga",
  )
  const [estado, setEstado] = useState<TareaEstado>(
    tarea?.estado ?? "pendiente",
  )
  const [prioridad, setPrioridad] = useState<TareaPrioridad>(
    tarea?.prioridad ?? "normal",
  )
  const [vence, setVence] = useState(tarea?.fecha_vencimiento ?? "")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const body = {
        titulo: titulo.trim(),
        categoria,
        estado,
        prioridad,
        fecha_vencimiento: vence ? vence : null,
        load_id: null,
        client_id: null,
      }
      if (mode === "create") await createTask(body)
      else await updateTask(tarea!.id, body)
      toast.success(mode === "create" ? "Tarea creada." : "Tarea actualizada.")
      setOpen(false)
      onDone()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar la tarea.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger && <SheetTrigger render={trigger} />}
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Nueva tarea" : "Editar tarea"}</SheetTitle>
        </SheetHeader>
        <form className="flex flex-col gap-4 p-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-titulo">Título</Label>
            <Input
              id="t-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Categoría</Label>
            <Select
              value={categoria}
              onValueChange={(v) => setCategoria((v ?? "Carga") as TareaCategoria)}
              items={categoriaItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoriaItems.map((it) => (
                  <SelectItem key={it.value} value={it.value}>
                    {it.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Estado</Label>
            <Select
              value={estado}
              onValueChange={(v) => setEstado((v ?? "pendiente") as TareaEstado)}
              items={estadoItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {estadoItems.map((it) => (
                  <SelectItem key={it.value} value={it.value}>
                    {it.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Prioridad</Label>
            <Select
              value={prioridad}
              onValueChange={(v) => setPrioridad((v ?? "normal") as TareaPrioridad)}
              items={prioridadItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {prioridadItems.map((it) => (
                  <SelectItem key={it.value} value={it.value}>
                    {it.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-vence">Vence</Label>
            <Input
              id="t-vence"
              type="date"
              value={vence}
              onChange={(e) => setVence(e.target.value)}
            />
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
