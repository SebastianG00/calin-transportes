import { useCallback, useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"
import {
  computeMetrics,
  toBoardLoad,
  type BoardLoad,
  type BoardMetrics,
  type LoadRow,
} from "@/lib/loads"

const SELECT =
  "*, client:clients(name), driver:drivers(name), unit:units(plate)"

export function useLoads(): {
  loads: BoardLoad[]
  metrics: BoardMetrics
  loading: boolean
  error: string | null
} {
  const [rows, setRows] = useState<LoadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLoads = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from("loads")
      .select(SELECT)
      .order("created_at", { ascending: false })
    if (queryError) {
      setError(queryError.message)
      return
    }
    setError(null)
    setRows((data ?? []) as unknown as LoadRow[])
  }, [])

  useEffect(() => {
    let active = true
    fetchLoads().finally(() => {
      if (active) setLoading(false)
    })

    const channel = supabase
      .channel("loads-board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loads" },
        () => {
          fetchLoads()
        },
      )
      .subscribe()

    const poll = setInterval(() => {
      fetchLoads()
    }, 10_000)

    return () => {
      active = false
      clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [fetchLoads])

  return {
    loads: rows.map(toBoardLoad),
    metrics: computeMetrics(rows),
    loading,
    error,
  }
}
