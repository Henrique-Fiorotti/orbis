"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Toaster } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { AdminsProvider } from "@/components/context/admins-context"
import { AlertasProvider } from "@/components/context/alertas-context"
import { DashboardAiAssistant } from "@/components/dashboard-ai-assistant"
import { DashboardIntroductionModal } from "@/components/dashboard-introduction-modal"
import { DashboardAuthSkeleton } from "@/components/dashboard-skeletons"
import { DashboardPreferencesProvider } from "@/components/context/dashboard-preferences-context"
import { DashboardRealtimeProvider } from "@/components/context/dashboard-realtime-context"
import { MaquinasProvider } from "@/components/context/maquinas-context"
import { SensoresProvider } from "@/components/context/sensores-context"
import { TecnicosProvider } from "@/components/context/tecnicos-context"
import { getValidAuthSession } from "@/lib/auth-session"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import SmoothScroll from "@/components/SmootScroll"

/** @typedef {import("@/lib/orbis-types").DashboardLayoutProps} DashboardLayoutProps */

/**
 * @param {DashboardLayoutProps} props
 */
export default function DashboardLayout({ children }) {
  const router = useRouter()
  const [authStatus, setAuthStatus] = React.useState("checking")

  React.useEffect(() => {
    function validateSession() {
      const session = getValidAuthSession()

      if (!session) {
        setAuthStatus("redirecting")
        router.replace("/")
        return
      }

      setAuthStatus("authenticated")
    }

    validateSession()

    function handleStorageChange(event) {
      if (event.key && event.key !== "orbis-auth-session") {
        return
      }

      validateSession()
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [router])

  if (authStatus !== "authenticated") {
    return <DashboardAuthSkeleton />
  }

  return (
    <DashboardRealtimeProvider>
      <MaquinasProvider>
        <SensoresProvider>
          <AlertasProvider>
            <AdminsProvider>
              <TecnicosProvider>
                <DashboardPreferencesProvider>
                  <TooltipProvider>
                    <SidebarProvider
                      style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)",  }}>
                      <AppSidebar variant="inset" />
                      <SidebarInset>
                        <SmoothScroll>
                          {children}
                        </SmoothScroll>
                      <Toaster position="top-left" />
                    </SidebarInset>
                    <DashboardAiAssistant />
                    <DashboardIntroductionModal />
                  </SidebarProvider>
                  </TooltipProvider>
                </DashboardPreferencesProvider>
              </TecnicosProvider>
            </AdminsProvider>
          </AlertasProvider>
        </SensoresProvider>
      </MaquinasProvider>
    </DashboardRealtimeProvider>
  )
}
