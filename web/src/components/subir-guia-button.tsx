import { useRef, useState } from "react"
import { UploadIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { uploadGuia } from "@/lib/document-actions"

export function SubirGuiaButton({ loadId, onUploaded }: { loadId: string; onUploaded?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-picking the same file
    if (!file) return
    setBusy(true)
    try {
      const res = await uploadGuia(loadId, file)
      if (res.outcome === "created") toast.success("Guía subida. Está en Revisión.")
      else if (res.outcome === "duplicate") toast.info("Esta foto ya fue procesada.")
      else toast.warning(res.reason ?? "Foto de baja calidad, sube otra.")
      onUploaded?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally { setBusy(false) }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
      <Button variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        <UploadIcon className="size-4" /> Subir guía
      </Button>
    </>
  )
}
