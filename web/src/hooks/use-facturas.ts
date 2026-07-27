import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export interface FacturaListRow {
  id: string
  review_status: "pending" | "confirmed" | "rejected"
  created_at: string
  extracted: Record<string, { value?: string }>
  client: { name: string } | null
}

const SELECT = "id, review_status, created_at, extracted, client:clients(name)"

export function useFacturas() {
  const [facturas, setFacturas] = useState<FacturaListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    const { data, error: e } = await supabase
      .from("facturas")
      .select(SELECT)
      .order("created_at", { ascending: false })
    if (e) { setError(e.message); return }
    setError(null)
    setFacturas((data ?? []) as unknown as FacturaListRow[])
  }, [])

  useEffect(() => {
    let active = true
    refetch().finally(() => { if (active) setLoading(false) })
    const channel = supabase
      .channel("facturas-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "facturas" }, () => { refetch() })
      .subscribe()
    const poll = setInterval(() => { refetch() }, 10_000)
    return () => { active = false; clearInterval(poll); supabase.removeChannel(channel) }
  }, [refetch])

  return { facturas, loading, error, refetch }
}
