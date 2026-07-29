import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { InventoryItemSheet } from "@/components/inventory-item-sheet"
import { InventoryMovementSheet } from "@/components/inventory-movement-sheet"
import { InventoryHistorySheet } from "@/components/inventory-history-sheet"
import { useInventory } from "@/hooks/use-inventory"

export function InventarioPage() {
  const { items, loading, error, refetch } = useInventory()
  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Inventario</h1>
        <InventoryItemSheet onSaved={refetch} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">Cargando…</p> : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ítem</TableHead><TableHead>Categoría</TableHead>
                <TableHead>Stock</TableHead><TableHead>Mínimo</TableHead><TableHead>Unidad</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.nombre}</TableCell>
                  <TableCell>{it.categoria}</TableCell>
                  <TableCell>
                    {it.low
                      ? <Badge variant="outline" className="border-amber-500 text-amber-600 dark:border-amber-400/60 dark:text-amber-400">⚠ {it.stock}</Badge>
                      : it.stock}
                  </TableCell>
                  <TableCell>{it.stock_minimo}</TableCell>
                  <TableCell>{it.unidad_medida}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <InventoryMovementSheet itemId={it.id} itemNombre={it.nombre} tipo="entrada" onDone={refetch}
                        trigger={<Button size="sm" variant="outline">+ Entrada</Button>} />
                      <InventoryMovementSheet itemId={it.id} itemNombre={it.nombre} tipo="salida" onDone={refetch}
                        trigger={<Button size="sm" variant="outline">− Salida</Button>} />
                      <InventoryHistorySheet itemId={it.id} itemNombre={it.nombre}
                        trigger={<Button size="sm" variant="ghost">Historial</Button>} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sin ítems todavía.</TableCell></TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
