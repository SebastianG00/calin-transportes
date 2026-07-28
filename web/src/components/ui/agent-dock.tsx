import { useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react"
import { Sparkles, Send, X } from "lucide-react"

import { cn } from "@/lib/utils"

export function AgentDock({
  title,
  status,
  busy = false,
  placeholder = "Escribe tu pregunta…",
  onSubmit,
  children,
}: {
  title: string
  status: string
  busy?: boolean
  placeholder?: string
  onSubmit: (message: string) => void | Promise<void>
  children?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function openComposer() {
    setOpen(true)
    window.requestAnimationFrame(() => textareaRef.current?.focus())
  }
  async function submit() {
    if (busy) return
    const q = message.trim()
    if (!q) { openComposer(); return }
    setMessage("")
    await onSubmit(q)
  }
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (open) void submit(); else openComposer()
  }
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit() }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-4 right-4 z-50 flex w-[min(92vw,26rem)] flex-col gap-2"
    >
      {open && children ? (
        <div className="max-h-[60vh] overflow-y-auto rounded-2xl border bg-card p-2 shadow-lg">
          {children}
        </div>
      ) : null}
      <div className="flex flex-col-reverse overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-lg">
        <div className="flex items-center gap-3 p-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-none">{title}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{busy ? "Consultando…" : status}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {open ? (
              <button
                type="button" aria-label="Cerrar"
                onClick={() => setOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
              >
                <X className="size-4" />
              </button>
            ) : null}
            <button
              type="submit" disabled={busy}
              className="flex size-8 items-center justify-center rounded-lg text-primary hover:bg-accent disabled:opacity-50"
              aria-label={open ? "Enviar" : "Abrir asistente"}
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
        <div className={cn("overflow-hidden transition-[height] duration-300", open ? "h-28" : "h-0")}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Pregunta al asistente"
            className="h-full w-full resize-none bg-transparent px-3.5 pt-3.5 pb-2 text-sm leading-6 outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </form>
  )
}
