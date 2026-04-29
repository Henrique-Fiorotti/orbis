"use client"

import * as React from "react"

import { AUTH_SESSION_UPDATED_EVENT, getAuthSessionUser } from "@/lib/auth-session"
import { getDashboardPermissions } from "@/lib/dashboard-permissions"

export function useDashboardPermissions() {
  const [permissions, setPermissions] = React.useState(() =>
    getDashboardPermissions(getAuthSessionUser())
  )

  React.useEffect(() => {
    function syncPermissions() {
      setPermissions(getDashboardPermissions(getAuthSessionUser()))
    }

    function handleStorageChange(event) {
      if (event.key && event.key !== "orbis-auth-session") {
        return
      }

      syncPermissions()
    }

    syncPermissions()

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, syncPermissions)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, syncPermissions)
    }
  }, [])

  return permissions
}
