"use client"

import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowData,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Columns3Icon,
  ChevronDownIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
} from "lucide-react"

import { NuevaCargaSheet } from "@/components/nueva-carga-sheet"
import { RowActions } from "@/components/row-actions"
import type { BoardLoad, UiStatus } from "@/lib/loads"

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    onActionDone: () => void
  }
}

export const statusConfig: Record<
  UiStatus,
  { label: string; className: string }
> = {
  sin_asignar: {
    label: "Sin asignar",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
  },
  enviado: {
    label: "Enviado",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  },
  confirmado: {
    label: "Confirmado",
    className:
      "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  },
  sin_respuesta: {
    label: "Sin respuesta",
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  },
  en_ruta: {
    label: "En ruta",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  },
  entregado: {
    label: "Entregado",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
  },
  cancelado: {
    label: "Cancelado",
    className:
      "bg-neutral-100 text-neutral-500 line-through dark:bg-neutral-500/15 dark:text-neutral-400",
  },
}

const columnLabels: Record<string, string> = {
  cliente: "Cliente",
  carga: "Carga",
  confirmacion: "Confirmación",
  entrega: "Entrega",
  estado: "Estado",
}

const entregaTone: Record<string, string> = {
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
  green:
    "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  amber:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  emerald:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
}

const columns: ColumnDef<BoardLoad>[] = [
  {
    accessorKey: "cliente",
    header: "Cliente",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.cliente}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.precio}
        </span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "carga",
    header: "Carga",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span>{row.original.carga}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.pesoKg.toLocaleString("es-PE")} kg
        </span>
      </div>
    ),
  },
  {
    id: "ruta",
    header: "Ruta",
    cell: ({ row }) => (
      <span>
        {row.original.origen} → {row.original.destino}
      </span>
    ),
  },
  {
    id: "conductorUnidad",
    header: "Conductor · Unidad",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.conductor}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.unidad}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "confirmacion",
    header: "Confirmación",
    cell: ({ row }) => (
      <span
        className={cn(
          "text-sm",
          row.original.estado === "sin_respuesta"
            ? "font-medium text-red-600 dark:text-red-400"
            : "text-muted-foreground"
        )}
      >
        {row.original.confirmacion}
      </span>
    ),
  },
  {
    id: "entrega",
    header: "Entrega",
    cell: ({ row }) => {
      const e = row.original.entrega
      if (e.tone === "muted")
        return <span className="text-sm text-muted-foreground">{e.label}</span>
      return (
        <Badge className={cn("border-transparent", entregaTone[e.tone])}>
          {e.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const config = statusConfig[row.original.estado]
      return (
        <Badge className={cn("border-transparent", config.className)}>
          {config.label}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => (
      <RowActions
        load={row.original}
        onDone={table.options.meta!.onActionDone}
      />
    ),
    enableHiding: false,
  },
]

export function DataTable({
  loads,
  onActionDone,
}: {
  loads: BoardLoad[]
  onActionDone: () => void
}) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = React.useState("todas")

  const tabItems = React.useMemo(
    () => [
      { value: "todas", label: "Todas", count: loads.length },
      {
        value: "enviado",
        label: "Enviado",
        count: loads.filter((l) => l.estado === "enviado").length,
      },
      {
        value: "sin_respuesta",
        label: "Sin respuesta",
        count: loads.filter((l) => l.estado === "sin_respuesta").length,
      },
      {
        value: "confirmado",
        label: "Confirmado",
        count: loads.filter((l) => l.estado === "confirmado").length,
      },
      {
        value: "en_ruta",
        label: "En ruta",
        count: loads.filter((l) => l.estado === "en_ruta").length,
      },
      {
        value: "entregado",
        label: "Entregado",
        count: loads.filter((l) => l.estado === "entregado").length,
      },
    ],
    [loads],
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const filteredData = React.useMemo(
    () =>
      activeTab === "todas"
        ? loads
        : loads.filter((load) => load.estado === activeTab),
    [activeTab, loads]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    meta: { onActionDone },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleTabChange(value: string) {
    setActiveTab(value)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => handleTabChange(value as string)}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          Vista
        </Label>
        <Select
          value={activeTab}
          onValueChange={(value) => handleTabChange(value as string)}
          items={tabItems.map((t) => ({ label: t.label, value: t.value }))}
        >
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Selecciona una vista" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {tabItems.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
          {tabItems.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label} <Badge variant="secondary">{t.count}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <Columns3Icon data-icon="inline-start" />
              Columnas
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {columnLabels[column.id] ?? column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <NuevaCargaSheet onCreated={onActionDone} />
        </div>
      </div>
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/cargas/${row.original.id}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Sin resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {table.getFilteredRowModel().rows.length} carga(s) en esta vista.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Filas por página
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
                items={[10, 20, 30, 40, 50].map((pageSize) => ({
                  label: `${pageSize}`,
                  value: `${pageSize}`,
                }))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Página {table.getState().pagination.pageIndex + 1} de{" "}
              {Math.max(table.getPageCount(), 1)}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Ir a la primera página</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Ir a la página anterior</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Ir a la página siguiente</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Ir a la última página</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Tabs>
  )
}
