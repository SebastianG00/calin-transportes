import { matchPath, useLocation } from "react-router-dom"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const routeTitles: { pattern: string; title: string }[] = [
  { pattern: "/", title: "Tablero de cargas" },
  { pattern: "/cargas/:id", title: "Carga" },
  { pattern: "/conductores", title: "Conductores" },
  { pattern: "/unidades", title: "Unidades" },
  { pattern: "/clientes", title: "Clientes" },
  { pattern: "/calendario", title: "Calendario" },
  { pattern: "/tareas", title: "Tareas" },
  { pattern: "/inventario", title: "Inventario" },
  { pattern: "/facturas", title: "Facturas" },
]

function getTitle(pathname: string) {
  const match = routeTitles.find((route) =>
    matchPath({ path: route.pattern, end: true }, pathname)
  )
  return match?.title ?? "Transportes Kalin"
}

export function SiteHeader() {
  const location = useLocation()
  const title = getTitle(location.pathname)

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  )
}
