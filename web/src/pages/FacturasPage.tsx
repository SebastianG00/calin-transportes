import { ReceiptIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export function FacturasPage() {
  return (
    <div className="px-4 lg:px-6">
      <Card className="items-center py-16 text-center">
        <CardContent className="flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ReceiptIcon className="size-6" />
          </div>
          <h2 className="text-lg font-semibold">Facturas</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Exportación de datos de facturas y guías de remisión para el
            contador.
          </p>
          <Badge variant="outline" className="text-muted-foreground">
            Próximamente
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
