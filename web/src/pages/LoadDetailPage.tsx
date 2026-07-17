import { Link, useParams } from "react-router-dom"
import { ArrowLeftIcon, MessageCircleIcon, PackageCheckIcon } from "lucide-react"

import { statusConfig } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { loads } from "@/data/loads"

const historial = [
  {
    hora: "08:12",
    autor: "Oficina · María",
    texto: "Carga creada y asignada",
  },
  {
    hora: "08:12",
    autor: "Sistema",
    texto: 'WhatsApp plantilla "asignación" enviada',
    tecnico: {
      to: "+51 987 654 321",
      template: "asignacion_carga_v2",
      status: "delivered",
      messageId: "wamid.HBgLNTE5ODc2NTQzMjE=",
    },
  },
  {
    hora: "08:13",
    autor: "Sistema",
    texto: "Esperando confirmación del conductor…",
  },
]

export function LoadDetailPage() {
  const { id } = useParams()
  const load = loads.find((l) => l.id === Number(id)) ?? loads[1]
  const config = statusConfig[load.estado]

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
            <DetailRow
              label="Ruta"
              value={`${load.origen} → ${load.destino}`}
            />
            <DetailRow label="Conductor" value={load.conductor} link="/conductores" />
            <DetailRow label="WhatsApp" value="+51 987 654 321" />
            <DetailRow label="Unidad" value={load.unidad} link="/unidades" />
            <DetailRow label="Precio" value={load.precio} />
            <DetailRow label="Fecha" value="15/07/2026" />

            <div className="mt-2 flex gap-2">
              <Button variant="outline">Reasignar</Button>
              <Button variant="destructive">Cancelar</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-4 border-l pl-4">
              {historial.map((evento, index) => (
                <li key={index} className="relative">
                  <span className="absolute top-1.5 -left-[1.1rem] size-2 rounded-full bg-primary" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{evento.hora}</span>
                    <span>·</span>
                    <span>{evento.autor}</span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm">
                    {evento.tecnico ? (
                      <MessageCircleIcon className="size-3.5 text-muted-foreground" />
                    ) : (
                      <PackageCheckIcon className="size-3.5 text-muted-foreground" />
                    )}
                    {evento.texto}
                  </p>
                  {evento.tecnico ? (
                    <details className="mt-1 text-xs text-muted-foreground">
                      <summary className="cursor-pointer select-none">
                        Detalle técnico
                      </summary>
                      <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-2 text-[0.7rem]">
                        {JSON.stringify(evento.tecnico, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
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
