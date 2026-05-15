"use client"

import Link from "next/link"
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { CirclePlusIcon } from "lucide-react"

function isSidebarItemActive(pathname, url) {
  if (url === "/dashboard") {
    return pathname === "/dashboard"
  }

  return pathname === url || pathname?.startsWith(`${url}/`)
}

export function NavMain({ items, pathname }) {
  const permissions = useDashboardPermissions()
  const { isMobile, setOpenMobile } = useSidebar()

  function closeMobileSidebar() {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {permissions.canManageMaquinas ? (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                asChild
                tooltip="Adicionar"
                className="cursor-pointer transition-colors min-w-8 bg-primary text-primary-foreground duration-200 ease-out transform hover:bg-primary/90 hover:text-gray-600 active:translate-y-0 active:scale-95 active:bg-primary/90 active:text-primary-foreground"
              >
                <Link href="/dashboard/maquinas?action=new" onClick={closeMobileSidebar}>
                  <CirclePlusIcon />
                  <span>Adicionar</span>
                </Link>
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
  )
}
