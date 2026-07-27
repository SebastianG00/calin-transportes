import { useCallback, useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"
import type { DriverRow } from "@/hooks/use-drivers"
import type { LoadRow } from "@/lib/loads"

export type DriverLoad = LoadRow

export function useDriverDetail(id: string | undefined): {
  driver: DriverRow | null
  loads: DriverLoad[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} {
  const [driver, setDriver] = useState<DriverRow | null>(null)
  const [loads, setLoads] = useState<DriverLoad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(async () => {
    if (!id) return
    const [d, l] = await Promise.all([
      supabase
        .from("drivers")
        .select("id, name, email, whatsapp_phone, active, dni, licencia_categoria, licencia_vence")
        .eq("id", id)
        .single(),
      supabase
        .from("loads")
        .select("*, client:clients(name), driver:drivers(name), unit:units(plate)")
        .eq("assigned_driver_id", id)
        .order("created_at", { ascending: false }),
    ])
    if (d.error) { setError(d.error.message); return }
    setError(null)
    const r = d.data
    const list = (l.data ?? []) as unknown as LoadRow[]
    setDriver({
      id: r.id as string,
      nombre: r.name as string,
      email: (r.email as string | null) ?? null,
      whatsapp: r.whatsapp_phone as string,
      active: r.active as boolean,
      dni: (r.dni as string | null) ?? null,
      licenciaCategoria: (r.licencia_categoria as string | null) ?? null,
      licenciaVence: (r.licencia_vence as string | null) ?? null,
      cargas: list.length,
    })
    setLoads(list)
  }, [id])

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchDetail().finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [fetchDetail])

  return { driver, loads, loading, error, refetch: fetchDetail }
}
