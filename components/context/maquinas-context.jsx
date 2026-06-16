"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { useDashboardBootstrap, useIsDashboardHome } from "@/components/context/dashboard-bootstrap-context"
import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import { getDashboardPermissions } from "@/lib/dashboard-permissions"
import {
  fetchDashboardJson,
  getHttpErrorStatus,
  normalizeMaquinaCollection,
  requestDashboardJson,
} from "@/lib/dashboard-api"

/** @typedef {import("@/lib/orbis-types").WithChildrenProps} WithChildrenProps */
/** @typedef {import("@/lib/orbis-types").MaquinasContextValue} MaquinasContextValue */
/** @typedef {import("@/lib/orbis-types").NovaMaquinaInput} NovaMaquinaInput */
/** @typedef {import("@/lib/orbis-types").AtualizacaoMaquinaInput} AtualizacaoMaquinaInput */

/** @type {React.Context<MaquinasContextValue | null>} */
const MaquinasContext = React.createContext(null)

/**
 * @param {WithChildrenProps} props
 */
export function MaquinasProvider({ children }) {
  const pathname = usePathname()
  const isDashboardHome = useIsDashboardHome(pathname)
  const dashboardBootstrap = useDashboardBootstrap()
  const [maquinas, setMaquinas] = React.useState([])
  const [status, setStatus] = React.useState("loading")
  const [mensagem, setMensagem] = React.useState("Carregando máquinas...")
  const [salvando, setSalvando] = React.useState(false)
  const [dataSource, setDataSource] = React.useState("idle")

  const carregarMaquinas = React.useCallback(async ({ silent = false } = {}) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      setMaquinas([])
      setStatus("error")
      setMensagem("Faça login para carregar as máquinas.")
      return
    }

    if (!silent) {
      setStatus("loading")
      setMensagem("Carregando máquinas...")
    }

    try {
      const payload = await fetchDashboardJson("/maquinas", session.accessToken, "as máquinas")
      setMaquinas(normalizeMaquinaCollection(payload))
      setStatus("success")
      setMensagem("")
      setDataSource("full")
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
      }

      setStatus("error")
      setMensagem(error instanceof Error ? error.message : "Não foi possível carregar as máquinas.")
      setMaquinas((current) => (silent ? current : []))
      throw error
    }
  }, [])

  React.useEffect(() => {
    if (isDashboardHome && dashboardBootstrap.status === "loading") {
      setStatus("loading")
      setMensagem("Carregando máquinas...")
      return
    }

    if (isDashboardHome && dashboardBootstrap.status === "success") {
      setMaquinas(dashboardBootstrap.snapshot.maquinas)
      setStatus("success")
      setMensagem("")
      setDataSource("bootstrap")
      return
    }

    if (!isDashboardHome && dataSource === "full") {
      return
    }

    carregarMaquinas().catch(() => {})
  }, [carregarMaquinas, dashboardBootstrap.status, dashboardBootstrap.snapshot.maquinas, dataSource, isDashboardHome])

  /**
   * @param {string} endpoint
   * @param {{ method: string, body?: any, contextLabel: string }} params
   */
  const executarMutacao = React.useCallback(async (endpoint, params) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      const error = new Error("Faça login para gerenciar as máquinas.")
      setStatus("error")
      setMensagem(error.message)
      throw error
    }

    const permissions = getDashboardPermissions(session.usuario)

    if (!permissions.canManageMaquinas) {
      const error = new Error("Seu perfil tem acesso somente leitura para máquinas.")
      setStatus("error")
      setMensagem(error.message)
      throw error
    }

    setSalvando(true)

    try {
      const payload = await requestDashboardJson(endpoint, session.accessToken, params.contextLabel, {
        method: params.method,
        body: params.body,
      })

      await carregarMaquinas({ silent: true })
      return payload
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
      }

      const message =
        error instanceof Error ? error.message : "Não foi possível concluir a operação nas máquinas."
      setStatus("error")
      setMensagem(message)
      throw error instanceof Error ? error : new Error(message)
    } finally {
      setSalvando(false)
    }
  }, [carregarMaquinas])

  /**
   * @param {NovaMaquinaInput} dados
   */
  const adicionarMaquina = React.useCallback(async (dados) => {
    return await executarMutacao("/maquinas", {
      method: "POST",
      body: dados,
      contextLabel: "o cadastro da máquina",
    })
  }, [executarMutacao])

  /**
   * @param {number} id
   * @param {AtualizacaoMaquinaInput} dados
   */
  const editarMaquina = React.useCallback(async (id, dados) => {
    return await executarMutacao(`/maquinas/${id}`, {
      method: "PUT",
      body: dados,
      contextLabel: "a atualização da máquina",
    })
  }, [executarMutacao])

  /**
   * @param {number} id
   */
  const excluirMaquina = React.useCallback(async (id) => {
    await executarMutacao(`/maquinas/${id}`, {
      method: "DELETE",
      contextLabel: "a exclusão da máquina",
    })
  }, [executarMutacao])

  /**
   * @param {number} id
   * @param {File} imagem
   */
  const atualizarImagemMaquina = React.useCallback(async (id, imagem) => {
    const formData = new FormData()
    formData.append("imagem", imagem)

    await executarMutacao(`/maquinas/${id}/foto`, {
      method: "PUT",
      body: formData,
      contextLabel: "o upload da imagem da máquina",
    })
  }, [executarMutacao])

  const recarregarMaquinas = React.useCallback(async () => {
    await carregarMaquinas()
  }, [carregarMaquinas])

  const resetarDados = React.useCallback(async () => {
    await carregarMaquinas()
  }, [carregarMaquinas])

  const value = React.useMemo(() => ({
    maquinas,
    status,
    mensagem,
    carregando: status === "loading",
    salvando,
    adicionarMaquina,
    editarMaquina,
    excluirMaquina,
    atualizarImagemMaquina,
    recarregarMaquinas,
    resetarDados,
  }), [maquinas, status, mensagem, salvando, adicionarMaquina, editarMaquina, excluirMaquina, atualizarImagemMaquina, recarregarMaquinas, resetarDados])

  return (
    <MaquinasContext.Provider value={value}>
      {children}
    </MaquinasContext.Provider>
  )
}

/**
 * @returns {MaquinasContextValue}
 */
export function useMaquinas() {
  const ctx = React.useContext(MaquinasContext)

  if (!ctx) {
    throw new Error("useMaquinas deve ser usado dentro de MaquinasProvider")
  }

  return /** @type {MaquinasContextValue} */ (ctx)
}
