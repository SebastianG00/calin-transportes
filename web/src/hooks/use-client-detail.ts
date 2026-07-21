import { useCallback, useEffect, useState } from "react"

import { apiFetch } from "@/lib/api"
import type { ClientDetail } from "@/lib/client-actions"

export function useClientDetail(id: string | undefined) {
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    apiFetch<ClientDetail>(`/api/clients/${id}`)
      .then((c) => { if (active) { setClient(c); setError(null) } })
      .catch((e) => { if (active) setError(e.message ?? "Error al cargar cliente.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, tick])

  return { client, loading, error, refetch }
}
