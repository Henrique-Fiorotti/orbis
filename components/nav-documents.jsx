"use client"

import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { MoreHorizontalIcon, FolderIcon, ShareIcon, Trash2Icon, FileTextIcon } from "lucide-react"

function isSidebarItemActive(pathname, url) {
  return pathname === url || pathname?.startsWith(`${url}/`)
}

export function NavDocuments({
  items,
  pathname,
}) {
  const { isMobile, setOpenMobile } = useSidebar()

  function closeMobileSidebar() {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Documentos</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const active = isSidebarItemActive(pathname, item.url)

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild tooltip={item.name} isActive={active}>
                <Link
                  className="no-underline! text-black dark:text-white"
                  href={item.url}
                  onClick={closeMobileSidebar}
                  aria-current={active ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover className="rounded-sm data-[state=open]:bg-accent">
                  <MoreHorizontalIcon />
                  <span className="sr-only">Mais</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-24 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}>
                <DropdownMenuItem>
                  <FolderIcon />
                  <span>Abrir</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ShareIcon />
                  <span>Compartilhar</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <Trash2Icon />
                  <span>Deletar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </SidebarMenuItem>
          )
        })}
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip="Relatório"
            className="text-sidebar-foreground/70"
            isActive={isSidebarItemActive(pathname, "/dashboard/relatorios")}
          >
            <Link
              className={`no-underline! ${isSidebarItemActive(pathname, "/dashboard/relatorios") ? "text-[#5F18EA]! dark:text-[#C5A3FF]!" : "text-black dark:text-white"}`}
              href="/dashboard/relatorios"
              onClick={closeMobileSidebar}
              aria-current={isSidebarItemActive(pathname, "/dashboard/relatorios") ? "page" : undefined}
            >
              <FileTextIcon className={isSidebarItemActive(pathname, "/dashboard/relatorios") ? "text-[#5F18EA]! dark:text-[#C5A3FF]!" : "text-sidebar-foreground/70"} />
              <span>Relatório</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
