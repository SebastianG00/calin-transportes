import { describe, it, expect } from "vitest"
import { cityDistribution, project, PERU_CITIES, PERU_BOUNDS } from "./map-distribution"

describe("cityDistribution (pure)", () => {
  it("groups destinations case/format/accent-insensitively into canonical cities", () => {
    const dist = cityDistribution([
      { destino: "AREQUIPA - Cerro Colorado" },
      { destino: "arequipa" },
      { destino: "Arequipa" },
    ])
    expect(dist).toHaveLength(1)
    expect(dist[0].ciudad).toBe("Arequipa")
    expect(dist[0].cargas).toBe(3)
    expect(dist[0].coords).not.toBeNull()
  })

  it("sorts cities by load count descending", () => {
    const dist = cityDistribution([
      { destino: "Cusco" },
      { destino: "Arequipa" },
      { destino: "Arequipa" },
      { destino: "Arequipa" },
      { destino: "Cusco" },
    ])
    expect(dist.map((d) => d.ciudad)).toEqual(["Arequipa", "Cusco"])
    expect(dist[0].cargas).toBe(3)
  })

  it("groups accented and unaccented spellings together (Cañete = Canete)", () => {
    const dist = cityDistribution([{ destino: "CAÑETE" }, { destino: "Canete" }])
    expect(dist).toHaveLength(1)
    expect(dist[0].cargas).toBe(2)
  })

  it("includes unknown cities in the ranking but with null coords (no map dot)", () => {
    const dist = cityDistribution([{ destino: "Pueblo Nuevo XYZ" }])
    expect(dist[0].coords).toBeNull()
    expect(dist[0].cargas).toBe(1)
  })

  it("ignores blank destinations", () => {
    const dist = cityDistribution([{ destino: "" }, { destino: "   " }, { destino: "Lima" }])
    expect(dist.map((d) => d.ciudad)).toEqual(["Lima"])
  })
})

describe("project (equirectangular into the SVG viewBox)", () => {
  it("keeps every known city inside the viewBox bounds", () => {
    const W = 300, H = 500
    for (const c of PERU_CITIES) {
      const { x, y } = project(c.lon, c.lat, W, H)
      expect(x, `${c.name} x`).toBeGreaterThanOrEqual(0)
      expect(x, `${c.name} x`).toBeLessThanOrEqual(W)
      expect(y, `${c.name} y`).toBeGreaterThanOrEqual(0)
      expect(y, `${c.name} y`).toBeLessThanOrEqual(H)
    }
  })

  it("puts north above south and west left of east", () => {
    const W = 300, H = 500
    const north = project(PERU_BOUNDS.lonMin, PERU_BOUNDS.latMax, W, H)
    const south = project(PERU_BOUNDS.lonMin, PERU_BOUNDS.latMin, W, H)
    const west = project(PERU_BOUNDS.lonMin, PERU_BOUNDS.latMax, W, H)
    const east = project(PERU_BOUNDS.lonMax, PERU_BOUNDS.latMax, W, H)
    expect(north.y).toBeLessThan(south.y)
    expect(west.x).toBeLessThan(east.x)
  })
})
