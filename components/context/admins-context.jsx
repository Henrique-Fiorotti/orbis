"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { useDashboardBootstrap, useIsDashboardHome } from "@/components/context/dashboard-bootstrap-context"
import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import { getDashboardPermissions } from "@/lib/dashboard-permissions"
import {
  fetchDashboardJson,
  getHttpErrorStatus,
  normalizeAdminCollection,
} from "@/lib/dashboard-api"

const AdminsContext = React.createContext(null)

export function AdminsProvider({ children }) {
  const pathname = usePathname()
  const isDashboardHome = useIsDashboardHome(pathname)
  const dashboardBootstrap = useDashboardBootstrap()
  const [admins, setAdmins] = React.useState([])
  const [status, setStatus] = React.useState("loading")
  const [mensagem, setMensagem] = React.useState("Carregando administradores...")
  const [totalPaginas, setTotalPaginas] = React.useState(0)
  const [paginaAtual, setPaginaAtual] = React.useState(1)
  const [dataSource, setDataSource] = React.useState("idle")

  const carregarAdmins = React.useCallback(async ({ silent = false, page = 1, limit = 100 } = {}) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      setAdmins([])
      setTotalPaginas(0)
      setPaginaAtual(1)
      setStatus("error")
      setMensagem("Faça login para carregar os administradores.")
      return
    }

    const permissions = getDashboardPermissions(session.usuario)

    if (!permissions.canViewAdmins) {
      setAdmins([])
      setTotalPaginas(0)
      setPaginaAtual(1)
      setStatus("success")
      setMensagem("")
      return
    }

    if (!silent) {
      setStatus("loading")
      setMensagem("Carregando administradores...")
    }

    try {
      const payload = await fetchDashboardJson(`/usuarios/?page=${page}&limit=${limit}`, session.accessToken, "os administradores")
      const normalizedAdmins = normalizeAdminCollection(payload)
      const totalAdmins = normalizedAdmins.length

      setAdmins(normalizedAdmins)
      setTotalPaginas(
        payload?.totalPages && totalAdmins > 0
          ? payload.totalPages
          : Math.max(Math.ceil(totalAdmins / limit), totalAdmins ? 1 : 0)
      )
      setPaginaAtual(page)
      setStatus("success")
      setMensagem("")
      setDataSource("full")
    } catch (error) {
      const statusCode = getHttpErrorStatus(error)

      if (statusCode === 401) {
        clearAuthSession()
      }

      setStatus("error")
      setMensagem(error instanceof Error ? error.message : "Não foi possível carregar os administradores.")
      setAdmins((current) => (silent ? current : []))
      throw error
    }
  }, [])

  React.useEffect(() => {
    if (isDashboardHome && dashboardBootstrap.status === "loading") {
      setStatus("loading")
      setMensagem("Carregando administradores...")
      return
    }

    if (isDashboardHome && dashboardBootstrap.status === "success") {
      setAdmins([])
      setTotalPaginas(0)
      setPaginaAtual(1)
      setStatus("success")
      setMensagem("")
      setDataSource("bootstrap")
      return
    }

    if (!isDashboardHome && dataSource === "full") {
      return
    }

    carregarAdmins().catch(() => {})
  }, [carregarAdmins, dashboardBootstrap.status, dataSource, isDashboardHome])

  const recarregarAdmins = React.useCallback(async (page = 1, limit = 100) => {
    await carregarAdmins({ page, limit })
  }, [carregarAdmins])

  const resetarDados = React.useCallback(async () => {
    await carregarAdmins({ page: 1, limit: 100 })
  }, [carregarAdmins])

  const value = React.useMemo(() => ({
    admins,
    status,
    mensagem,
    carregando: status === "loading",
    totalPaginas,
    paginaAtual,
    recarregarAdmins,
    resetarDados,
  }), [admins, status, mensagem, totalPaginas, paginaAtual, recarregarAdmins, resetarDados])

  return (
    <AdminsContext.Provider value={value}>
      {children}
    </AdminsContext.Provider>
  )
}

export function useAdmins() {
  const ctx = React.useContext(AdminsContext)

  if (!ctx) {
    throw new Error("useAdmins deve ser usado dentro de AdminsProvider")
  }

  return ctx
}
