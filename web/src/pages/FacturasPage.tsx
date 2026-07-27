import { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { ReceiptIcon, UploadIcon, DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useFacturas } from "@/hooks/use-facturas"
import { uploadFactura, exportFacturas } from "@/lib/factura-actions"

const STATUS: Record<"pending" | "confirmed" | "rejected", { label: string; cls: string }> = {
  pending: { label: "Pendiente", cls: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmada", cls: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Rechazada", cls: "bg-red-100 text-red-800" },
}

export function FacturasPage() {
  const { facturas, loading, error, refetch } = useFacturas()
  const fileRef = useRef<HTMLInputElement>(null)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [busy, setBusy] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true)
    try { await uploadFactura(file); toast.success("Factura subida."); refetch() }
    catch (err) { toast.error((err as Error).message) }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = "" }
  }

  async function onExport() {
    setExporting(true)
    try { await exportFacturas(month) }
    catch (err) { toast.error((err as Error).message) }
    finally { setExporting(false) }
  }

  if (loading) return <div className="px-6 py-10 text-sm text-muted-foreground">Cargando facturas…</div>
  if (error) return <div className="px-6 py-10 text-sm text-red-600">{error}</div>

  return (
    <div className="flex flex-col gap-4 px-4 py-2 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Facturas</h1>
        <div className="flex items-center gap-2">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
          <Button variant="outline" size="sm" disabled={exporting} onClick={onExport}>
            <DownloadIcon /> {exporting ? "Exportando…" : "Exportar mes"}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          <Button size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
            <UploadIcon /> {busy ? "Subiendo…" : "Subir factura"}
          </Button>
        </div>
      </div>

      {facturas.length === 0 ? (
        <Card className="items-center py-16 text-center">
          <CardContent className="flex flex-col items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"><ReceiptIcon className="size-6" /></div>
            <p className="text-sm text-muted-foreground">Aún no hay facturas. Sube una imagen para empezar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {facturas.map((f) => {
            const s = STATUS[f.review_status]
            const total = f.extracted?.total?.value
            const emisor = f.extracted?.razon_social?.value
            const fecha = f.extracted?.fecha_emision?.value
            return (
              <Link key={f.id} to={`/facturas/${f.id}`}>
                <Card className="transition-colors hover:bg-muted/40">
                  <CardContent className="flex items-center gap-3 py-3">
                    <ReceiptIcon className="size-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{emisor || "Sin leer"}{f.client?.name ? ` · ${f.client.name}` : ""}</span>
                      <span className="text-xs text-muted-foreground">{fecha || "—"}{total ? ` · S/ ${total}` : ""}</span>
                    </div>
                    <Badge className={`ml-auto border-transparent ${s.cls}`}>{s.label}</Badge>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
