import { useCallback, useEffect, useState } from "react"

import { fetchLoadGuias, type GuiaRow } from "@/lib/guia-actions"

export function useGuias(loadId: string) {
  const [guias, setGuias] = useState<GuiaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchLoadGuias(loadId)
      .then((rows) => { if (active) setGuias(rows) })
      .catch(() => { if (active) setGuias([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [loadId, tick])

  return { guias, loading, refetch }
}
