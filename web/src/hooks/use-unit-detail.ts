import { useCallback, useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

const ACTIVE_STATUSES = ["sent", "confirmed", "en_route"]

export interface UnitInfo {
  id: string
  plate: string
  tipo: string | null
  capacidadKg: number | null
  active: boolean
  cargas: number
  conductor: string | null
  ultimaRuta: string | null
}

export interface UnitExpenseRow {
  id: string
  fecha: string
  tipo: "combustible" | "gasto"
  galones: number | null
  monto: number
  nota: string | null
  driver: { name: string } | null
}

export interface UnitMaintenanceRow {
  id: string
  fecha: string
  tipo: "mantenimiento" | "lavado"
  detalle: string | null
  costo: number | null
}

export function useUnitDetail(id: string | undefined): {
  unit: UnitInfo | null
  expenses: UnitExpenseRow[]
  maintenance: UnitMaintenanceRow[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} {
  const [unit, setUnit] = useState<UnitInfo | null>(null)
  const [expenses, setExpenses] = useState<UnitExpenseRow[]>([])
  const [maintenance, setMaintenance] = useState<UnitMaintenanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(async () => {
    if (!id) return
    const [u, l, e, m] = await Promise.all([
      supabase.from("units").select("id, plate, tipo, capacity_kg, active").eq("id", id).single(),
      supabase.from("loads").select("status, origin, destination, created_at, driver:drivers(name)").eq("assigned_unit_id", id).order("created_at", { ascending: false }),
      supabase.from("unit_expenses").select("id, fecha, tipo, galones, monto, nota, driver:drivers(name)").eq("unit_id", id).order("fecha", { ascending: false }),
      supabase.from("unit_maintenance").select("id, fecha, tipo, detalle, costo").eq("unit_id", id).order("fecha", { ascending: false }),
    ])
    if (u.error) { setError(u.error.message); return }
    setError(null)
    const loads = (l.data ?? []) as unknown as Array<{ status: string; origin: string; destination: string; driver: { name: string } | null }>
    const activeLoad = loads.find((row) => ACTIVE_STATUSES.includes(row.status))
    const latest = loads[0]
    const r = u.data
    setUnit({
      id: r.id as string,
      plate: r.plate as string,
      tipo: (r.tipo as string | null) ?? null,
      capacidadKg: (r.capacity_kg as number | null) ?? null,
      active: r.active as boolean,
      cargas: loads.length,
      conductor: activeLoad?.driver?.name ?? null,
      ultimaRuta: latest ? `${latest.origin} → ${latest.destination}` : null,
    })
    setExpenses((e.data ?? []) as unknown as UnitExpenseRow[])
    setMaintenance((m.data ?? []) as unknown as UnitMaintenanceRow[])
  }, [id])

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchDetail().finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [fetchDetail])

  return { unit, expenses, maintenance, loading, error, refetch: fetchDetail }
}
