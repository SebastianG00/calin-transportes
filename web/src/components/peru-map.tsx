import { useState } from "react"

import { PERU_BORDER, project, type CityDatum } from "@/lib/map-distribution"

const W = 300
const H = 430

/** Thematic distribution map: Peru outline + one dot per destination city,
 *  sized by load count. Pure SVG, no external map/tiles/GPS. */
export function PeruMap({ data }: { data: CityDatum[] }) {
  const [hover, setHover] = useState<string | null>(null)

  const borderPoints = PERU_BORDER.map(([lon, lat]) => {
    const { x, y } = project(lon, lat, W, H)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(" ")

  const dots = data.filter((d) => d.coords)
  const maxCargas = Math.max(1, ...dots.map((d) => d.cargas))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label="Mapa de distribución de cargas por ciudad">
      <polygon points={borderPoints} className="fill-muted stroke-border" strokeWidth={1.2} />
      {dots.map((d) => {
        const { x, y } = project(d.coords!.lon, d.coords!.lat, W, H)
        const r = 4 + Math.sqrt(d.cargas / maxCargas) * 11
        const active = hover === d.ciudad
        return (
          <g
            key={d.ciudad}
            onMouseEnter={() => setHover(d.ciudad)}
            onMouseLeave={() => setHover(null)}
            className="cursor-default"
          >
            <circle
              cx={x}
              cy={y}
              r={r}
              className={active ? "fill-primary" : "fill-primary/60"}
              stroke="var(--background)"
              strokeWidth={1}
            />
            {active && (
              <text
                x={x}
                y={y - r - 4}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-medium"
              >
                {d.ciudad} ({d.cargas})
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
