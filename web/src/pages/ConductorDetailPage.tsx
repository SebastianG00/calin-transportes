import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon, PencilIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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
import { ConductorSheet } from "@/components/conductor-sheet"
import { useDriverDetail } from "@/hooks/use-driver-detail"
import { toUiStatus } from "@/lib/loads"
import { cn } from "@/lib/utils"

const ACTIVE_STATUSES = ["sent", "confirmed", "en_route"]

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
}

function fmtDate(d: string | null): string {
  return d ? format(new Date(d), "d MMM yyyy", { locale: es }) : "—"
}

export function ConductorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { driver, loads, loading, error, refetch } = useDriverDetail(id)
  const [editOpen, setEditOpen] = useState(false)

  if (loading) return <div className="px-6 py-10 text-sm text-muted-foreground">Cargando conductor…</div>
  if (error || !driver) {
    return (
      <div className="flex flex-col gap-3 px-6 py-10">
        <Link to="/conductores" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" /> Volver a conductores
        </Link>
        <p className="text-sm text-red-600">{error ?? "Conductor no encontrado."}</p>
      </div>
    )
  }

  const licencia = [
    driver.licenciaCategoria,
    driver.licenciaVence ? `vence ${format(new Date(driver.licenciaVence), "MMM yyyy", { locale: es })}` : null,
  ].filter(Boolean).join(" · ") || "—"
  const activas = loads.filter((l) => ACTIVE_STATUSES.includes(l.status)).length
  const entregadas = loads.filter((l) => l.status === "delivered").length

  return (
    <div className="flex flex-col gap-4 px-4 py-2 lg:px-6">
      <Link to="/conductores" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" />
        Volver a conductores
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-14 text-lg">
          <AvatarFallback>{initials(driver.nombre)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">{driver.nombre}</h2>
            <Badge className={cn("border-transparent", driver.active
              ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300")}>
              {driver.active ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>
        <div className="ml-auto flex flex-col items-end gap-0.5 text-sm text-muted-foreground">
          <span className="tabular-nums">{driver.whatsapp}</span>
          <span>{driver.email ?? "—"}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
          <PencilIcon />
          Editar
        </Button>
      </div>

      <ConductorSheet mode="edit" driver={driver} open={editOpen} onOpenChange={setEditOpen} onDone={refetch} />

      <div className="grid grid-cols-1 gap-4 @4xl/main:grid-cols-[20rem_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <DetailRow label="Nombre" value={driver.nombre} />
            <DetailRow label="DNI" value={driver.dni ?? "—"} />
            <DetailRow label="Email" value={driver.email ?? "—"} />
            <DetailRow label="WhatsApp" value={driver.whatsapp} />
            <DetailRow label="Estado" value={driver.active ? "Activo" : "Inactivo"} />
            <DetailRow label="Licencia" value={licencia} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 @2xl/main:grid-cols-3">
            <StatTile label="Cargas totales" value={String(driver.cargas)} />
            <StatTile label="Activas" value={String(activas)} />
            <StatTile label="Entregadas" value={String(entregadas)} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historial de cargas</CardTitle>
            </CardHeader>
            <CardContent>
              {loads.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este conductor aún no tiene cargas.</p>
              ) : (
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
                      {loads.map((row) => {
                        const cfg = statusConfig[toUiStatus(row.status, row.no_response)]
                        return (
                          <TableRow
                            key={row.id}
                            className="cursor-pointer"
                            onClick={() => navigate(`/cargas/${row.id}`)}
                          >
                            <TableCell className="font-medium">{fmtDate(row.scheduled_date)}</TableCell>
                            <TableCell>{row.client?.name ?? "—"}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {row.origin} → {row.destination}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("border-transparent", cfg.className)}>{cfg.label}</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
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
