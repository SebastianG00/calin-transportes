import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export interface QueueRow {
  id: string
  doc_type: string
  review_status: string
  created_at: string
  validation: { overall: string; flags: { message: string }[] }
  load: { cargo_description: string; destination: string; client: { name: string } | null } | null
}

const SELECT =
  "id, doc_type, review_status, created_at, validation, load:loads(cargo_description, destination, client:clients(name))"

export function useReviewQueue() {
  const [rows, setRows] = useState<QueueRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    const { data, error: qErr } = await supabase
      .from("load_documents")
      .select(SELECT)
      .eq("review_status", "pending")
      .order("created_at", { ascending: false })
    if (qErr) { setError(qErr.message); return }
    setError(null)
    setRows((data ?? []) as unknown as QueueRow[])
  }, [])

  useEffect(() => {
    let active = true
    refetch().finally(() => { if (active) setLoading(false) })
    const channel = supabase
      .channel("revision-queue")
      .on("postgres_changes", { event: "*", schema: "public", table: "load_documents" }, () => { refetch() })
      .subscribe()
    const poll = setInterval(() => { refetch() }, 10_000)
    return () => { active = false; clearInterval(poll); supabase.removeChannel(channel) }
  }, [refetch])

  return { rows, loading, error, refetch }
}
