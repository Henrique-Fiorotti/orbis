// @ts-check

"use client"

import { Toaster } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { AlertasProvider } from "@/components/context/alertas-context"
import { MaquinasProvider } from "@/components/context/maquinas-context"
import { SensoresProvider } from "@/components/context/sensores-context"
import { TecnicosProvider } from "@/components/context/tecnicos-context"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

/** @typedef {import("@/lib/orbis-types").DashboardLayoutProps} DashboardLayoutProps */

/**
 * @param {DashboardLayoutProps} props
 */
export default function DashboardLayout({ children }) {
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
                }}
              >
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
