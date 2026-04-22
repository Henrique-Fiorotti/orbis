"use client"

import * as React from "react"

import { getAuthSession, subscribeToAuthSessionChange } from "@/lib/auth-session"

export function useAuthSession() {
  const [session, setSession] = React.useState(() => getAuthSession())

  React.useEffect(() => {
    function syncSession() {
      setSession(getAuthSession())
    }

    syncSession()

    const unsubscribe = subscribeToAuthSessionChange(syncSession)
    window.addEventListener("focus", syncSession)

    return () => {
      unsubscribe()
      window.removeEventListener("focus", syncSession)
    }
  }, [])

  return session
}
