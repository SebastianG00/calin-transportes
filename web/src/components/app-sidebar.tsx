import * as React from "react"
import { NavLink } from "react-router-dom"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  MapIcon,
  UsersIcon,
  TruckIcon,
  Building2Icon,
  Calendar,
  ListChecks,
  PackageIcon,
  ReceiptIcon,
  FileCheckIcon,
} from "lucide-react"

const data = {
  user: {
    name: "María O.",
    email: "oficina@kalin.pe",
    avatar: "",
  },
  navMain: [
    {
      title: "Tablero",
      url: "/",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Mapa",
      url: "/mapa",
      icon: <MapIcon />,
    },
    {
      title: "Conductores",
      url: "/conductores",
      icon: <UsersIcon />,
    },
    {
      title: "Unidades",
      url: "/unidades",
      icon: <TruckIcon />,
    },
    {
      title: "Clientes",
      url: "/clientes",
      icon: <Building2Icon />,
    },
    {
      title: "Revisión",
      url: "/revision",
      icon: <FileCheckIcon />,
    },
    {
      title: "Calendario",
      url: "/calendario",
      icon: <Calendar />,
    },
    {
      title: "Tareas",
      url: "/tareas",
      icon: <ListChecks />,
    },
    {
      title: "Inventario",
      url: "/inventario",
      icon: <PackageIcon />,
      badge: "pronto",
    },
    {
      title: "Facturas",
      url: "/facturas",
      icon: <ReceiptIcon />,
    },
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<NavLink to="/" />}
            >
              <TruckIcon className="size-5!" />
              <span className="text-base font-semibold">
                Transportes Kalin
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
