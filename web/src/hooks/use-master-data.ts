import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

export interface Option {
  id: string
  label: string
}

export function useMasterData(): {
  clients: Option[]
  drivers: Option[]
  units: Option[]
  loading: boolean
} {
  const [clients, setClients] = useState<Option[]>([])
  const [drivers, setDrivers] = useState<Option[]>([])
  const [units, setUnits] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      const [c, d, u] = await Promise.all([
        supabase.from("clients").select("id, name").eq("active", true).order("name"),
        supabase.from("drivers").select("id, name").eq("active", true).order("name"),
        supabase.from("units").select("id, plate").eq("active", true).order("plate"),
      ])
      if (!active) return
      setClients((c.data ?? []).map((r) => ({ id: r.id as string, label: r.name as string })))
      setDrivers((d.data ?? []).map((r) => ({ id: r.id as string, label: r.name as string })))
      setUnits((u.data ?? []).map((r) => ({ id: r.id as string, label: r.plate as string })))
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [])

  return { clients, drivers, units, loading }
}
