import { useState } from "react"
import { toast } from "sonner"

import { AgentDock } from "@/components/ui/agent-dock"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { askAssistant, type AssistantAnswer } from "@/lib/assistant-actions"

type QA = { question: string; result: AssistantAnswer }

export function AssistantDock() {
  const [history, setHistory] = useState<QA[]>([])
  const [busy, setBusy] = useState(false)

  async function onSubmit(question: string) {
    setBusy(true)
    try {
      const result = await askAssistant(question)
      setHistory((h) => [...h, { question, result }])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo consultar.")
    } finally { setBusy(false) }
  }

  return (
    <AgentDock title="Asistente IA" status="Pregunta sobre tus datos" busy={busy} onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        {history.map((qa, i) => (
          <div key={i} className="rounded-xl border bg-background p-2 text-sm">
            <p className="text-muted-foreground">{qa.question}</p>
            <p className="mt-1 font-medium">{qa.result.answer}</p>
            {qa.result.table && qa.result.table.rows.length > 0 ? (
              <div className="mt-2 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {qa.result.table.columns.map((c) => <TableHead key={c}>{c}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qa.result.table.rows.map((row, r) => (
                      <TableRow key={r}>
                        {row.map((cell, c) => <TableCell key={c}>{cell ?? "—"}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </AgentDock>
  )
}
