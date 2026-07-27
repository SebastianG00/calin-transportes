import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeftIcon, SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useFacturaDetail } from "@/hooks/use-factura-detail"
import { extractFactura, confirmFactura, rejectFactura } from "@/lib/factura-actions"

const FIELDS: { key: string; label: string }[] = [
  { key: "ruc_emisor", label: "RUC emisor" },
  { key: "razon_social", label: "Razón social" },
  { key: "fecha_emision", label: "Fecha emisión" },
  { key: "serie", label: "Serie" },
  { key: "numero", label: "Número" },
  { key: "moneda", label: "Moneda" },
  { key: "subtotal", label: "Subtotal" },
  { key: "igv", label: "IGV" },
  { key: "total", label: "Total" },
]

export function FacturaDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, setData, loading, error } = useFacturaDetail(id)
  const [values, setValues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [reading, setReading] = useState(false)

  if (loading) return <div className="px-6 py-10 text-sm text-muted-foreground">Cargando…</div>
  if (error || !data) return <div className="px-6 py-10 text-sm text-red-600">{error ?? "No encontrada."}</div>

  const factura = data.factura as { review_status: string; extracted: Record<string, { value?: string; source?: string }> }
  const extracted = factura.extracted ?? {}
  const val = (k: string) => values[k] ?? extracted[k]?.value ?? ""
  const isPending = factura.review_status === "pending"
  const hasRead = FIELDS.some((f) => extracted[f.key])

  async function onRead() {
    setReading(true)
    try {
      const enriched = await extractFactura(id!)
      setData(enriched)
      toast.success("Factura leída con IA.")
    } catch (e) {
      toast.error((e as Error).message)
    } finally { setReading(false) }
  }

  async function onConfirm() {
    setBusy(true)
    try {
      const corrections: Record<string, string> = {}
      for (const f of FIELDS) {
        if (values[f.key] !== undefined && values[f.key] !== (extracted[f.key]?.value ?? "")) {
          corrections[f.key] = values[f.key]
        }
      }
      await confirmFactura(id!, { corrections })
      toast.success("Factura confirmada.")
      navigate("/facturas")
    } catch (e) {
      toast.error((e as Error).message)
    } finally { setBusy(false) }
  }

  async function onReject() {
    setBusy(true)
    try {
      await rejectFactura(id!)
      toast.success("Factura rechazada.")
      navigate("/facturas")
    } catch (e) {
      toast.error((e as Error).message)
    } finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-2 lg:px-6">
      <Link to="/facturas" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Volver a facturas
      </Link>

      <div className="grid grid-cols-1 gap-4 @4xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Imagen</CardTitle></CardHeader>
          <CardContent>
            {data.photoUrl ? (
              <a href={data.photoUrl} target="_blank" rel="noreferrer">
                <img src={data.photoUrl} alt="Factura" className="w-full rounded border" />
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">Sin imagen.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle>Datos</CardTitle>
            {isPending && (
              <Button size="sm" variant="secondary" onClick={onRead} disabled={reading}>
                <SparklesIcon className="size-4" /> {reading ? "Leyendo…" : "Leer con IA"}
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {FIELDS.map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <Label htmlFor={`f-${f.key}`} className="flex items-center gap-2">
                  {f.label}
                  {extracted[f.key]?.source === "vlm" && <Badge variant="secondary">IA</Badge>}
                </Label>
                <Input
                  id={`f-${f.key}`}
                  value={val(f.key)}
                  disabled={!isPending}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              </div>
            ))}

            {isPending && (
              <div className="mt-2 flex gap-2">
                <Button variant="outline" onClick={onReject} disabled={busy}>Rechazar</Button>
                <Button onClick={onConfirm} disabled={busy || !hasRead}>Confirmar</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
