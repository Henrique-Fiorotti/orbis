"use client"

import Link from "next/link"
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CirclePlusIcon } from "lucide-react"

export function NavMain({ items }) {
  const permissions = useDashboardPermissions()

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
                <Link href="/dashboard/maquinas?action=new">
                  <CirclePlusIcon />
                  <span>Adicionar</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
              >
                <Link href={item.url}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
