import { InfoIcon, MapIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// City-level distribution (mock) — not GPS tracking.
const destinos = [
  { ciudad: "Arequipa", cargas: 6 },
  { ciudad: "Cusco", cargas: 4 },
  { ciudad: "Trujillo", cargas: 3 },
  { ciudad: "Huancayo", cargas: 2 },
  { ciudad: "Piura", cargas: 2 },
  { ciudad: "Tacna", cargas: 2 },
  { ciudad: "Ica", cargas: 1 },
  { ciudad: "Chincha", cargas: 1 },
]

const maxCargas = Math.max(...destinos.map((d) => d.cargas))

export function MapaPage() {
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
        <StatCard label="Destinos activos" value="8" />
        <StatCard label="Ciudad principal" value="Arequipa" />
        <StatCard label="Cargas en ruta" value="1" />
      </div>

      <div className="grid grid-cols-1 gap-4 @4xl/main:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cargas por destino</CardTitle>
            <CardDescription>Distribución por ciudad de entrega</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {destinos.map((destino) => (
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
                    style={{
                      width: `${(destino.cargas / maxCargas) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mapa geográfico</CardTitle>
            <CardDescription>Vista espacial de destinos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 text-center text-muted-foreground">
              <MapIcon className="size-8" />
              <span className="text-sm font-medium">
                Mapa geográfico — próximamente
              </span>
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
