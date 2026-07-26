import { InfoIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PeruMap } from "@/components/peru-map"
import { useLoads } from "@/hooks/use-loads"
import { cityDistribution } from "@/lib/map-distribution"

export function MapaPage() {
  const { loads, loading, error } = useLoads()

  if (loading) return <div className="px-6 py-10 text-sm text-muted-foreground">Cargando mapa…</div>
  if (error) return <div className="px-6 py-10 text-sm text-red-600">{error}</div>

  const destinos = cityDistribution(loads.map((l) => ({ destino: l.destino })))
  const maxCargas = destinos[0]?.cargas ?? 1
  const totalCargas = destinos.reduce((sum, d) => sum + d.cargas, 0)

  return (
    <div className="flex flex-col gap-4 px-4 py-2 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Mapa de distribución
        </h1>
        <p className="text-sm text-muted-foreground">
          Cargas por destino · nivel ciudad
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <InfoIcon className="size-4 shrink-0" />
        Vista por ciudad — no es rastreo GPS en vivo.
      </div>

      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
        <StatCard label="Destinos activos" value={String(destinos.length)} />
        <StatCard label="Ciudad principal" value={destinos[0]?.ciudad ?? "—"} />
        <StatCard label="Total de cargas" value={String(totalCargas)} />
      </div>

      <div className="grid grid-cols-1 gap-4 @4xl/main:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cargas por destino</CardTitle>
            <CardDescription>Distribución por ciudad de entrega</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {destinos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay cargas con destino.</p>
            ) : (
              destinos.map((destino) => (
                <div key={destino.ciudad} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{destino.ciudad}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {destino.cargas}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${(destino.cargas / maxCargas) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mapa geográfico</CardTitle>
            <CardDescription>Destinos por ciudad · tamaño = nº de cargas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mx-auto aspect-[300/430] max-h-[420px]">
              <PeruMap data={destinos} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}
