import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { draftWhatsapp, type WhatsappIntent } from "@/lib/whatsapp-actions"

const INTENTS: { value: WhatsappIntent; label: string }[] = [
  { value: "recordar_confirmacion", label: "Recordar confirmación" },
  { value: "pedir_foto_entrega", label: "Pedir foto de entrega" },
  { value: "aviso_reasignacion", label: "Aviso de reasignación" },
  { value: "personalizado", label: "Personalizado" },
]

export function WhatsappDraftCard({ loadId }: { loadId: string }) {
  const [intent, setIntent] = useState<WhatsappIntent>("recordar_confirmacion")
  const [instruction, setInstruction] = useState("")
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)

  async function onDraft() {
    setBusy(true)
    try {
      const { draft } = await draftWhatsapp(loadId, {
        intent,
        instruction: instruction.trim() || undefined,
      })
      setText(draft)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo redactar el mensaje.")
    } finally { setBusy(false) }
  }
  async function onCopy() {
    await navigator.clipboard.writeText(text)
    toast.success("Copiado al portapapeles")
  }

  return (
    <Card>
      <CardHeader><CardTitle>WhatsApp con IA (borrador)</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={intent} onValueChange={(v) => setIntent(v as WhatsappIntent)} items={INTENTS}>
            <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              {INTENTS.map((i) => (
                <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder='Instrucción opcional, p. ej. "más formal" o "acórtalo"'
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
          />
          <Button onClick={onDraft} disabled={busy} className="w-fit">
            {busy ? "Redactando…" : "Redactar"}
          </Button>
        </div>
        {text && (
          <>
            <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} />
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onCopy}>Copiar</Button>
              <span className="text-muted-foreground text-xs">
                Borrador — no se envía automáticamente.
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
