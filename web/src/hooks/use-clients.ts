import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

export interface ClientRow {
  id: string
  nombre: string
  ruc: string
  contacto: string
}

export function useClients(): {
  clients: ClientRow[]
  loading: boolean
  error: string | null
} {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    supabase
      .from("clients")
      .select("id, name, ruc, contact_name, contact_phone")
      .eq("active", true)
      .order("name")
      .then(({ data, error: e }) => {
        if (!active) return
        if (e) setError(e.message)
        else
          setClients(
            (data ?? []).map((r) => ({
              id: r.id as string,
              nombre: r.name as string,
              ruc: r.ruc as string,
              contacto:
                [r.contact_name, r.contact_phone].filter(Boolean).join(" · ") || "—",
            })),
          )
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { clients, loading, error }
}
