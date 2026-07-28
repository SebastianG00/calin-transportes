import { useCallback, useEffect, useState } from "react"
import { listItems } from "@/lib/inventory-actions"
import type { ItemWithStock } from "@/lib/inventory"

export function useInventory() {
  const [items, setItems] = useState<ItemWithStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refetch = useCallback(async () => {
    try { setItems(await listItems()); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : "Error") }
  }, [])
  useEffect(() => { refetch().finally(() => setLoading(false)) }, [refetch])
  return { items, loading, error, refetch }
}
