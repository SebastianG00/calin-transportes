import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useClientDetail } from "@/hooks/use-client-detail"
import { updateClient } from "@/lib/client-actions"
import { useClauses } from "@/hooks/use-clauses"
import { createClause, deleteClause, type ClauseBucket } from "@/lib/clause-actions"

const BUCKET_LABEL: Record<ClauseBucket, string> = {
  reconcile: "Reconciliar (datos)",
  verify: "Verificar (foto)",
  attest: "Atestiguar (checklist)",
}

export function ClienteDetailPage() {
  const { id } = useParams()
  const { client, loading, error, refetch } = useClientDetail(id)
  const clauses = useClauses(id)

  const [form, setForm] = useState({ contact_name: "", contact_phone: "", contact_email: "" })
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (client) setForm({
      contact_name: client.contact_name ?? "",
      contact_phone: client.contact_phone ?? "",
      contact_email: client.contact_email ?? "",
    })
  }, [client])

  const [newClause, setNewClause] = useState<{ title: string; body: string; bucket: ClauseBucket }>({
    title: "", body: "", bucket: "attest",
  })
  const [adding, setAdding] = useState(false)

  if (loading) return <div className="px-6 py-10 text-sm text-muted-foreground">Cargando cliente…</div>
  if (error || !client) {
    return (
      <div className="flex flex-col gap-3 px-6 py-10">
        <Link to="/clientes" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" /> Volver a clientes
        </Link>
        <p className="text-sm text-red-600">{error ?? "Cliente no encontrado."}</p>
      </div>
    )
  }

  async function saveContact() {
    if (!id) return
    setSaving(true)
    try {
      await updateClient(id, {
        contact_name: form.contact_name || null,
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
      })
      toast.success("Contacto actualizado")
      refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar.")
    } finally {
      setSaving(false)
    }
  }

  async function addClause() {
    if (!id || !newClause.title.trim() || !newClause.body.trim()) return
    setAdding(true)
    try {
      await createClause({ client_id: id, ...newClause, source: "human" })
      setNewClause({ title: "", body: "", bucket: "attest" })
      toast.success("Cláusula agregada")
      clauses.refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo agregar.")
    } finally {
      setAdding(false)
    }
  }

  async function removeClause(clauseId: string) {
    try {
      await deleteClause(clauseId)
      clauses.refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar.")
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 lg:px-6">
      <Link to="/clientes" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Volver a clientes
      </Link>
      <div>
        <h1 className="text-xl font-semibold">{client.name}</h1>
        <p className="text-sm text-muted-foreground">RUC {client.ruc}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Contacto</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cn">Nombre</Label>
            <Input id="cn" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cp">Teléfono</Label>
            <Input id="cp" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ce">Email</Label>
            <Input id="ce" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          </div>
          <div className="sm:col-span-3">
            <Button onClick={saveContact} disabled={saving}>{saving ? "Guardando…" : "Guardar contacto"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Requisitos (cláusulas)</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          {clauses.loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : clauses.clauses.length ? (
            <ul className="flex flex-col gap-2">
              {clauses.clauses.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.title}</span>
                      <Badge variant="outline">{BUCKET_LABEL[c.bucket]}</Badge>
                      {c.source === "ai" && <Badge variant="secondary">IA</Badge>}
                      {c.client_id === null && <Badge variant="outline">global</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
                  </div>
                  {c.client_id !== null && (
                    <Button variant="ghost" size="sm" onClick={() => removeClause(c.id)}>Quitar</Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Sin cláusulas todavía.</p>
          )}

          <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_180px]">
            <div className="flex flex-col gap-2">
              <Input placeholder="Título" value={newClause.title} onChange={(e) => setNewClause({ ...newClause, title: e.target.value })} />
              <Textarea placeholder="Texto de la cláusula" value={newClause.body} onChange={(e) => setNewClause({ ...newClause, body: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Select value={newClause.bucket} onValueChange={(v) => setNewClause({ ...newClause, bucket: v as ClauseBucket })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reconcile">Reconciliar (datos)</SelectItem>
                  <SelectItem value="verify">Verificar (foto)</SelectItem>
                  <SelectItem value="attest">Atestiguar (checklist)</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addClause} disabled={adding}>{adding ? "Agregando…" : "Agregar cláusula"}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
