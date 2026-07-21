import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useClauses } from "@/hooks/use-clauses"
import { useGuias } from "@/hooks/use-guias"
import { buildGuia, approveGuia } from "@/lib/guia-actions"

export function GuiaBuilderCard({ loadId, clientId }: { loadId: string; clientId?: string }) {
  const { clauses } = useClauses(clientId)
  const { guias, refetch } = useGuias(loadId)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function onBuild() {
    setBusy(true)
    try {
      await buildGuia(loadId, { clauseIds: [...selected], oneOffClauses: [] })
      toast.success("Guía generada (borrador)")
      refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo generar la guía.")
    } finally { setBusy(false) }
  }

  async function onApprove(id: string) {
    try {
      await approveGuia(id)
      toast.success("Guía aprobada")
      refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo aprobar.")
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Guía de entrega (pre-viaje)</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Selecciona los requisitos a incluir:</p>
          {clauses.length ? clauses.map((c) => (
            <label key={c.id} className="flex items-start gap-2 text-sm">
              <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} />
              <span><strong>{c.title}</strong> — {c.body}</span>
            </label>
          )) : <p className="text-sm text-muted-foreground">Sin cláusulas. Agrégalas en el cliente.</p>}
          <Button onClick={onBuild} disabled={busy} className="w-fit">
            {busy ? "Generando…" : "Generar guía"}
          </Button>
        </div>

        {guias.length > 0 && (
          <ul className="flex flex-col gap-2">
            {guias.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Badge variant={g.status === "approved" ? "default" : "outline"}>
                    {g.status === "approved" ? "Aprobada" : "Borrador"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(g.created_at).toLocaleString("es-PE")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/guias/${g.id}/print`} target="_blank" className="text-sm hover:underline">
                    Ver / imprimir
                  </Link>
                  {g.status === "draft" && (
                    <Button size="sm" variant="secondary" onClick={() => onApprove(g.id)}>Aprobar</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
