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
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, CameraIcon, FileTextIcon, Settings2Icon, CircleHelpIcon, SearchIcon, DatabaseIcon, FileChartColumnIcon, FileIcon, CommandIcon, WashingMachineIcon, AlertTriangleIcon, NfcIcon } from "lucide-react"

const data = {
  user: {
    name: "Orbis Admin",
    email: "orbis@gmail.com",
    avatar: "/Orbis.svg",
  },
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
],
  navClouds: [
    {
      title: "Capturar Imagem",
      icon: (
        <CameraIcon />
      ),
      isActive: true,
      url: "#",
      items: [
        {
          title: "Propostas Ativas",
          url: "#",
        },
        {
          title: "Arquivadas",
          url: "#",
        },
      ],
    },
    {
      title: "Propostas",
      icon: (
        <FileTextIcon />
      ),
      url: "#",
      items: [
        {
          title: "Propostas Ativas",
          url: "#",
        },
        {
          title: "Arquivadas",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: (
        <FileTextIcon />
      ),
      url: "#",
      items: [
        {
          title: "Propostas Ativas",
          url: "#",
        },
        {
          title: "Arquivadas",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
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
  ],
  documents: [
  ],
}

export function AppSidebar({
  ...props
}) {
  return (
    <Sidebar tourId="tour-sidebar" collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
                <img src="/Orbis.svg" alt="Orbis" className="size-9! dark:invert" />
                <span className="text-base font-semibold no-underline! font-poppins! text-black dark:text-white"></span>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto dark:text-white" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
