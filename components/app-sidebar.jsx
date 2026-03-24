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
import { LayoutDashboardIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, CameraIcon, FileTextIcon, Settings2Icon, CircleHelpIcon, SearchIcon, DatabaseIcon, FileChartColumnIcon, FileIcon, CommandIcon } from "lucide-react"

const data = {
  user: {
    name: "Orbis Admin",
    email: "orbis@gmail.com",
    avatar: "/Orbis.svg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: (
        <LayoutDashboardIcon />
      ),
    },
    {
      title: "Tabelas",
      url: "#",
      icon: (
        <ListIcon />
      ),
    },
    {
      title: "Analiticas",
      url: "#",
      icon: (
        <ChartBarIcon />
      ),
    },
    {
      title: "Projetos",
      url: "#",
      icon: (
        <FolderIcon />
      ),
    },
    {
      title: "Equipe",
      url: "#",
      icon: (
        <UsersIcon />
      ),
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
      url: "#",
      icon: (
        <Settings2Icon />
      ),
    },
    {
      title: "Ajuda",
      url: "#",
      icon: (
        <CircleHelpIcon />
      ),
    },
    {
      title: "Pesquisar",
      url: "#",
      icon: (
        <SearchIcon />
      ),
    },
  ],
  documents: [
    {
      name: "Biblioteca de Dados",
      url: "#",
      icon: (
        <DatabaseIcon />
      ),
    },
    {
      name: "Reports",
      url: "#",
      icon: (
        <FileChartColumnIcon />
      ),
    },
    {
      name: "Assistente de Prompt",
      url: "#",
      icon: (
        <FileIcon />
      ),
    },
  ],
}

export function AppSidebar({
  ...props
}) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
                <img src="/Orbis.svg" alt="Orbis" className="size-9!" />
                <span className="text-base font-semibold no-underline! font-poppins! text-black"></span>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
