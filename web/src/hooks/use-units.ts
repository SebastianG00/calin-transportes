import { useCallback, useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

export interface UnitRow {
  id: string
  placa: string
  tipo: string | null
  capacidadKg: number | null
  active: boolean
  cargas: number
  conductor: string | null
}

const ACTIVE = ["sent", "confirmed", "en_route"]

export function useUnits(): {
  units: UnitRow[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} {
  const [units, setUnits] = useState<UnitRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUnits = useCallback(async () => {
    const [u, l] = await Promise.all([
      supabase.from("units").select("id, plate, tipo, capacity_kg, active").order("plate"),
      supabase.from("loads").select("assigned_unit_id, status, driver:drivers(name)"),
    ])
    if (u.error) {
      setError(u.error.message)
      return
    }
    setError(null)
    const counts = new Map<string, number>()
    const activeDriver = new Map<string, string>()
    for (const row of (l.data ?? []) as Array<{
      assigned_unit_id: string | null
      status: string
      driver: { name: string } | null
    }>) {
      if (!row.assigned_unit_id) continue
      counts.set(row.assigned_unit_id, (counts.get(row.assigned_unit_id) ?? 0) + 1)
      if (ACTIVE.includes(row.status) && row.driver?.name) {
        activeDriver.set(row.assigned_unit_id, row.driver.name)
      }
    }
    setUnits(
      (u.data ?? []).map((r) => ({
        id: r.id as string,
        placa: r.plate as string,
        tipo: (r.tipo as string | null) ?? null,
        capacidadKg: (r.capacity_kg as number | null) ?? null,
        active: r.active as boolean,
        cargas: counts.get(r.id as string) ?? 0,
        conductor: activeDriver.get(r.id as string) ?? null,
      })),
    )
  }, [])

  useEffect(() => {
    let active = true
    fetchUnits().finally(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [fetchUnits])

  return { units, loading, error, refetch: fetchUnits }
}
