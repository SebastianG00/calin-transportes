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
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  drivers,
  driverInitials,
  driverStatusConfig,
  type DriverStatus,
} from "@/data/drivers"

const estadoFilterItems: { label: string; value: DriverStatus | "todos" }[] = [
  { label: "Todos", value: "todos" },
  { label: "Activo", value: "activo" },
  { label: "En espera", value: "en_espera" },
  { label: "Inactivo", value: "inactivo" },
]

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
  const [search, setSearch] = React.useState("")
  const [estadoFilter, setEstadoFilter] = React.useState<
    DriverStatus | "todos"
  >("todos")
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [columns, setColumns] = React.useState<ColumnVisibility>({
    whatsapp: true,
    estado: true,
    cargas: true,
  })

  const filteredDrivers = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    return drivers.filter((driver) => {
      const matchesEstado =
        estadoFilter === "todos" || driver.estado === estadoFilter
      const matchesSearch =
        query.length === 0 ||
        driver.nombre.toLowerCase().includes(query) ||
        driver.email.toLowerCase().includes(query)
      return matchesEstado && matchesSearch
    })
  }, [search, estadoFilter])

  const allSelected =
    filteredDrivers.length > 0 &&
    filteredDrivers.every((driver) => selectedIds.has(driver.id))

  function toggleAll(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const driver of filteredDrivers) {
        if (checked) next.add(driver.id)
        else next.delete(driver.id)
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
        <h1 className="text-2xl font-semibold tracking-tight">Conductores</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona los conductores y su actividad
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total conductores</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              14
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
              desde 12
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Pagado este ciclo</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              S/ 48,200
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUpIcon />
                +8%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 text-muted-foreground">
              pagos a conductores
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Conductores activos</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              12
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUpIcon />
                +32%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 text-muted-foreground">
              con cargas asignadas
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>En espera</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              2
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingDownIcon />
                −8%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 text-muted-foreground">
              sin actividad reciente
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
                placeholder="Buscar conductor…"
                className="pl-8"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={estadoFilter}
                onValueChange={(value) =>
                  setEstadoFilter(value as DriverStatus | "todos")
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
                Agregar conductor
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
                {filteredDrivers.length ? (
                  filteredDrivers.map((driver) => {
                    const statusConfig = driverStatusConfig[driver.estado]
                    return (
                      <TableRow key={driver.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(driver.id)}
                            onCheckedChange={(value) =>
                              toggleRow(driver.id, !!value)
                            }
                            aria-label={`Seleccionar ${driver.nombre}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {driverInitials(driver.nombre)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {driver.nombre}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {driver.email}
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
                                  render={
                                    <Link to={`/conductores/${driver.id}`} />
                                  }
                                >
                                  Ver perfil
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
                        Number(columns.whatsapp) +
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
