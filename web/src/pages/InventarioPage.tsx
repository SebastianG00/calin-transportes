import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { InventoryItemSheet } from "@/components/inventory-item-sheet"
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.nombre}</TableCell>
                  <TableCell>{it.categoria}</TableCell>
                  <TableCell>
                    {it.low
                      ? <Badge variant="outline" className="border-amber-500 text-amber-600">⚠ {it.stock}</Badge>
                      : it.stock}
                  </TableCell>
                  <TableCell>{it.stock_minimo}</TableCell>
                  <TableCell>{it.unidad_medida}</TableCell>
                </TableRow>
              ))}
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin ítems todavía.</TableCell></TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
