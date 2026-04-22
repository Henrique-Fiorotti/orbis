"use client"

import * as React from "react"

import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
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
  const [maquinas, setMaquinas] = React.useState([])
  const [status, setStatus] = React.useState("loading")
  const [mensagem, setMensagem] = React.useState("Carregando maquinas...")
  const [salvando, setSalvando] = React.useState(false)

  const carregarMaquinas = React.useCallback(async ({ silent = false } = {}) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      setMaquinas([])
      setStatus("error")
      setMensagem("Faca login para carregar as maquinas.")
      return
    }

    if (!silent) {
      setStatus("loading")
      setMensagem("Carregando maquinas...")
    }

    try {
      const payload = await fetchDashboardJson("/maquinas", session.accessToken, "as maquinas")
      setMaquinas(normalizeMaquinaCollection(payload))
      setStatus("success")
      setMensagem("")
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
      }

      setStatus("error")
      setMensagem(error instanceof Error ? error.message : "Nao foi possivel carregar as maquinas.")
      setMaquinas((current) => (silent ? current : []))
      throw error
    }
  }, [])

  React.useEffect(() => {
    carregarMaquinas().catch(() => {})
  }, [carregarMaquinas])

  /**
   * @param {string} endpoint
   * @param {{ method: string, body?: any, contextLabel: string }} params
   */
  const executarMutacao = React.useCallback(async (endpoint, params) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      const error = new Error("Faca login para gerenciar as maquinas.")
      setStatus("error")
      setMensagem(error.message)
      throw error
    }

    setSalvando(true)

    try {
      await requestDashboardJson(endpoint, session.accessToken, params.contextLabel, {
        method: params.method,
        body: params.body,
      })

      await carregarMaquinas({ silent: true })
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
      }

      const message =
        error instanceof Error ? error.message : "Nao foi possivel concluir a operacao nas maquinas."
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
    await executarMutacao("/maquinas", {
      method: "POST",
      body: dados,
      contextLabel: "o cadastro da maquina",
    })
  }, [executarMutacao])

  /**
   * @param {number} id
   * @param {AtualizacaoMaquinaInput} dados
   */
  const editarMaquina = React.useCallback(async (id, dados) => {
    await executarMutacao(`/maquinas/${id}`, {
      method: "PUT",
      body: dados,
      contextLabel: "a atualizacao da maquina",
    })
  }, [executarMutacao])

  /**
   * @param {number} id
   */
  const excluirMaquina = React.useCallback(async (id) => {
    await executarMutacao(`/maquinas/${id}`, {
      method: "DELETE",
      contextLabel: "a exclusao da maquina",
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
    recarregarMaquinas,
    resetarDados,
  }), [maquinas, status, mensagem, salvando, adicionarMaquina, editarMaquina, excluirMaquina, recarregarMaquinas, resetarDados])

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
