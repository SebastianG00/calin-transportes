import { Link, useParams } from "react-router-dom"
import { ArrowLeftIcon, PlusIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { units, unitStatusConfig } from "@/data/units"

const combustible = [
  { fecha: "12 jul", galones: 45, monto: 850, conductor: "Juan Quispe", nota: "Grifo Primax" },
  { fecha: "09 jul", galones: 38, monto: 720, conductor: "Juan Quispe", nota: "Grifo Repsol" },
  { fecha: "05 jul", galones: 50, monto: 940, conductor: "Juan Quispe", nota: "Grifo Petroperú" },
  { fecha: "01 jul", galones: 42, monto: 800, conductor: "Juan Quispe", nota: "Grifo Primax" },
  { fecha: "27 jun", galones: 47, monto: 890, conductor: "Juan Quispe", nota: "Grifo Primax" },
]

export function UnidadDetailPage() {
  const { id } = useParams()
  const unit = units.find((u) => u.id === Number(id)) ?? units[0]
  const config = unitStatusConfig[unit.estado]

  return (
    <div className="flex flex-col gap-4 px-4 py-2 lg:px-6">
      <Link
        to="/unidades"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Volver a unidades
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">{unit.placa}</h2>
        <span className="text-sm text-muted-foreground">{unit.tipo}</span>
        <Badge className={cn("border-transparent", config.className)}>
          {config.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 @4xl/main:grid-cols-[20rem_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Detalle</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <DetailRow label="Placa" value={unit.placa} />
            <DetailRow label="Tipo" value={unit.tipo} />
            <DetailRow
              label="Capacidad"
              value={`${unit.capacidadKg.toLocaleString("es-PE")} kg`}
            />
            <DetailRow label="Conductor asignado" value={unit.conductor} />
            <DetailRow label="Estado" value={config.label} />
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
                  <StatTile label="Última carga" value="hoy · Lima→Arequipa" />
                  <StatTile
                    label="Capacidad"
                    value={`${unit.capacidadKg.toLocaleString("es-PE")} kg`}
                  />
                  <StatTile label="Estado" value={config.label} />
                </div>
              </TabsContent>

              <TabsContent value="combustible" className="pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm">
                    Gasto este mes:{" "}
                    <span className="font-semibold">S/ 4,200</span>
                  </p>
                  <Button size="sm">
                    <PlusIcon />
                    Registrar carga
                  </Button>
                </div>
                <div className="mt-4 overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Galones</TableHead>
                        <TableHead className="text-right">Monto (S/)</TableHead>
                        <TableHead>Conductor</TableHead>
                        <TableHead>Nota</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {combustible.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{row.fecha}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.galones}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.monto.toLocaleString("es-PE")}
                          </TableCell>
                          <TableCell>{row.conductor}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {row.nota}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="mantenimiento" className="pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm">
                    Último registro:{" "}
                    <span className="font-semibold">
                      {unit.mantenimiento[0]
                        ? `${unit.mantenimiento[0].fecha} · ${unit.mantenimiento[0].tipo}`
                        : "—"}
                    </span>
                  </p>
                  <Button size="sm">
                    <PlusIcon />
                    Registrar
                  </Button>
                </div>
                <div className="mt-4 overflow-hidden rounded-lg border">
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
                      {unit.mantenimiento.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{row.fecha}</TableCell>
                          <TableCell>{row.tipo}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {row.detalle}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.costo.toLocaleString("es-PE")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
