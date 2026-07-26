// Pure, dependency-free helpers for the Mapa de distribución.
// Derives a city-level load distribution from the loads we already fetch, and
// projects geographic coords into an SVG viewBox. NO backend, NO GPS.

export interface CityCoord { name: string; lon: number; lat: number }
export interface CityDatum { ciudad: string; cargas: number; coords: { lon: number; lat: number } | null }

/** Geographic bounding box used for the equirectangular projection (real Peru
 *  bbox with a small margin). */
export const PERU_BOUNDS = { lonMin: -81.6, lonMax: -68.5, latMin: -18.5, latMax: 0.1 }

/** Major Peruvian cities we can place on the map (canonical name + coords). */
export const PERU_CITIES: CityCoord[] = [
  { name: "Lima", lon: -77.03, lat: -12.05 },
  { name: "Arequipa", lon: -71.54, lat: -16.41 },
  { name: "Trujillo", lon: -79.03, lat: -8.11 },
  { name: "Chiclayo", lon: -79.84, lat: -6.77 },
  { name: "Piura", lon: -80.63, lat: -5.19 },
  { name: "Cusco", lon: -71.97, lat: -13.53 },
  { name: "Iquitos", lon: -73.25, lat: -3.75 },
  { name: "Huancayo", lon: -75.20, lat: -12.07 },
  { name: "Chimbote", lon: -78.59, lat: -9.08 },
  { name: "Tacna", lon: -70.25, lat: -18.01 },
  { name: "Juliaca", lon: -70.13, lat: -15.50 },
  { name: "Ica", lon: -75.73, lat: -14.07 },
  { name: "Cajamarca", lon: -78.51, lat: -7.16 },
  { name: "Pucallpa", lon: -74.55, lat: -8.38 },
  { name: "Ayacucho", lon: -74.22, lat: -13.16 },
  { name: "Puno", lon: -70.02, lat: -15.84 },
  { name: "Tumbes", lon: -80.45, lat: -3.57 },
  { name: "Huánuco", lon: -76.24, lat: -9.93 },
  { name: "Tarapoto", lon: -76.37, lat: -6.49 },
  { name: "Cañete", lon: -76.39, lat: -13.08 },
  { name: "Chincha", lon: -76.13, lat: -13.42 },
  { name: "Moquegua", lon: -70.93, lat: -17.19 },
  { name: "Huaraz", lon: -77.53, lat: -9.53 },
  { name: "Puerto Maldonado", lon: -69.19, lat: -12.60 },
]

/** Real Peru boundary (public-domain low-res GeoJSON, 76 points), as [lon, lat]. */
export const PERU_BORDER: [number, number][] = [
  [-69.5904, -17.5800], [-69.8584, -18.0927], [-70.3726, -18.3480], [-71.3752, -17.7738], [-71.4620, -17.3635], [-73.4445, -16.3594], [-75.2379, -15.2657], [-76.0092, -14.6493], [-76.4235, -13.8232], [-76.2592, -13.5350], [-77.1062, -12.2227], [-78.0922, -10.3777], [-79.0370, -8.3866], [-79.4459, -7.9308], [-79.7606, -7.1943], [-80.5375, -6.5417], [-81.2500, -6.1368], [-80.9263, -5.6906], [-81.4109, -4.7368], [-81.0997, -4.0364], [-80.3026, -3.4049], [-80.1840, -3.8212], [-80.4693, -4.0593], [-80.4422, -4.4257], [-80.0289, -4.3461], [-79.6250, -4.4542], [-79.2053, -4.9591], [-78.6399, -4.5478], [-78.4507, -3.8731], [-77.8379, -3.0030], [-76.6354, -2.6087], [-75.5450, -1.5616], [-75.2337, -0.9114], [-75.3732, -0.1520], [-75.1066, -0.0572], [-74.4416, -0.5308], [-74.1224, -1.0028], [-73.6595, -1.2605], [-73.0704, -2.3090], [-72.3258, -2.4342], [-71.7748, -2.1698], [-71.4136, -2.3428], [-70.8135, -2.2569], [-70.0477, -2.7252], [-70.6927, -3.7429], [-70.3940, -3.7666], [-69.8936, -4.2982], [-70.7948, -4.2513], [-70.9288, -4.4016], [-71.7484, -4.5940], [-72.8919, -5.2746], [-72.9645, -5.7413], [-73.2197, -6.0892], [-73.1200, -6.6299], [-73.7245, -6.9186], [-73.7234, -7.3410], [-73.9872, -7.5238], [-73.5711, -8.4244], [-73.0154, -9.0328], [-73.2267, -9.4622], [-72.5630, -9.5202], [-72.1849, -10.0536], [-71.3024, -10.0794], [-70.4819, -9.4901], [-70.5487, -11.0091], [-70.0938, -11.1240], [-69.5297, -10.9517], [-68.6651, -12.5613], [-68.8801, -12.8997], [-68.9292, -13.6027], [-68.9489, -14.4536], [-69.3395, -14.9532], [-69.1603, -15.3240], [-69.3898, -15.6601], [-68.9596, -16.5007], [-69.5904, -17.5800],
]

/** Equirectangular projection of a geographic point into an SVG viewBox
 *  (north at top). Peru is small enough that a linear projection reads fine. */
export function project(lon: number, lat: number, width: number, height: number): { x: number; y: number } {
  const { lonMin, lonMax, latMin, latMax } = PERU_BOUNDS
  const x = ((lon - lonMin) / (lonMax - lonMin)) * width
  const y = ((latMax - lat) / (latMax - latMin)) * height
  return { x, y }
}

/** Accent/case-insensitive key for grouping and city lookup. */
function cityKey(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim()
}

/** The leading place name, dropping any " - Zona" / ", detalle" suffix. */
function baseCity(destino: string): string {
  return destino.split(/[-,]/)[0].trim()
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase())
}

const CITY_BY_KEY = new Map(PERU_CITIES.map((c) => [cityKey(c.name), c]))

/** Aggregate loads into a city-level distribution, sorted by count desc.
 *  Known cities get canonical name + coords; unknown ones rank with coords: null. */
export function cityDistribution(loads: { destino: string }[]): CityDatum[] {
  const acc = new Map<string, CityDatum>()
  for (const l of loads) {
    const base = baseCity(l.destino ?? "")
    const key = cityKey(base)
    if (!key) continue // blank destination
    const known = CITY_BY_KEY.get(key)
    const groupKey = known ? cityKey(known.name) : key
    const existing = acc.get(groupKey)
    if (existing) {
      existing.cargas += 1
    } else {
      acc.set(groupKey, {
        ciudad: known ? known.name : titleCase(base),
        cargas: 1,
        coords: known ? { lon: known.lon, lat: known.lat } : null,
      })
    }
  }
  return [...acc.values()].sort((a, b) => b.cargas - a.cargas || a.ciudad.localeCompare(b.ciudad))
}
