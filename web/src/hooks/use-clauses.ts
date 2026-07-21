import { useCallback, useEffect, useState } from "react"

import { apiFetch } from "@/lib/api"
import type { ClauseRow } from "@/lib/clause-actions"

export function useClauses(clientId?: string) {
  const [clauses, setClauses] = useState<ClauseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    const qs = clientId ? `?clientId=${clientId}` : ""
    apiFetch<ClauseRow[]>(`/api/clauses${qs}`)
      .then((rows) => { if (active) { setClauses(rows); setError(null) } })
      .catch((e) => { if (active) setError(e.message ?? "Error al cargar cláusulas.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [clientId, tick])

  return { clauses, loading, error, refetch }
}
