import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { draftEmail, redraftEmail, saveEmail, type EmailRow } from "@/lib/email-actions"

export function SummaryEmailCard({ loadId }: { loadId: string }) {
  const [email, setEmail] = useState<EmailRow | null>(null)
  const [text, setText] = useState("")
  const [revise, setRevise] = useState("")
  const [busy, setBusy] = useState(false)

  async function onDraft() {
    setBusy(true)
    try {
      const e = await draftEmail(loadId)
      setEmail(e); setText(e.draft_text)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo redactar el correo.")
    } finally { setBusy(false) }
  }
  async function onRedraft() {
    if (!email || !revise.trim()) return
    setBusy(true)
    try {
      const e = await redraftEmail(email.id, revise)
      setEmail(e); setText(e.draft_text); setRevise("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo reescribir.")
    } finally { setBusy(false) }
  }
  async function onSave() {
    if (!email) return
    try {
      await saveEmail(email.id, text)
      toast.success("Correo guardado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.")
    }
  }
  async function onCopy() {
    await navigator.clipboard.writeText(text)
    toast.success("Copiado al portapapeles")
  }

  return (
    <Card>
      <CardHeader><CardTitle>Correo de entrega (borrador IA)</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!email ? (
          <Button onClick={onDraft} disabled={busy} className="w-fit">
            {busy ? "Redactando…" : "Redactar correo"}
          </Button>
        ) : (
          <>
            <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} />
            <div className="flex gap-2">
              <Input placeholder='Ajuste, p. ej. "más formal" o "acórtalo"' value={revise} onChange={(e) => setRevise(e.target.value)} />
              <Button variant="secondary" onClick={onRedraft} disabled={busy}>Reescribir</Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={onSave}>Guardar</Button>
              <Button variant="outline" onClick={onCopy}>Copiar</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
