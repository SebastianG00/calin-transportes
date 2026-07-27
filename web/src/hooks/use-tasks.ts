import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Tarea } from "@/lib/tareas"

export function useTasks() {
  const [tasks, setTasks] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    const { data, error: e } = await supabase
      .from("tasks")
      .select("id, titulo, categoria, estado, prioridad, fecha_vencimiento, load_id, client_id")
      .order("created_at", { ascending: false })
    if (e) { setError(e.message); return }
    setError(null); setTasks((data ?? []) as unknown as Tarea[])
  }, [])

  useEffect(() => {
    let active = true
    refetch().finally(() => { if (active) setLoading(false) })
    const ch = supabase.channel("tasks-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => { refetch() })
      .subscribe()
    const poll = setInterval(() => { refetch() }, 10_000)
    return () => { active = false; clearInterval(poll); supabase.removeChannel(ch) }
  }, [refetch])

  return { tasks, loading, error, refetch }
}
