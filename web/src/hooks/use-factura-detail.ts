import { useCallback, useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import type { EnrichedFactura } from "@/lib/factura-actions"

export function useFacturaDetail(id: string | undefined) {
  const [data, setData] = useState<EnrichedFactura | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!id) return
    try {
      setData(await apiFetch<EnrichedFactura>(`/api/facturas/${id}`))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [id])

  useEffect(() => {
    let active = true
    setLoading(true)
    refetch().finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [refetch])

  return { data, setData, loading, error, refetch }
}
