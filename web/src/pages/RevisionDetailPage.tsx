import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon, SparklesIcon } from "lucide-react"
import { toast } from "sonner"
import {
  confirmDocument, extractDocument, fetchDocumentDetail, rejectDocument,
  type ExtractedField, type VerifyClauseCheck,
} from "@/lib/document-actions"
import { GuiaOverlay } from "@/components/guia-overlay"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

const FIELD_ORDER = [
  "receptor", "ruc_receptor", "fecha_entrega", "peso", "bultos", "destino",
  "conductor", "placa", "guia_serie", "guia_numero", "observaciones",
] as const

export function RevisionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof extractDocument>> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [reading, setReading] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const [activeField, setActiveField] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    // Reuse Tier-1 detail on load; it lacks verifyClauses (empty) until "Leer con IA".
    fetchDocumentDetail(id)
      .then((d) => { setDetail({ ...d, verifyClauses: [] } as never); seedValues((d.document as { extracted?: Record<string, ExtractedField> }).extracted) })
      .catch((e) => setError(e.message))
  }, [id])

  function seedValues(extracted?: Record<string, ExtractedField>) {
    if (!extracted) return
    const v: Record<string, string> = {}
    for (const k of FIELD_ORDER) v[k] = extracted[k]?.value ?? ""
    setValues((prev) => ({ ...v, ...prev }))
  }

  async function onRead() {
    if (!id) return
    setReading(true)
    try {
      const enriched = await extractDocument(id)
      setDetail(enriched)
      const v: Record<string, string> = {}
      for (const k of FIELD_ORDER) v[k] = enriched.document.extracted[k]?.value ?? ""
      setValues(v)
      toast.success("Guía leída con IA. Revisa y confirma.")
    } catch (e) {
      toast.error((e as Error).message)
    } finally { setReading(false) }
  }

  const boxes = useMemo(() => {
    const ex = detail?.document.extracted ?? {}
    const out: Record<string, [number, number, number, number] | null> = {}
    for (const k of FIELD_ORDER) out[k] = (ex as Record<string, ExtractedField>)[k]?.bbox ?? null
    return out
  }, [detail])

  if (error) return <div className="px-6 py-10 text-sm text-red-600">{error}</div>
  if (!detail || !id) return <div className="px-6 py-10 text-sm text-muted-foreground">Cargando…</div>

  const validation = (detail.document as { validation?: { overall?: string; flags?: Array<{ message: string }> } }).validation ?? {}
  const flags = validation.flags ?? []
  const extracted = (detail.document.extracted ?? {}) as Record<string, ExtractedField>

  async function doConfirm() {
    setBusy(true)
    try {
      const corrections: Record<string, string> = {}
      for (const k of FIELD_ORDER) {
        const orig = extracted[k]?.value ?? ""
        if (values[k] !== undefined && values[k] !== orig) corrections[k] = values[k]
      }
      const out = (await confirmDocument(id!, { corrections })) as { loadStatusChanged?: boolean }
      toast.success(out?.loadStatusChanged ? "Confirmado. Carga marcada como entregada." : "Documento confirmado.")
      navigate("/revision")
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  function onConfirmClick() { validation.overall === "green" || !flags.length ? doConfirm() : setOverrideOpen(true) }
  async function onReject() {
    setBusy(true)
    try { await rejectDocument(id!, "Rechazado en revisión"); toast.success("Documento rechazado."); navigate("/revision") }
    catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
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
            <GuiaOverlay photoUrl={detail.photoUrl} boxes={boxes} activeField={activeField} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle>Campos extraídos</CardTitle>
            <Button size="sm" variant="secondary" onClick={onRead} disabled={reading}>
              <SparklesIcon className="size-4" /> {reading ? "Leyendo…" : "Leer con IA"}
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {flags.length > 0 && (
              <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-2">
                {flags.map((f, i) => <span key={i} className="text-xs text-amber-700">⚠ {f.message}</span>)}
              </div>
            )}

            {detail.verifyClauses.length > 0 && (
              <div className="flex flex-col gap-1 rounded-md border p-2">
                <p className="text-xs font-medium">Requisitos de firma/sello (pre-viaje):</p>
                {detail.verifyClauses.map((c: VerifyClauseCheck, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={c.present ? "text-green-700" : "text-red-700"}>{c.present ? "✓" : "✗"}</span>
                    <span>{c.title}</span>
                  </div>
                ))}
              </div>
            )}

            {FIELD_ORDER.map((k) => (
              <div key={k} className="flex flex-col gap-1"
                   onMouseEnter={() => setActiveField(k)} onMouseLeave={() => setActiveField(null)}>
                <Label className="flex items-center gap-2 capitalize">
                  {k.replace("_", " ")}
                  {extracted[k]?.source === "vlm" && <Badge variant="secondary">IA</Badge>}
                </Label>
                <Input value={values[k] ?? ""} onChange={(e) => setValues((s) => ({ ...s, [k]: e.target.value }))} />
              </div>
            ))}

            {overrideOpen ? (
              <div className="mt-2 flex flex-col gap-2 rounded-md border p-3">
                <p className="text-sm font-medium">Este documento tiene advertencias:</p>
                <ul className="flex flex-col gap-1 text-xs">
                  {flags.map((f, i) => <li key={i} className="text-amber-700">⚠ {f.message}</li>)}
                </ul>
                <p className="text-sm text-muted-foreground">¿Confirmar de todos modos?</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setOverrideOpen(false)} disabled={busy}>Cancelar</Button>
                  <Button onClick={doConfirm} disabled={busy}>Sí, confirmar</Button>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <Badge className="border-transparent bg-muted text-foreground">{validation.overall ?? "—"}</Badge>
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
