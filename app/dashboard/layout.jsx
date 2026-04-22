"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Toaster } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { AlertasProvider } from "@/components/context/alertas-context"
import { MaquinasProvider } from "@/components/context/maquinas-context"
import { SensoresProvider } from "@/components/context/sensores-context"
import { TecnicosProvider } from "@/components/context/tecnicos-context"
import { getValidAuthSession, subscribeToAuthSessionChange } from "@/lib/auth-session"
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

    function handleSessionUpdate() {
      validateSession()
    }

    const unsubscribe = subscribeToAuthSessionChange(handleSessionUpdate)

    return () => {
      unsubscribe()
    }
  }, [router])

  if (authStatus !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-sm text-muted-foreground">
        Verificando sua sessao...
      </div>
    )
  }

  return (
    <MaquinasProvider>
      <SensoresProvider>
        <AlertasProvider>
          <TecnicosProvider>
            <TooltipProvider>
              <SidebarProvider
                style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)",  }}>
                <AppSidebar variant="inset" />
                <SidebarInset>
                  <SmoothScroll>
                    <TooltipProvider>{children}</TooltipProvider>
                    </SmoothScroll>
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
