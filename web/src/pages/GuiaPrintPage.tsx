import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { fetchGuia, type GuiaRow } from "@/lib/guia-actions"

export function GuiaPrintPage() {
  const { id } = useParams()
  const [guia, setGuia] = useState<GuiaRow | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchGuia(id).then(setGuia).catch((e) => setError(e.message ?? "No se pudo cargar la guía."))
  }, [id])

  if (error) return <div style={{ padding: 24, color: "#b91c1c" }}>{error}</div>
  if (!guia) return <div style={{ padding: 24 }}>Cargando guía…</div>

  return (
    <div className="guia-print" style={{ maxWidth: 780, margin: "0 auto", padding: 24, color: "#111", background: "#fff" }}>
      <style>{`
        @media print { .guia-print button { display: none; } }
        .guia-print h1 { font-size: 20px; margin: 0 0 4px; }
        .guia-print h2 { font-size: 15px; margin: 16px 0 6px; }
        .guia-print h3 { font-size: 13px; margin: 10px 0 4px; }
        .guia-print table.datos td, .guia-print table.firma-tabla td { padding: 4px 8px; border: 1px solid #ddd; font-size: 13px; }
        .guia-print table { border-collapse: collapse; width: 100%; }
        .guia-print .linea { min-width: 220px; }
        .guia-print .firma-espacio { height: 56px; }
        .guia-print ul { margin: 4px 0 4px 18px; font-size: 13px; }
      `}</style>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => window.print()}>Imprimir / Guardar PDF</button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: guia.html }} />
    </div>
  )
}
