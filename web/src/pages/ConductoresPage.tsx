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
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { ConductorSheet } from "@/components/conductor-sheet"
import { useDrivers, type DriverRow } from "@/hooks/use-drivers"
import { updateDriver } from "@/lib/driver-actions"

type EstadoFilter = "todos" | "activo" | "inactivo"

const estadoFilterItems: { label: string; value: EstadoFilter }[] = [
  { label: "Todos", value: "todos" },
  { label: "Activo", value: "activo" },
  { label: "Inactivo", value: "inactivo" },
]

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function estadoBadge(active: boolean): { label: string; className: string } {
  return active
    ? {
        label: "Activo",
        className:
          "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
      }
    : {
        label: "Inactivo",
        className:
          "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
      }
}

interface ColumnVisibility {
  whatsapp: boolean
  estado: boolean
  cargas: boolean
}

const columnLabels: Record<keyof ColumnVisibility, string> = {
  whatsapp: "WhatsApp",
  estado: "Estado",
  cargas: "Cargas",
}

export function ConductoresPage() {
  const { drivers, loading, error, refetch } = useDrivers()
  const [search, setSearch] = React.useState("")
  const [estadoFilter, setEstadoFilter] = React.useState<EstadoFilter>("todos")
  const [editing, setEditing] = React.useState<DriverRow | null>(null)
  const [columns, setColumns] = React.useState<ColumnVisibility>({
    whatsapp: true,
    estado: true,
    cargas: true,
  })

  const total = drivers.length
  const activos = drivers.filter((d) => d.active).length
  const inactivos = total - activos
  const cargasTotal = drivers.reduce((sum, d) => sum + d.cargas, 0)

  const filteredDrivers = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    return drivers.filter((driver) => {
      const matchesEstado =
        estadoFilter === "todos" ||
        (estadoFilter === "activo" ? driver.active : !driver.active)
      const matchesSearch =
        query.length === 0 ||
        driver.nombre.toLowerCase().includes(query) ||
        (driver.email ?? "").toLowerCase().includes(query)
      return matchesEstado && matchesSearch
    })
  }, [drivers, search, estadoFilter])

  async function toggleActive(driver: DriverRow) {
    try {
      await updateDriver(driver.id, { active: !driver.active })
      toast.success(driver.active ? "Conductor desactivado." : "Conductor activado.")
      refetch()
    } catch {
      toast.error("No se pudo actualizar el conductor.")
    }
  }

  const metricCards: { label: string; value: string | number }[] = [
    { label: "Total conductores", value: total },
    { label: "Activos", value: activos },
    { label: "Inactivos", value: inactivos },
    { label: "Cargas asignadas", value: cargasTotal },
  ]

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Conductores</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona los conductores y su actividad
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
                placeholder="Buscar conductor…"
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
              <ConductorSheet
                mode="create"
                onDone={refetch}
                trigger={
                  <Button size="sm">
                    <PlusIcon />
                    Agregar conductor
                  </Button>
                }
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Conductor</TableHead>
                  {columns.whatsapp && <TableHead>WhatsApp</TableHead>}
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
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Cargando…
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-red-600">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filteredDrivers.length ? (
                  filteredDrivers.map((driver) => {
                    const badge = estadoBadge(driver.active)
                    return (
                      <TableRow key={driver.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {initials(driver.nombre)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{driver.nombre}</span>
                              <span className="text-xs text-muted-foreground">
                                {driver.email ?? "—"}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        {columns.whatsapp && (
                          <TableCell className="tabular-nums text-muted-foreground">
                            {driver.whatsapp}
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
                            {driver.cargas}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground"
                              title="Ver perfil"
                              render={<Link to={`/conductores/${driver.id}`} />}
                            >
                              <Eye />
                              <span className="sr-only">Ver perfil</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground"
                              title="Editar"
                              onClick={() => setEditing(driver)}
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
                                  render={<Link to={`/conductores/${driver.id}`} />}
                                >
                                  Ver perfil
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditing(driver)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => toggleActive(driver)}>
                                  {driver.active ? "Desactivar" : "Activar"}
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
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
        <ConductorSheet
          key={editing.id}
          mode="edit"
          driver={editing}
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
