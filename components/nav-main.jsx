"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions"
import { AUTH_SESSION_UPDATED_EVENT, getAuthSessionUser } from "@/lib/auth-session"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { CirclePlusIcon, NfcIcon, ShieldCheckIcon, UsersIcon, WashingMachineIcon } from "lucide-react"
import * as React from "react"

function isSidebarItemActive(pathname, url) {
  if (url === "/dashboard") {
    return pathname === "/dashboard"
  }

  return pathname === url || pathname?.startsWith(`${url}/`)
}

function getShortName(name) {
  return String(name ?? "").trim().split(/\s+/)[0] ?? ""
}

export function NavMain({ items, pathname }) {
  const router = useRouter()
  const permissions = useDashboardPermissions()
  const { isMobile, setOpenMobile } = useSidebar()
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [userName, setUserName] = React.useState(() => getAuthSessionUser()?.nome || "")

  const createOptions = [
    permissions.canManageMaquinas
      ? {
          title: "Máquina",
          description: "Cadastrar um novo equipamento monitorado.",
          href: "/dashboard/maquinas?action=new",
          Icon: WashingMachineIcon,
        }
      : null,
    permissions.canManageSensores
      ? {
          title: "Sensor",
          description: "Adicionar um sensor e vincular a uma máquina.",
          href: "/dashboard/sensores?action=new",
          Icon: NfcIcon,
        }
      : null,
    permissions.canManageTecnicos
      ? {
          title: "Técnico",
          description: "Criar um usuário técnico para atendimento.",
          href: "/dashboard/tecnicos?action=new",
          Icon: UsersIcon,
        }
      : null,
    permissions.canManageAdmins
      ? {
          title: "Administrador",
          description: "Cadastrar um administrador do sistema.",
          href: "/dashboard/admins?action=new",
          Icon: ShieldCheckIcon,
        }
      : null,
  ].filter(Boolean)

  function closeMobileSidebar() {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  function openCreateDialog() {
    setCreateDialogOpen(true)
    closeMobileSidebar()
  }

  function goToCreateFlow(href) {
    setCreateDialogOpen(false)
    closeMobileSidebar()
    router.push(href)
  }

  React.useEffect(() => {
    function syncUserName() {
      setUserName(getAuthSessionUser()?.nome || "")
    }

    syncUserName()

    window.addEventListener("storage", syncUserName)
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, syncUserName)

    return () => {
      window.removeEventListener("storage", syncUserName)
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, syncUserName)
    }
  }, [])

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          {createOptions.length > 0 ? (
            <SidebarMenu>
              <SidebarMenuItem className="flex items-center gap-2">
                <SidebarMenuButton
                  type="button"
                  tooltip="Adicionar"
                  className="cursor-pointer transition-colors min-w-8 bg-primary text-primary-foreground duration-200 ease-out transform hover:bg-primary/90 hover:text-gray-600 active:translate-y-0 active:scale-95 active:bg-primary/90 active:text-primary-foreground"
                  onClick={openCreateDialog}
                >
                  <CirclePlusIcon />
                  <span>Adicionar</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          ) : null}
          <SidebarMenu>
            {items.map((item) => {
              const active = isSidebarItemActive(pathname, item.url)

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={active}
                  >
                    <Link href={item.url} onClick={closeMobileSidebar} aria-current={active ? "page" : undefined}>
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="flex flex-row items-center gap-2">
            <CirclePlusIcon className="size-5 shrink-0" />
            <DialogTitle className="flex flex-wrap items-center gap-x-1.5 text-[22px]">
              <span>O que você deseja</span>
              <span className="text-[#5E17EB]">adicionar,</span>
              <span>{userName ? `${getShortName(userName)}?` : "?"}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {createOptions.map(({ title, description, href, Icon }) => (
              <button
                key={href}
                type="button"
                className="group flex min-h-[112px] cursor-pointer flex-col items-start gap-3 rounded-lg border bg-card p-4 text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#5E17EB] hover:bg-[#5E17EB]/10 hover:shadow-lg hover:shadow-[#5E17EB]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E17EB]/40 dark:border-gray-700! dark:bg-[#0F172A] dark:hover:border-[#8B5CF6] dark:hover:bg-[#5E17EB]/15"
                onClick={() => goToCreateFlow(href)}
              >
                <span className="inline-flex size-9 items-center justify-center rounded-lg border border-[#5E17EB]/20 bg-[#5E17EB]/10 text-[#5E17EB] transition-colors duration-200 group-hover:border-[#5E17EB] group-hover:bg-[#5E17EB] group-hover:text-white dark:border-[#5E17EB]/40 dark:bg-[#5E17EB]/20 dark:text-purple-200">
                  <Icon className="size-4 transition-transform duration-200 group-hover:scale-110" />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[#3B2867] transition-colors duration-200 group-hover:text-[#5E17EB] dark:text-white dark:group-hover:text-[#C5A3FF]">{title}</span>
                  <span className="text-xs leading-relaxed text-muted-foreground">{description}</span>
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
