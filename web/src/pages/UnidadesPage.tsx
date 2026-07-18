import * as React from "react"
import { Link } from "react-router-dom"
import {
  ChevronDownIcon,
  Columns3Icon,
  Eye,
  MoreVertical,
  PlusIcon,
  SearchIcon,
  SquarePen,
  TruckIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { UnidadSheet } from "@/components/unidad-sheet"
import { useUnits, type UnitRow } from "@/hooks/use-units"
import { updateUnit } from "@/lib/unit-actions"

type EstadoFilter = "todas" | "activa" | "inactiva"

const estadoFilterItems: { label: string; value: EstadoFilter }[] = [
  { label: "Todas", value: "todas" },
  { label: "Activa", value: "activa" },
  { label: "Inactiva", value: "inactiva" },
]

function estadoBadge(active: boolean): { label: string; className: string } {
  return active
    ? {
        label: "Activa",
        className:
          "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
      }
    : {
        label: "Inactiva",
        className:
          "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
      }
}

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
  const { units, loading, error, refetch } = useUnits()
  const [search, setSearch] = React.useState("")
  const [estadoFilter, setEstadoFilter] = React.useState<EstadoFilter>("todas")
  const [editing, setEditing] = React.useState<UnitRow | null>(null)
  const [columns, setColumns] = React.useState<ColumnVisibility>({
    capacidad: true,
    conductor: true,
    ultimoMant: true,
    estado: true,
    cargas: true,
  })

  const total = units.length
  const activas = units.filter((u) => u.active).length
  const inactivas = total - activas
  const cargasTotal = units.reduce((sum, u) => sum + u.cargas, 0)

  const filteredUnits = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    return units.filter((unit) => {
      const matchesEstado =
        estadoFilter === "todas" ||
        (estadoFilter === "activa" ? unit.active : !unit.active)
      const matchesSearch =
        query.length === 0 ||
        unit.placa.toLowerCase().includes(query) ||
        (unit.conductor ?? "").toLowerCase().includes(query)
      return matchesEstado && matchesSearch
    })
  }, [units, search, estadoFilter])

  async function toggleActive(unit: UnitRow) {
    try {
      await updateUnit(unit.id, { active: !unit.active })
      toast.success(unit.active ? "Unidad desactivada." : "Unidad activada.")
      refetch()
    } catch {
      toast.error("No se pudo actualizar la unidad.")
    }
  }

  const metricCards: { label: string; value: string | number }[] = [
    { label: "Total unidades", value: total },
    { label: "Activas", value: activas },
    { label: "Inactivas", value: inactivas },
    { label: "Cargas asignadas", value: cargasTotal },
  ]

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Unidades</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona la flota y su estado
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        {metricCards.map((card) => (
          <Card key={card.label} className="@container/card">
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {card.value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
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
                onValueChange={(value) => setEstadoFilter(value as EstadoFilter)}
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
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <UnidadSheet
                mode="create"
                onDone={refetch}
                trigger={
                  <Button size="sm">
                    <PlusIcon />
                    Agregar unidad
                  </Button>
                }
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Cargando…
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-red-600">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filteredUnits.length ? (
                  filteredUnits.map((unit) => {
                    const badge = estadoBadge(unit.active)
                    return (
                      <TableRow key={unit.id}>
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
                                {unit.tipo ?? "—"}
                              </span>
                            </div>
                          </Link>
                        </TableCell>
                        {columns.capacidad && (
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {unit.capacidadKg != null
                              ? `${unit.capacidadKg.toLocaleString("es-PE")} kg`
                              : "—"}
                          </TableCell>
                        )}
                        {columns.conductor && (
                          <TableCell>{unit.conductor ?? "—"}</TableCell>
                        )}
                        {columns.ultimoMant && (
                          <TableCell className="text-muted-foreground">
                            Sin registro
                          </TableCell>
                        )}
                        {columns.estado && (
                          <TableCell>
                            <Badge className={cn("border-transparent", badge.className)}>
                              {badge.label}
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
                              onClick={() => setEditing(unit)}
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
                                <DropdownMenuItem onClick={() => setEditing(unit)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => toggleActive(unit)}>
                                  {unit.active ? "Desactivar" : "Activar"}
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
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
        <UnidadSheet
          key={editing.id}
          mode="edit"
          unit={editing}
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
