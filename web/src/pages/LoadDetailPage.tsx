import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeftIcon, MessageCircleIcon, PackageCheckIcon } from "lucide-react"
import { format } from "date-fns"

import { statusConfig } from "@/components/data-table"
import { GuiaBuilderCard } from "@/components/guia-builder-card"
import { RowActions } from "@/components/row-actions"
import { SubirGuiaButton } from "@/components/subir-guia-button"
import { LoadDocumentsCard } from "@/components/load-documents-card"
import { SummaryEmailCard } from "@/components/summary-email-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { BoardLoad } from "@/lib/loads"
import {
  eventTitle,
  messageTitle,
  useLoadDetail,
} from "@/hooks/use-load-detail"

export function LoadDetailPage() {
  const { id } = useParams()
  const { load, timeline, loading, error, refetch } = useLoadDetail(id)
  const [docsKey, setDocsKey] = useState(0)

  if (loading) {
    return (
      <div className="px-6 py-10 text-sm text-muted-foreground">
        Cargando carga…
      </div>
    )
  }
  if (error || !load) {
    return (
      <div className="flex flex-col gap-3 px-6 py-10">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Volver al tablero
        </Link>
        <p className="text-sm text-red-600">{error ?? "Carga no encontrada."}</p>
      </div>
    )
  }

  const config = statusConfig[load.estado]
  const boardLoad: BoardLoad = {
    id: load.id,
    cliente: load.cliente,
    carga: load.carga,
    pesoKg: load.pesoKg,
    origen: load.origen,
    destino: load.destino,
    conductor: load.conductor,
    unidad: load.unidad,
    estado: load.estado,
    confirmacion: "",
    precio: load.precio,
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-2 lg:px-6">
      <Link
        to="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Volver al tablero
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">
          {load.cliente} · {load.carga}
        </h2>
        <Badge className={cn("border-transparent", config.className)}>
          {config.label}
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          <SubirGuiaButton loadId={load.id} onUploaded={() => { refetch(); setDocsKey((k) => k + 1) }} />
          <RowActions load={boardLoad} onDone={refetch} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 @4xl/main:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalle</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <DetailRow label="Cliente" value={load.cliente} />
            <DetailRow
              label="Carga"
              value={`${load.carga} · ${load.pesoKg.toLocaleString("es-PE")} kg`}
            />
            <DetailRow label="Ruta" value={`${load.origen} → ${load.destino}`} />
            <DetailRow label="Conductor" value={load.conductor} link="/conductores" />
            <DetailRow label="WhatsApp" value={load.conductorPhone ?? "—"} />
            <DetailRow label="Unidad" value={load.unidad} link="/unidades" />
            <DetailRow label="Precio" value={load.precio} />
            <DetailRow label="Fecha" value={load.fecha} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin eventos todavía.</p>
            ) : (
              <ol className="flex flex-col gap-4 border-l pl-4">
                {timeline.map((item) => {
                  const hora = format(new Date(item.at), "dd/MM HH:mm")
                  return (
                    <li key={`${item.kind}-${item.id}`} className="relative">
                      <span className="absolute top-1.5 -left-[1.1rem] size-2 rounded-full bg-primary" />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{hora}</span>
                        <span>·</span>
                        <span>
                          {item.kind === "event"
                            ? `${item.source} · ${item.actor}`
                            : messageTitle(item)}
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm">
                        {item.kind === "message" ? (
                          <MessageCircleIcon className="size-3.5 text-muted-foreground" />
                        ) : (
                          <PackageCheckIcon className="size-3.5 text-muted-foreground" />
                        )}
                        {item.kind === "event"
                          ? eventTitle(item)
                          : (item.body ?? item.template ?? "Mensaje")}
                      </p>
                      {item.kind === "message" && (
                        <details className="mt-1 text-xs text-muted-foreground">
                          <summary className="cursor-pointer select-none">
                            Detalle técnico
                          </summary>
                          <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-2 text-[0.7rem]">
                            {JSON.stringify(
                              {
                                sid: item.sid,
                                to: item.toPhone,
                                from: item.fromPhone,
                                template: item.template,
                                status: item.status,
                              },
                              null,
                              2,
                            )}
                          </pre>
                        </details>
                      )}
                    </li>
                  )
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <GuiaBuilderCard loadId={load.id} clientId={load.clienteId} />

      <SummaryEmailCard loadId={load.id} />

      <LoadDocumentsCard loadId={load.id} reloadKey={docsKey} />
    </div>
  )
}

function DetailRow({
  label,
  value,
  link,
}: {
  label: string
  value: string
  link?: string
}) {
  return (
    <div className="flex items-center justify-between border-b pb-2 text-sm last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      {link ? (
        <Link to={link} className="font-medium text-primary hover:underline">
          {value}
        </Link>
      ) : (
        <span className="font-medium">{value}</span>
      )}
    </div>
  )
}
