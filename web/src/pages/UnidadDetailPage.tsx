import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeftIcon, PlusIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { GastoSheet, MantenimientoSheet } from "@/components/unit-log-sheets"
import { useUnitDetail } from "@/hooks/use-unit-detail"
import { cn } from "@/lib/utils"

const fmt = (d: string) => format(new Date(d + "T00:00:00"), "d MMM yyyy", { locale: es })
const soles = (n: number) => n.toLocaleString("es-PE", { minimumFractionDigits: 0 })
const TIPO_LABEL: Record<string, string> = {
  combustible: "Combustible", gasto: "Gasto", mantenimiento: "Mantenimiento", lavado: "Lavado",
}

export function UnidadDetailPage() {
  const { id } = useParams()
  const { unit, expenses, maintenance, loading, error, refetch } = useUnitDetail(id)
  const [gastoOpen, setGastoOpen] = useState(false)
  const [mantOpen, setMantOpen] = useState(false)

  if (loading) return <div className="px-6 py-10 text-sm text-muted-foreground">Cargando unidad…</div>
  if (error || !unit) {
    return (
      <div className="flex flex-col gap-3 px-6 py-10">
        <Link to="/unidades" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" /> Volver a unidades
        </Link>
        <p className="text-sm text-red-600">{error ?? "Unidad no encontrada."}</p>
      </div>
    )
  }

  const estado = unit.active ? "Activa" : "Inactiva"
  const estadoClass = unit.active
    ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
    : "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300"
  const mesPrefix = new Date().toISOString().slice(0, 7)
  const gastoMes = expenses.filter((e) => e.fecha.startsWith(mesPrefix)).reduce((s, e) => s + Number(e.monto), 0)
  const ultimoMant = maintenance[0]

  return (
    <div className="flex flex-col gap-4 px-4 py-2 lg:px-6">
      <Link to="/unidades" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" />
        Volver a unidades
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">{unit.plate}</h2>
        {unit.tipo && <span className="text-sm text-muted-foreground">{unit.tipo}</span>}
        <Badge className={cn("border-transparent", estadoClass)}>{estado}</Badge>
      </div>

      <GastoSheet unitId={unit.id} open={gastoOpen} onOpenChange={setGastoOpen} onDone={refetch} />
      <MantenimientoSheet unitId={unit.id} open={mantOpen} onOpenChange={setMantOpen} onDone={refetch} />

      <div className="grid grid-cols-1 gap-4 @4xl/main:grid-cols-[20rem_1fr]">
        <Card className="h-fit">
          <CardHeader><CardTitle>Detalle</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <DetailRow label="Placa" value={unit.plate} />
            <DetailRow label="Tipo" value={unit.tipo ?? "—"} />
            <DetailRow label="Capacidad" value={unit.capacidadKg != null ? `${unit.capacidadKg.toLocaleString("es-PE")} kg` : "—"} />
            <DetailRow label="Conductor asignado" value={unit.conductor ?? "—"} />
            <DetailRow label="Estado" value={estado} />
            <DetailRow label="Cargas totales" value={String(unit.cargas)} />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Tabs defaultValue="resumen">
              <TabsList>
                <TabsTrigger value="resumen">Resumen</TabsTrigger>
                <TabsTrigger value="combustible">Combustible / Gastos</TabsTrigger>
                <TabsTrigger value="mantenimiento">Mantenimiento / Lavado</TabsTrigger>
              </TabsList>

              <TabsContent value="resumen" className="pt-4">
                <div className="grid grid-cols-2 gap-3 @2xl/main:grid-cols-4">
                  <StatTile label="Cargas totales" value={String(unit.cargas)} />
                  <StatTile label="Última ruta" value={unit.ultimaRuta ?? "—"} />
                  <StatTile label="Gasto este mes" value={`S/ ${soles(gastoMes)}`} />
                  <StatTile label="Estado" value={estado} />
                </div>
              </TabsContent>

              <TabsContent value="combustible" className="pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm">Gasto este mes: <span className="font-semibold">S/ {soles(gastoMes)}</span></p>
                  <Button size="sm" onClick={() => setGastoOpen(true)}><PlusIcon />Registrar</Button>
                </div>
                <div className="mt-4 overflow-hidden rounded-lg border">
                  {expenses.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">Sin registros de combustible / gastos.</p>
                  ) : (
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Galones</TableHead>
                          <TableHead className="text-right">Monto (S/)</TableHead>
                          <TableHead>Conductor</TableHead>
                          <TableHead>Nota</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{fmt(row.fecha)}</TableCell>
                            <TableCell>{TIPO_LABEL[row.tipo] ?? row.tipo}</TableCell>
                            <TableCell className="text-right tabular-nums">{row.galones ?? "—"}</TableCell>
                            <TableCell className="text-right tabular-nums">{soles(Number(row.monto))}</TableCell>
                            <TableCell>{row.driver?.name ?? "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{row.nota ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="mantenimiento" className="pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm">
                    Último registro:{" "}
                    <span className="font-semibold">
                      {ultimoMant ? `${fmt(ultimoMant.fecha)} · ${TIPO_LABEL[ultimoMant.tipo] ?? ultimoMant.tipo}` : "—"}
                    </span>
                  </p>
                  <Button size="sm" onClick={() => setMantOpen(true)}><PlusIcon />Registrar</Button>
                </div>
                <div className="mt-4 overflow-hidden rounded-lg border">
                  {maintenance.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">Sin registros de mantenimiento / lavado.</p>
                  ) : (
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Detalle</TableHead>
                          <TableHead className="text-right">Costo (S/)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {maintenance.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{fmt(row.fecha)}</TableCell>
                            <TableCell>{TIPO_LABEL[row.tipo] ?? row.tipo}</TableCell>
                            <TableCell className="text-muted-foreground">{row.detalle ?? "—"}</TableCell>
                            <TableCell className="text-right tabular-nums">{row.costo != null ? soles(Number(row.costo)) : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 text-sm last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}
