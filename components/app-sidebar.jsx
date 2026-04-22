"use client"

import * as React from "react"

import { useAuthSession } from "@/hooks/use-auth-session"
import { formatRoleLabel } from "@/lib/user-models"
import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, Settings2Icon, CircleHelpIcon, SearchIcon, WashingMachineIcon, AlertTriangleIcon, NfcIcon, UsersIcon } from "lucide-react"

const NAV_MAIN_ITEMS = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Máquinas",
    url: "/dashboard/maquinas",
    icon: <WashingMachineIcon />,
  },
  {
    title: "Sensores",
    url: "/dashboard/sensores",
    icon: <NfcIcon />,
  },
  {
    title: "Alertas",
    url: "/dashboard/alertas",
    icon: <AlertTriangleIcon />,
  },
  {
    title: "Técnicos",
    url: "/dashboard/tecnicos",
    icon: <UsersIcon />,
  },
]

const NAV_SECONDARY_ITEMS = [
    {
      title: "Configurações",
      style: "text-muted-foreground dark:text-white!",
      url: "#",
      icon: (
        <Settings2Icon className="dark:text-white" />
      ),
    },
    {
      title: "Ajuda",
      url: "#",
      icon: (
        <CircleHelpIcon className="dark:text-white" />
      ),
    },
    {
      title: "Pesquisar",
      url: "#",
      icon: (
        <SearchIcon className="dark:text-white" />
      ),
    },
]

export function AppSidebar({
  ...props
}) {
  const session = useAuthSession()
  const isAdmin = session?.role === "ADMIN"
  const userData = {
    name: session?.usuario?.nome || "Usuario Orbis",
    email: session?.usuario?.email || "carregando...",
    avatar: session?.usuario?.foto || "/Orbis.svg",
    roleLabel: session?.role ? formatRoleLabel(session.role) : "",
  }
  const navMainItems = React.useMemo(
    () => NAV_MAIN_ITEMS.filter((item) => (item.url === "/dashboard/tecnicos" ? isAdmin : true)),
    [isAdmin]
  )

  return (
    <Sidebar tourId="tour-sidebar" collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
                <img src="/Orbis.svg" alt="Orbis" className="size-9! dark:hidden" />
                <img src="/Orbis-dark.svg" alt="Orbis" className="hidden size-8.5! dark:block" />
                <span className="text-base font-semibold no-underline! font-poppins! text-black dark:text-white"></span>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
        <NavDocuments items={[]} />
        <NavSecondary items={NAV_SECONDARY_ITEMS} className="mt-auto dark:text-white" />
      </SidebarContent>
      <SidebarFooter>
          <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
