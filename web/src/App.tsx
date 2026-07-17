import { createBrowserRouter, RouterProvider } from "react-router-dom"

import { RequireAuth } from "@/components/require-auth"
import { SessionProvider } from "@/lib/auth"
import { AppLayout } from "@/layouts/AppLayout"
import { BoardPage } from "@/pages/BoardPage"
import { CalendarioPage } from "@/pages/CalendarioPage"
import { ClientesPage } from "@/pages/ClientesPage"
import { ConductorDetailPage } from "@/pages/ConductorDetailPage"
import { ConductoresPage } from "@/pages/ConductoresPage"
import { FacturasPage } from "@/pages/FacturasPage"
import { InventarioPage } from "@/pages/InventarioPage"
import { LoadDetailPage } from "@/pages/LoadDetailPage"
import { LoginPage } from "@/pages/LoginPage"
import { MapaPage } from "@/pages/MapaPage"
import { TareasPage } from "@/pages/TareasPage"
import { UnidadDetailPage } from "@/pages/UnidadDetailPage"
import { UnidadesPage } from "@/pages/UnidadesPage"

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <BoardPage /> },
          { path: "cargas/:id", element: <LoadDetailPage /> },
          { path: "conductores", element: <ConductoresPage /> },
          { path: "conductores/:id", element: <ConductorDetailPage /> },
          { path: "mapa", element: <MapaPage /> },
          { path: "unidades", element: <UnidadesPage /> },
          { path: "unidades/:id", element: <UnidadDetailPage /> },
          { path: "clientes", element: <ClientesPage /> },
          { path: "calendario", element: <CalendarioPage /> },
          { path: "tareas", element: <TareasPage /> },
          { path: "inventario", element: <InventarioPage /> },
          { path: "facturas", element: <FacturasPage /> },
        ],
      },
    ],
  },
])

function App() {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  )
}

export default App
