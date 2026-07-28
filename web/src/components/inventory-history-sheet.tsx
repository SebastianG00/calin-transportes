import { useEffect, useState } from "react"

import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { listMovements } from "@/lib/inventory-actions"
import type { Movement } from "@/lib/inventory"

export function InventoryHistorySheet({ itemId, itemNombre, trigger }: {
  itemId: string; itemNombre: string; trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [moves, setMoves] = useState<Movement[]>([])
  useEffect(() => {
    if (open) listMovements(itemId).then(setMoves).catch(() => setMoves([]))
  }, [open, itemId])
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent>
        <SheetHeader><SheetTitle>Movimientos — {itemNombre}</SheetTitle></SheetHeader>
        <div className="overflow-x-auto p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead><TableHead>Tipo</TableHead>
                <TableHead>Cant.</TableHead><TableHead>Unidad</TableHead><TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {moves.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.fecha}</TableCell>
                  <TableCell>{m.tipo}</TableCell>
                  <TableCell>{m.cantidad}</TableCell>
                  <TableCell>{m.unit?.plate ?? "—"}</TableCell>
                  <TableCell>{m.motivo ?? "—"}</TableCell>
                </TableRow>
              ))}
              {moves.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin movimientos.</TableCell></TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  )
}
