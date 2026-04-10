'use client' // ← adiciona isso no topo

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { MaquinasProvider } from "@/components/context/maquinas-context"
import { SensoresProvider } from "@/components/context/sensores-context"
import { AlertasProvider } from "@/components/context/alertas-context"
import { TecnicosProvider } from "@/components/context/tecnicos-context"
import { Toaster } from "sonner"

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  return (
    <MaquinasProvider>
      <SensoresProvider>
        <AlertasProvider>
          <TecnicosProvider>
            <TooltipProvider>
              <SidebarProvider
                style={{
                  "--sidebar-width": "calc(var(--spacing) * 72)",
                  "--header-height": "calc(var(--spacing) * 12)",
                }}>
                <AppSidebar variant="inset" />
                <SidebarInset>
                  <TooltipProvider>{children}</TooltipProvider>
                  <Toaster position="top-left" />
                </SidebarInset>
              </SidebarProvider>
            </TooltipProvider>
          </TecnicosProvider>
        </AlertasProvider>
      </SensoresProvider>
    </MaquinasProvider>
  )
}