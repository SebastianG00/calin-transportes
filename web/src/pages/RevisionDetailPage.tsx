import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"
import { toast } from "sonner"
import {
  confirmDocument, fetchDocumentDetail, rejectDocument, type DocumentDetail,
} from "@/lib/document-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export function RevisionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<DocumentDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [fields, setFields] = useState({ ruc: "", serie: "", numero: "", fecha: "", peso_kg: "" })

  useEffect(() => {
    if (!id) return
    fetchDocumentDetail(id)
      .then((d) => {
        setDetail(d)
        setFields({
          ruc: d.document.ruc ?? "", serie: d.document.serie ?? "",
          numero: d.document.numero ?? "", fecha: d.document.fecha ?? "", peso_kg: "",
        })
      })
      .catch((e) => setError(e.message))
  }, [id])

  if (error) return <div className="px-6 py-10 text-sm text-red-600">{error}</div>
  if (!detail || !id) return <div className="px-6 py-10 text-sm text-muted-foreground">Cargando…</div>

  const flags = detail.document.validation?.flags ?? []

  async function doConfirm() {
    setBusy(true)
    try {
      const corrections: Record<string, string> = {}
      for (const k of ["ruc", "serie", "numero", "fecha"] as const) {
        if (fields[k] && fields[k] !== (detail!.document[k] ?? "")) corrections[k] = fields[k]
      }
      const out = (await confirmDocument(id!, {
        corrections,
        peso_kg: fields.peso_kg ? Number(fields.peso_kg) : undefined,
      })) as { loadStatusChanged?: boolean }
      toast.success(
        out?.loadStatusChanged
          ? "Documento confirmado. Carga marcada como entregada."
          : "Documento confirmado.",
      )
      navigate("/revision")
    } catch (e) {
      toast.error((e as Error).message)
    } finally { setBusy(false) }
  }

  function onConfirmClick() {
    // Flagged (red/amber) docs require an explicit override; green confirms directly.
    if (detail!.document.validation?.overall === "green") doConfirm()
    else setOverrideOpen(true)
  }

  async function onReject() {
    setBusy(true)
    try {
      await rejectDocument(id!, "Rechazado en revisión")
      toast.success("Documento rechazado.")
      navigate("/revision")
    } catch (e) {
      toast.error((e as Error).message)
    } finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-2 lg:px-6">
      <Link to="/revision" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Volver a revisión
      </Link>

      <div className="grid grid-cols-1 gap-4 @4xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Foto de la guía</CardTitle></CardHeader>
          <CardContent>
            {detail.photoUrl ? (
              <img src={detail.photoUrl} alt="Guía" className="max-h-[520px] w-full rounded-md object-contain" />
            ) : (
              <p className="text-sm text-muted-foreground">Sin imagen.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Campos extraídos</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {flags.length > 0 && (
              <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-2">
                {flags.map((f, i) => (
                  <span key={i} className="text-xs text-amber-700">⚠ {f.message}</span>
                ))}
              </div>
            )}
            {(["ruc", "serie", "numero", "fecha"] as const).map((k) => (
              <div key={k} className="flex flex-col gap-1">
                <Label className="capitalize">{k}</Label>
                <Input value={fields[k]} onChange={(e) => setFields((s) => ({ ...s, [k]: e.target.value }))} />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <Label>Peso (kg)</Label>
              <Input
                type="number" placeholder="Ingresa el peso de la guía"
                value={fields.peso_kg}
                onChange={(e) => setFields((s) => ({ ...s, peso_kg: e.target.value }))}
              />
            </div>
            {overrideOpen ? (
              <div className="mt-2 flex flex-col gap-2 rounded-md border p-3">
                <p className="text-sm font-medium">Este documento tiene advertencias:</p>
                <ul className="flex flex-col gap-1 text-xs">
                  {flags.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-amber-700">
                      <span aria-hidden>⚠</span>
                      <span>{f.message}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground">¿Confirmar de todos modos?</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setOverrideOpen(false)} disabled={busy}>Cancelar</Button>
                  <Button onClick={doConfirm} disabled={busy}>Sí, confirmar</Button>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <Badge className="border-transparent bg-muted text-foreground">
                  {detail.document.validation?.overall ?? "—"}
                </Badge>
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" onClick={onReject} disabled={busy}>Rechazar</Button>
                  <Button onClick={onConfirmClick} disabled={busy}>Confirmar</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
