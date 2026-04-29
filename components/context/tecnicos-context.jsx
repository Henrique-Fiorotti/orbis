"use client"

import * as React from "react"

import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import {
  fetchDashboardJson,
  getHttpErrorStatus,
  normalizeTecnicoCollection,
  requestDashboardJson,
} from "@/lib/dashboard-api"

/** @typedef {import("@/lib/orbis-types").WithChildrenProps} WithChildrenProps */
/** @typedef {import("@/lib/orbis-types").NovoTecnicoInput} NovoTecnicoInput */
/** @typedef {import("@/lib/orbis-types").AtualizacaoTecnicoInput} AtualizacaoTecnicoInput */
/** @typedef {import("@/lib/orbis-types").TecnicosContextValue} TecnicosContextValue */

/** @type {React.Context<TecnicosContextValue | null>} */
const TecnicosContext = React.createContext(null)

/**
 * @param {WithChildrenProps} props
 */
export function TecnicosProvider({ children }) {
  const [tecnicos, setTecnicos] = React.useState([])
  const [status, setStatus] = React.useState("loading")
  const [mensagem, setMensagem] = React.useState("Carregando tecnicos...")
  const [salvando, setSalvando] = React.useState(false)
  const [totalPaginas, setTotalPaginas] = React.useState(0)
  const [paginaAtual, setPaginaAtual] = React.useState(1)

  const carregarTecnicos = React.useCallback(async ({ silent = false, page = 1, limit = 10 } = {}) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      setTecnicos([])
      setStatus("error")
      setMensagem("Faca login para carregar os tecnicos.")
      return
    }

    if (!silent) {
      setStatus("loading")
      setMensagem("Carregando tecnicos...")
    }

    try {
      const endpoint = `/tecnicos/?page=${page}&limit=${limit}`
      const payload = await fetchDashboardJson(endpoint, session.accessToken, "os tecnicos")
      setTecnicos(normalizeTecnicoCollection(payload))
      
      // Atualizar informações de paginação
      if (payload && payload.totalPages) {
        setTotalPaginas(payload.totalPages)
      } else if (payload && payload.total && limit) {
        setTotalPaginas(Math.ceil(payload.total / limit))
      }
      setPaginaAtual(page)
      
      setStatus("success")
      setMensagem("")
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
      }

      setStatus("error")
      setMensagem(error instanceof Error ? error.message : "Nao foi possivel carregar os tecnicos.")
      setTecnicos((current) => (silent ? current : []))
      throw error
    }
  }, [])

  React.useEffect(() => {
    carregarTecnicos().catch(() => {})
  }, [carregarTecnicos])

  /**
   * @param {string} endpoint
   * @param {{ method: string, body?: any, contextLabel: string }} params
   */
  const executarMutacao = React.useCallback(async (endpoint, params) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      const error = new Error("Faca login para gerenciar os tecnicos.")
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

      await carregarTecnicos({ silent: true })
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
      }

      const message =
        error instanceof Error ? error.message : "Nao foi possivel concluir a operacao nos tecnicos."
      setStatus("error")
      setMensagem(message)
      throw error instanceof Error ? error : new Error(message)
    } finally {
      setSalvando(false)
    }
  }, [carregarTecnicos])

  /**
   * @param {NovoTecnicoInput} dados
   */
  const adicionarTecnico = React.useCallback(async (dados) => {
    await executarMutacao("/usuarios", {
      method: "POST",
      body: {
        nome: dados.nome,
        email: dados.email,
        senha: dados.senha,
        role: dados.role || "TECNICO",
      },
    })
  }, [executarMutacao])

  /**
   * @param {number} id
   * @param {AtualizacaoTecnicoInput} dados
   */
  const editarTecnico = React.useCallback(async (id, dados) => {
    await executarMutacao(`/usuarios/${id}`, {
      method: "PUT",
      body: dados,
    })
  }, [executarMutacao])

  /**
   * @param {number} id
   */
  const excluirTecnico = React.useCallback(async (id) => {
    await executarMutacao(`/usuarios/${id}`, {
      method: "DELETE",
    })
  }, [executarMutacao])

  const recarregarTecnicos = React.useCallback(async (page = 1, limit = 10) => {
    await carregarTecnicos({ page, limit })
  }, [carregarTecnicos])

  const resetarDados = React.useCallback(async () => {
    await carregarTecnicos({ page: 1 })
  }, [carregarTecnicos])

  const value = React.useMemo(() => ({
    tecnicos,
    status,
    mensagem,
    carregando: status === "loading",
    salvando,
    totalPaginas,
    paginaAtual,
    adicionarTecnico,
    editarTecnico,
    excluirTecnico,
    recarregarTecnicos,
    resetarDados,
  }), [tecnicos, status, mensagem, salvando, totalPaginas, paginaAtual, adicionarTecnico, editarTecnico, excluirTecnico, recarregarTecnicos, resetarDados])

  return (
    <TecnicosContext.Provider value={value}>
      {children}
    </TecnicosContext.Provider>
  )
}

/**
 * @returns {TecnicosContextValue}
 */
export function useTecnicos() {
  const ctx = React.useContext(TecnicosContext)

  if (!ctx) {
    throw new Error("useTecnicos deve ser usado dentro de TecnicosProvider")
  }

  return /** @type {TecnicosContextValue} */ (ctx)
}
