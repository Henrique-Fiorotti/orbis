"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { DashboardSettingsDialog } from "@/components/dashboard-settings-dialog"
import { DASHBOARD_AI_ASSISTANT_OPEN_EVENT } from "@/components/dashboard-ai-assistant"
import { GlobalSearch } from "@/components/GlobalSearch"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { AUTH_SESSION_UPDATED_EVENT, getAuthSessionUser } from "@/lib/auth-session"
import { getDashboardPermissions } from "@/lib/dashboard-permissions"
import { DASHBOARD_INTRODUCTION_MODAL_OPEN_EVENT } from "@/lib/introduction-modal.mjs"
import {
  AlertTriangleIcon,
  BotIcon,
  CircleHelpIcon,
  LayoutDashboardIcon,
  NfcIcon,
  SearchIcon,
  Settings2Icon,
  ShieldCheckIcon,
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
    {
      title: "Administradores",
      url: "/dashboard/admins",
      icon: <ShieldCheckIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Conversar com Orb",
      style: "text-muted-foreground dark:text-white!",
      url: "#",
      icon: <BotIcon className="dark:text-white" />,
    },
    {
      title: "Configurações",
      style: "text-muted-foreground dark:text-white!",
      url: "#",
      icon: <Settings2Icon className="dark:text-white" />,
    },
    {
      title: "Ajuda",
      style: "text-muted-foreground dark:text-white!",
      url: "#",
      icon: <CircleHelpIcon className="dark:text-white" />,
    },
    {
      title: "Pesquisar",
      style: "text-muted-foreground dark:text-white!",
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
    if (item.url === "/dashboard/admins") {
      return permissions.canViewAdmins
    }
    return true
  })
}

function getUserDataFromSession() {
  const usuario = getAuthSessionUser()

  return {
    name: usuario?.nome || "Orbis Admin",
    email: usuario?.email || "carregando...",
    avatar: usuario?.fotoPerfil || "/Orbis.svg"
  }
}

export function AppSidebar({ ...props }) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  const [navMainItems, setNavMainItems] = React.useState(() => getNavMainItems(getAuthSessionUser()))
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [userData, setUserData] = React.useState({
    name: "Orbis Admin",
    email: "carregando...",
    avatar: "/Orbis.svg",
  })

  const navSecondaryItems = React.useMemo(
    () =>
      data.navSecondary.map((item) =>
        item.title === "Conversar com Orb"
          ? {
              ...item,
              onClick: () => {
                window.dispatchEvent(
                  new CustomEvent(DASHBOARD_AI_ASSISTANT_OPEN_EVENT, {
                    detail: { fullscreen: true },
                  })
                )
              },
            }
          : item.title === "Configurações"
          ? {
              ...item,
              onClick: () => setSettingsOpen(true),
            }
          : item.title === "Ajuda"
          ? {
              ...item,
              onClick: () => {
                window.dispatchEvent(new CustomEvent(DASHBOARD_INTRODUCTION_MODAL_OPEN_EVENT))
              },
            }
          : item.title === "Pesquisar"
            ? {
                ...item,
                onClick: () => setSearchOpen(true),
              }
            : item
      ),
    []
  )

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

  React.useEffect(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [isMobile, pathname, setOpenMobile])

  return (
    <>
      <Sidebar tourId="tour-sidebar" collapsible="icon" {...props}>
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
          <NavMain items={navMainItems} pathname={pathname} />
          <NavDocuments items={data.documents} pathname={pathname} />
          <NavSecondary items={navSecondaryItems} className="mt-auto dark:text-white" />
        </SidebarContent>

        <SidebarFooter>
          <NavUser user={userData} pathname={pathname} />
        </SidebarFooter>
      </Sidebar>
      <DashboardSettingsDialog  open={settingsOpen} onOpenChange={setSettingsOpen} />
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
