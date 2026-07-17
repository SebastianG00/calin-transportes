import { Link, useParams } from "react-router-dom"
import { ArrowLeftIcon, PencilIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { statusConfig } from "@/components/data-table"
import { cn } from "@/lib/utils"
import { drivers, driverInitials, driverStatusConfig } from "@/data/drivers"
import { loads } from "@/data/loads"

// Cargas recientes derived from the shared loads mock (any subset — this is demo data).
const cargasRecientes = [
  { fecha: "16 jul", ...loads[1] },
  { fecha: "12 jul", ...loads[6] },
  { fecha: "08 jul", ...loads[4] },
  { fecha: "03 jul", ...loads[3] },
  { fecha: "27 jun", ...loads[7] },
]

export function ConductorDetailPage() {
  const { id } = useParams()
  const driver = drivers.find((d) => d.id === Number(id)) ?? drivers[0]
  const config = driverStatusConfig[driver.estado]

  // NOTE: licencia and DNI are placeholder/mock fields — not part of the driver data model.
  const licencia = "A-IIIb · vence 2027"
  const dni = "45xxxxxx"
  const antiguedad = "desde 2021"

  return (
    <div className="flex flex-col gap-4 px-4 py-2 lg:px-6">
      <Link
        to="/conductores"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Volver a conductores
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-14 text-lg">
          <AvatarFallback>{driverInitials(driver.nombre)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              {driver.nombre}
            </h2>
            <Badge className={cn("border-transparent", config.className)}>
              {config.label}
            </Badge>
          </div>
        </div>
        <div className="ml-auto flex flex-col items-end gap-0.5 text-sm text-muted-foreground">
          <span className="tabular-nums">{driver.whatsapp}</span>
          <span>{driver.email}</span>
        </div>
        <Button variant="ghost" size="sm">
          <PencilIcon />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 @4xl/main:grid-cols-[20rem_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <DetailRow label="Nombre" value={driver.nombre} />
            <DetailRow label="Email" value={driver.email} />
            <DetailRow label="WhatsApp" value={driver.whatsapp} />
            <DetailRow label="Estado" value={config.label} />
            <DetailRow label="Licencia" value={licencia} />
            <DetailRow label="DNI" value={dni} />
            <DetailRow label="Antigüedad" value={antiguedad} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 @2xl/main:grid-cols-3">
            <StatTile label="Cargas totales" value={String(driver.cargas)} />
            <StatTile label="A tiempo" value="96%" />
            <StatTile label="Última carga" value="hoy · Lima→Arequipa" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cargas recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Ruta</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cargasRecientes.map((row, index) => {
                      const estadoConfig = statusConfig[row.estado]
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {row.fecha}
                          </TableCell>
                          <TableCell>{row.cliente}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {row.origen} → {row.destino}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "border-transparent",
                                estadoConfig.className
                              )}
                            >
                              {estadoConfig.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-2 text-sm last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
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
