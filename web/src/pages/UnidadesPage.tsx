import * as React from "react"
import { Link } from "react-router-dom"
import {
  ChevronDownIcon,
  Columns3Icon,
  DownloadIcon,
  Eye,
  MoreVertical,
  PlusIcon,
  SearchIcon,
  SquarePen,
  TruckIcon,
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
import { units, unitStatusConfig, ultimoMant, type UnitStatus } from "@/data/units"

const estadoFilterItems: { label: string; value: UnitStatus | "todas" }[] = [
  { label: "Todas", value: "todas" },
  { label: "Activa", value: "activa" },
  { label: "Mantenimiento", value: "mantenimiento" },
  { label: "Inactiva", value: "inactiva" },
]

interface ColumnVisibility {
  capacidad: boolean
  conductor: boolean
  ultimoMant: boolean
  estado: boolean
  cargas: boolean
}

const columnLabels: Record<keyof ColumnVisibility, string> = {
  capacidad: "Capacidad",
  conductor: "Conductor",
  ultimoMant: "Último mant.",
  estado: "Estado",
  cargas: "Cargas",
}

export function UnidadesPage() {
  const [search, setSearch] = React.useState("")
  const [estadoFilter, setEstadoFilter] = React.useState<UnitStatus | "todas">(
    "todas"
  )
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [columns, setColumns] = React.useState<ColumnVisibility>({
    capacidad: true,
    conductor: true,
    ultimoMant: true,
    estado: true,
    cargas: true,
  })

  const filteredUnits = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    return units.filter((unit) => {
      const matchesEstado =
        estadoFilter === "todas" || unit.estado === estadoFilter
      const matchesSearch =
        query.length === 0 ||
        unit.placa.toLowerCase().includes(query) ||
        unit.conductor.toLowerCase().includes(query)
      return matchesEstado && matchesSearch
    })
  }, [search, estadoFilter])

  const allSelected =
    filteredUnits.length > 0 &&
    filteredUnits.every((unit) => selectedIds.has(unit.id))

  function toggleAll(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const unit of filteredUnits) {
        if (checked) next.add(unit.id)
        else next.delete(unit.id)
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
        <h1 className="text-2xl font-semibold tracking-tight">Unidades</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona la flota y su estado
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total unidades</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              14
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUpIcon />
                +1
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 text-muted-foreground">
              en la flota
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Combustible este ciclo</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              S/ 31,400
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUpIcon />
                +6%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 text-muted-foreground">
              gasto en combustible
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Unidades activas</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              11
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUpIcon />
                +2
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 text-muted-foreground">
              en operación
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>En mantenimiento</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              2
            </CardTitle>
            <CardAction>
              <Badge variant="outline">seguimiento</Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 text-muted-foreground">
              fuera de servicio
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
                placeholder="Buscar placa, conductor…"
                className="pl-8"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={estadoFilter}
                onValueChange={(value) =>
                  setEstadoFilter(value as UnitStatus | "todas")
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
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="sm" />}
                >
                  <Columns3Icon data-icon="inline-start" />
                  Columnas
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
              <Button variant="ghost" size="sm">
                <DownloadIcon />
                Exportar
              </Button>
              <Button size="sm">
                <PlusIcon />
                Agregar unidad
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
                      aria-label="Seleccionar todas"
                    />
                  </TableHead>
                  <TableHead>Unidad</TableHead>
                  {columns.capacidad && (
                    <TableHead className="text-right">Capacidad</TableHead>
                  )}
                  {columns.conductor && <TableHead>Conductor</TableHead>}
                  {columns.ultimoMant && <TableHead>Último mant.</TableHead>}
                  {columns.estado && <TableHead>Estado</TableHead>}
                  {columns.cargas && (
                    <TableHead className="text-right">Cargas</TableHead>
                  )}
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits.length ? (
                  filteredUnits.map((unit) => {
                    const statusConfig = unitStatusConfig[unit.estado]
                    return (
                      <TableRow key={unit.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(unit.id)}
                            onCheckedChange={(value) =>
                              toggleRow(unit.id, !!value)
                            }
                            aria-label={`Seleccionar ${unit.placa}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/unidades/${unit.id}`}
                            className="flex items-center gap-3"
                          >
                            <span className="flex size-9 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                              <TruckIcon className="size-4.5" />
                            </span>
                            <div className="flex flex-col">
                              <span className="font-medium">{unit.placa}</span>
                              <span className="text-xs text-muted-foreground">
                                {unit.tipo}
                              </span>
                            </div>
                          </Link>
                        </TableCell>
                        {columns.capacidad && (
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {unit.capacidadKg.toLocaleString("es-PE")} kg
                          </TableCell>
                        )}
                        {columns.conductor && (
                          <TableCell>{unit.conductor}</TableCell>
                        )}
                        {columns.ultimoMant && (
                          <TableCell>
                            {ultimoMant(unit) ? (
                              <div className="flex flex-col">
                                <span className="font-medium tabular-nums">
                                  {ultimoMant(unit)!.fecha}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {ultimoMant(unit)!.tipo}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        )}
                        {columns.estado && (
                          <TableCell>
                            <Badge
                              className={cn(
                                "border-transparent",
                                statusConfig.className
                              )}
                            >
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                        )}
                        {columns.cargas && (
                          <TableCell className="text-right tabular-nums">
                            {unit.cargas}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground"
                              title="Ver detalle"
                              render={<Link to={`/unidades/${unit.id}`} />}
                            >
                              <Eye />
                              <span className="sr-only">Ver detalle</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground"
                              title="Editar"
                            >
                              <SquarePen />
                              <span className="sr-only">Editar</span>
                            </Button>
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
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                  render={<Link to={`/unidades/${unit.id}`} />}
                                >
                                  Ver detalle
                                </DropdownMenuItem>
                                <DropdownMenuItem>Editar</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Desactivar</DropdownMenuItem>
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
                        Number(columns.capacidad) +
                        Number(columns.conductor) +
                        Number(columns.ultimoMant) +
                        Number(columns.estado) +
                        Number(columns.cargas) +
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
