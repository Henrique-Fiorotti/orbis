"use client"

import * as React from "react"

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
import { AUTH_SESSION_UPDATED_EVENT, getAuthSessionUser } from "@/lib/auth-session"
import { getDashboardPermissions } from "@/lib/dashboard-permissions"
import {
  AlertTriangleIcon,
  CircleHelpIcon,
  LayoutDashboardIcon,
  NfcIcon,
  SearchIcon,
  Settings2Icon,
  UsersIcon,
  WashingMachineIcon,
} from "lucide-react"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Maquinas",
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
      title: "Tecnicos",
      url: "/dashboard/tecnicos",
      icon: <UsersIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Configuracoes",
      style: "text-muted-foreground dark:text-white!",
      url: "#",
      icon: <Settings2Icon className="dark:text-white" />,
    },
    {
      title: "Ajuda",
      url: "#",
      icon: <CircleHelpIcon className="dark:text-white" />,
    },
    {
      title: "Pesquisar",
      url: "#",
      icon: <SearchIcon className="dark:text-white" />,
    },
  ],
  documents: [],
}

function getNavMainItems(usuario) {
  const permissions = getDashboardPermissions(usuario)

  return data.navMain.filter((item) => {
    if (item.url === "/dashboard/tecnicos") {
      return permissions.canViewTecnicos
    }

    return true
  })
}

function getUserDataFromSession() {
  const usuario = getAuthSessionUser()

  return {
    name: usuario?.nome || "Orbis Admin",
    email: usuario?.email || "carregando...",
    avatar: "/Orbis.svg",
  }
}

export function AppSidebar({ ...props }) {
  const [navMainItems, setNavMainItems] = React.useState(() => getNavMainItems(getAuthSessionUser()))
  const [userData, setUserData] = React.useState({
    name: "Orbis Admin",
    email: "carregando...",
    avatar: "/Orbis.svg",
  })

  React.useEffect(() => {
    function syncUserData() {
      const usuario = getAuthSessionUser()
      setUserData(getUserDataFromSession())
      setNavMainItems(getNavMainItems(usuario))
    }

    syncUserData()

    window.addEventListener("storage", syncUserData)
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, syncUserData)

    return () => {
      window.removeEventListener("storage", syncUserData)
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, syncUserData)
    }
  }, [])

  return (
    <Sidebar tourId="tour-sidebar" collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <img src="/Orbis.svg" alt="Orbis" className="size-9! dark:hidden" />
            <img src="/Orbis-dark.svg" alt="Orbis" className="hidden size-8.5! dark:block" />
            <span className="text-base font-semibold no-underline! font-poppins! text-black dark:text-white" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto dark:text-white" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
