import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { useLoads } from "@/hooks/use-loads"

export function BoardPage() {
  const { loads, metrics, loading, error } = useLoads()

  if (error) {
    return (
      <div className="px-6 py-10 text-sm text-red-600 dark:text-red-400">
        No se pudieron cargar las cargas: {error}
      </div>
    )
  }

  return (
    <>
      <SectionCards metrics={metrics} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      {loading ? (
        <div className="px-6 py-10 text-sm text-muted-foreground">
          Cargando cargas…
        </div>
      ) : (
        <DataTable loads={loads} />
      )}
    </>
  )
}
