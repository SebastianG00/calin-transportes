import { Link } from "react-router-dom"
import { FileCheckIcon } from "lucide-react"
import { useReviewQueue } from "@/hooks/use-review-queue"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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

export function RevisionPage() {
  const { rows, loading, error } = useReviewQueue()
  if (loading) return <div className="px-6 py-10 text-sm text-muted-foreground">Cargando revisión…</div>
  if (error) return <div className="px-6 py-10 text-sm text-red-600">{error}</div>

  return (
    <div className="flex flex-col gap-4 px-4 py-2 lg:px-6">
      <h2 className="text-xl font-semibold">Revisión de documentos</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay documentos pendientes.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <Link key={r.id} to={`/revision/${r.id}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center gap-3 py-3">
                  <span className="text-muted-foreground"><FileCheckIcon className="size-4" /></span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {r.load?.client?.name ?? "Cliente"} · {DOC_LABELS[r.doc_type] ?? r.doc_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r.load?.cargo_description} → {r.load?.destination}
                    </span>
                  </div>
                  <Badge className={cn("ml-auto border-transparent", OVERALL_STYLES[r.validation?.overall] ?? "")}>
                    {r.validation?.overall ?? "—"}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
