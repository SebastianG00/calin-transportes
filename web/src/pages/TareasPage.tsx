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
import {
  estadoConfig,
  prioridadConfig,
  tareas,
  type TareaCategoria,
  type TareaEstado,
  type TareaPrioridad,
} from "@/data/tareas"

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
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [columns, setColumns] = React.useState<ColumnVisibility>({
    categoria: true,
    estado: true,
    prioridad: true,
  })

  const filteredTareas = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    return tareas.filter((tarea) => {
      const matchesEstado =
        estadoFilter === "todos" || tarea.estado === estadoFilter
      const matchesCategoria =
        categoriaFilter === "todas" || tarea.categoria === categoriaFilter
      const matchesPrioridad =
        prioridadFilter === "todas" || tarea.prioridad === prioridadFilter
      const matchesSearch =
        query.length === 0 ||
        tarea.titulo.toLowerCase().includes(query) ||
        tarea.codigo.toLowerCase().includes(query)
      return (
        matchesEstado && matchesCategoria && matchesPrioridad && matchesSearch
      )
    })
  }, [search, estadoFilter, categoriaFilter, prioridadFilter])

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

  function toggleRow(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
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
              24
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUpIcon />
                +22%
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
              9
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
              cerradas esta semana
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>En proceso</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              7
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
              8
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUpIcon />
                +26%
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
              <Button size="sm">
                <PlusIcon />
                Nueva tarea
              </Button>
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
                  <TableHead>Tarea</TableHead>
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
                    const estado = estadoConfig[tarea.estado]
                    const estadoIconEntry = estadoIcon[tarea.estado]
                    const EstadoIcon = estadoIconEntry.icon
                    const prioridad = prioridadConfig[tarea.prioridad]
                    return (
                      <TableRow key={tarea.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(tarea.id)}
                            onCheckedChange={(value) =>
                              toggleRow(tarea.id, !!value)
                            }
                            aria-label={`Seleccionar ${tarea.codigo}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                          {tarea.codigo}
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
                            <div className="flex items-center gap-2">
                              <EstadoIcon
                                className={cn(
                                  "size-4",
                                  estadoIconEntry.className
                                )}
                              />
                              <span>{estado.label}</span>
                            </div>
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
                                  />
                                }
                              >
                                <MoreVertical />
                                <span className="sr-only">Abrir menú</span>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem>Editar</DropdownMenuItem>
                                <DropdownMenuItem>
                                  Marcar como hecha
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Eliminar</DropdownMenuItem>
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
                        3 +
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
    </div>
  )
}
