import { useCallback, useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

export interface DriverRow {
  id: string
  nombre: string
  email: string | null
  whatsapp: string
  active: boolean
  cargas: number
}

export function useDrivers(): {
  drivers: DriverRow[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} {
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDrivers = useCallback(async () => {
    const [d, l] = await Promise.all([
      supabase.from("drivers").select("id, name, email, whatsapp_phone, active").order("name"),
      supabase.from("loads").select("assigned_driver_id"),
    ])
    if (d.error) {
      setError(d.error.message)
      return
    }
    setError(null)
    const counts = new Map<string, number>()
    for (const row of l.data ?? []) {
      const id = (row as { assigned_driver_id: string | null }).assigned_driver_id
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1)
    }
    setDrivers(
      (d.data ?? []).map((r) => ({
        id: r.id as string,
        nombre: r.name as string,
        email: (r.email as string | null) ?? null,
        whatsapp: r.whatsapp_phone as string,
        active: r.active as boolean,
        cargas: counts.get(r.id as string) ?? 0,
      })),
    )
  }, [])

  useEffect(() => {
    let active = true
    fetchDrivers().finally(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [fetchDrivers])

  return { drivers, loading, error, refetch: fetchDrivers }
}
