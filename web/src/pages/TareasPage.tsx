import * as React from "react"
import {
  CheckCircle,
  ChevronDownIcon,
  CirclePlay,
  Clock,
  Columns3Icon,
  MoreVertical,
  PlusIcon,
  SearchIcon,
  TrendingUpIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api"
import { deleteTask, updateTask } from "@/lib/task-actions"
import { useTasks } from "@/hooks/use-tasks"
import { TareaSheet } from "@/components/tarea-sheet"
import {
  estadoConfig,
  prioridadConfig,
  type Tarea,
  type TareaCategoria,
  type TareaEstado,
  type TareaPrioridad,
} from "@/lib/tareas"

const estadoFilterItems: { label: string; value: TareaEstado | "todos" }[] = [
  { label: "Todos", value: "todos" },
  { label: "Pendiente", value: "pendiente" },
  { label: "En proceso", value: "en_proceso" },
  { label: "Hecho", value: "hecho" },
]

const categoriaFilterItems: {
  label: string
  value: TareaCategoria | "todas"
}[] = [
  { label: "Todas", value: "todas" },
  { label: "Carga", value: "Carga" },
  { label: "Cobro", value: "Cobro" },
  { label: "Mantenimiento", value: "Mantenimiento" },
  { label: "Cliente", value: "Cliente" },
  { label: "Otro", value: "Otro" },
]

const prioridadFilterItems: {
  label: string
  value: TareaPrioridad | "todas"
}[] = [
  { label: "Todas", value: "todas" },
  { label: "Crítica", value: "critica" },
  { label: "Importante", value: "importante" },
  { label: "Normal", value: "normal" },
]

const estadoIcon: Record<
  TareaEstado,
  { icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  hecho: { icon: CheckCircle, className: "text-green-600 dark:text-green-400" },
  en_proceso: { icon: CirclePlay, className: "text-blue-600 dark:text-blue-400" },
  pendiente: { icon: Clock, className: "text-muted-foreground" },
}

const estadoSelectItems: { value: TareaEstado; label: string }[] = (
  Object.entries(estadoConfig) as [TareaEstado, { label: string }][]
).map(([value, cfg]) => ({ value, label: cfg.label }))

interface ColumnVisibility {
  categoria: boolean
  estado: boolean
  prioridad: boolean
}

const columnLabels: Record<keyof ColumnVisibility, string> = {
  categoria: "Categoría",
  estado: "Estado",
  prioridad: "Prioridad",
}

export function TareasPage() {
  const { tasks, loading, error, refetch } = useTasks()
  const [search, setSearch] = React.useState("")
  const [estadoFilter, setEstadoFilter] = React.useState<
    TareaEstado | "todos"
  >("todos")
  const [categoriaFilter, setCategoriaFilter] = React.useState<
    TareaCategoria | "todas"
  >("todas")
  const [prioridadFilter, setPrioridadFilter] = React.useState<
    TareaPrioridad | "todas"
  >("todas")
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [columns, setColumns] = React.useState<ColumnVisibility>({
    categoria: true,
    estado: true,
    prioridad: true,
  })
  const [editing, setEditing] = React.useState<Tarea | null>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const filteredTareas = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    return tasks.filter((tarea) => {
      const matchesEstado =
        estadoFilter === "todos" || tarea.estado === estadoFilter
      const matchesCategoria =
        categoriaFilter === "todas" || tarea.categoria === categoriaFilter
      const matchesPrioridad =
        prioridadFilter === "todas" || tarea.prioridad === prioridadFilter
      const matchesSearch =
        query.length === 0 || tarea.titulo.toLowerCase().includes(query)
      return (
        matchesEstado && matchesCategoria && matchesPrioridad && matchesSearch
      )
    })
  }, [tasks, search, estadoFilter, categoriaFilter, prioridadFilter])

  const total = tasks.length
  const hechas = tasks.filter((t) => t.estado === "hecho").length
  const enProceso = tasks.filter((t) => t.estado === "en_proceso").length
  const pendientes = tasks.filter((t) => t.estado === "pendiente").length

  const allSelected =
    filteredTareas.length > 0 &&
    filteredTareas.every((tarea) => selectedIds.has(tarea.id))

  function toggleAll(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const tarea of filteredTareas) {
        if (checked) next.add(tarea.id)
        else next.delete(tarea.id)
      }
      return next
    })
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function handleEstadoChange(id: string, estado: TareaEstado) {
    setBusyId(id)
    try {
      await updateTask(id, { estado })
      toast.success("Estado actualizado.")
      refetch()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "No se pudo actualizar el estado."
      )
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(tarea: Tarea) {
    if (
      !window.confirm(
        `¿Eliminar la tarea "${tarea.titulo}"? Esta acción no se puede deshacer.`
      )
    ) {
      return
    }
    setBusyId(tarea.id)
    try {
      await deleteTask(tarea.id)
      toast.success("Tarea eliminada.")
      refetch()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "No se pudo eliminar la tarea."
      )
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="px-6 py-10 text-sm text-muted-foreground">
        Cargando tareas…
      </div>
    )
  }
  if (error) {
    return <div className="px-6 py-10 text-sm text-red-600">{error}</div>
  }

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tareas</h1>
        <p className="text-sm text-muted-foreground">
          Pendientes de la oficina
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total tareas</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {total}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUpIcon />
                Vivo
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 text-muted-foreground">
              en el tablero de la oficina
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Completadas</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {hechas}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <CheckCircle />
                Hecho
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 text-muted-foreground">
              tareas cerradas
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>En proceso</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {enProceso}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <CirclePlay />
                Activas
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 text-muted-foreground">
              en curso ahora mismo
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Pendientes</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {pendientes}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Clock />
                Por comenzar
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 text-muted-foreground">
              por comenzar
            </div>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar tarea…"
                className="pl-8"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={estadoFilter}
                onValueChange={(value) =>
                  setEstadoFilter(value as TareaEstado | "todos")
                }
                items={estadoFilterItems}
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {estadoFilterItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                value={categoriaFilter}
                onValueChange={(value) =>
                  setCategoriaFilter(value as TareaCategoria | "todas")
                }
                items={categoriaFilterItems}
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {categoriaFilterItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                value={prioridadFilter}
                onValueChange={(value) =>
                  setPrioridadFilter(value as TareaPrioridad | "todas")
                }
                items={prioridadFilterItems}
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {prioridadFilterItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="sm" />}
                >
                  <Columns3Icon data-icon="inline-start" />
                  Ver
                  <ChevronDownIcon data-icon="inline-end" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {(Object.keys(columnLabels) as (keyof ColumnVisibility)[]).map(
                    (key) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={columns[key]}
                        onCheckedChange={(value) =>
                          setColumns((prev) => ({ ...prev, [key]: !!value }))
                        }
                      >
                        {columnLabels[key]}
                      </DropdownMenuCheckboxItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <TareaSheet
                mode="create"
                onDone={refetch}
                trigger={
                  <Button size="sm">
                    <PlusIcon />
                    Nueva tarea
                  </Button>
                }
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(value) => toggleAll(!!value)}
                      aria-label="Seleccionar todos"
                    />
                  </TableHead>
                  <TableHead>Título</TableHead>
                  {columns.categoria && <TableHead>Categoría</TableHead>}
                  {columns.estado && <TableHead>Estado</TableHead>}
                  {columns.prioridad && <TableHead>Prioridad</TableHead>}
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTareas.length ? (
                  filteredTareas.map((tarea) => {
                    const estadoIconEntry = estadoIcon[tarea.estado]
                    const EstadoIcon = estadoIconEntry.icon
                    const prioridad = prioridadConfig[tarea.prioridad]
                    const rowBusy = busyId === tarea.id
                    return (
                      <TableRow key={tarea.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(tarea.id)}
                            onCheckedChange={(value) =>
                              toggleRow(tarea.id, !!value)
                            }
                            aria-label={`Seleccionar ${tarea.titulo}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {tarea.titulo}
                        </TableCell>
                        {columns.categoria && (
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-muted-foreground"
                            >
                              {tarea.categoria}
                            </Badge>
                          </TableCell>
                        )}
                        {columns.estado && (
                          <TableCell>
                            <Select
                              value={tarea.estado}
                              onValueChange={(value) =>
                                handleEstadoChange(
                                  tarea.id,
                                  value as TareaEstado
                                )
                              }
                              items={estadoSelectItems}
                            >
                              <SelectTrigger
                                size="sm"
                                disabled={rowBusy}
                                aria-label={`Cambiar estado de ${tarea.titulo}`}
                                className="w-auto min-w-36 border-none bg-transparent shadow-none"
                              >
                                <EstadoIcon
                                  className={cn(
                                    "size-4",
                                    estadoIconEntry.className
                                  )}
                                />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {estadoSelectItems.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        )}
                        {columns.prioridad && (
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={prioridad.className}
                            >
                              {prioridad.label}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground data-open:bg-muted"
                                    disabled={rowBusy}
                                  />
                                }
                              >
                                <MoreVertical />
                                <span className="sr-only">Abrir menú</span>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  onClick={() => setEditing(tarea)}
                                >
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={tarea.estado === "hecho"}
                                  onClick={() =>
                                    handleEstadoChange(tarea.id, "hecho")
                                  }
                                >
                                  Marcar como hecha
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => handleDelete(tarea)}
                                >
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={
                        2 +
                        Number(columns.categoria) +
                        Number(columns.estado) +
                        Number(columns.prioridad) +
                        1
                      }
                      className="h-24 text-center text-muted-foreground"
                    >
                      Sin resultados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {editing && (
        <TareaSheet
          key={editing.id}
          mode="edit"
          tarea={editing}
          open
          onOpenChange={(o) => {
            if (!o) setEditing(null)
          }}
          onDone={() => {
            setEditing(null)
            refetch()
          }}
        />
      )}
    </div>
  )
}
