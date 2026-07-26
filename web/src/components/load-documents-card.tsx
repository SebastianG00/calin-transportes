import { useEffect, useState } from "react"
import { format } from "date-fns"
import { fetchLoadDocuments, type LoadDocument } from "@/lib/document-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const OVERALL_STYLES: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
}
const DOC_LABELS: Record<string, string> = {
  gre_remitente: "GRE Remitente",
  gre_transportista: "GRE Transportista",
  factura: "Factura",
  other: "Sin clasificar",
}
const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  rejected: "Rechazado",
}

export function LoadDocumentsCard({ loadId, reloadKey }: { loadId: string; reloadKey?: number }) {
  const [docs, setDocs] = useState<LoadDocument[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchLoadDocuments(loadId)
      .then((d) => { if (active) setDocs(d) })
      .catch((e) => { if (active) setError(e.message) })
    return () => { active = false }
  }, [loadId, reloadKey])

  return (
    <Card>
      <CardHeader><CardTitle>Documentos de entrega</CardTitle></CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : !docs ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay guías para esta carga.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {docs.map((d) => (
              <div key={d.id} className="flex gap-3 rounded-md border p-2">
                {d.photoUrl ? (
                  <a
                    href={d.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Ver foto completa"
                    className="shrink-0"
                  >
                    <img
                      src={d.photoUrl}
                      alt="Guía"
                      className="size-20 rounded object-cover transition-opacity hover:opacity-80"
                    />
                  </a>
                ) : (
                  <div className="flex size-20 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                    sin foto
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{DOC_LABELS[d.doc_type] ?? d.doc_type}</span>
                    <Badge className={cn("border-transparent", OVERALL_STYLES[d.validation?.overall] ?? "")}>
                      {d.validation?.overall ?? "—"}
                    </Badge>
                    <Badge variant="outline" className="ml-auto">
                      {STATUS_LABELS[d.review_status] ?? d.review_status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {[d.ruc, d.serie && d.numero ? `${d.serie}-${d.numero}` : null, d.fecha].filter(Boolean).join(" · ")}
                  </span>
                  {d.confirmed_at && (
                    <span className="text-xs text-muted-foreground">
                      Confirmado {format(new Date(d.confirmed_at), "dd/MM/yyyy HH:mm")}
                    </span>
                  )}
                  {(d.validation?.flags?.length ?? 0) > 0 && (
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      {d.validation.flags.map((f, i) => (
                        <span
                          key={i}
                          className={cn(
                            "text-xs",
                            d.validation.overall === "red"
                              ? "text-red-700 dark:text-red-400"
                              : "text-amber-700 dark:text-amber-400",
                          )}
                        >
                          ⚠ {f.message}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
