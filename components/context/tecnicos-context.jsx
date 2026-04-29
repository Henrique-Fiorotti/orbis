"use client"

import * as React from "react"

import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import { getDashboardPermissions } from "@/lib/dashboard-permissions"
import {
  extractCollection,
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

function getTecnicosEndpoints(page, limit) {
  return [
    { endpoint: `/tecnicos/?page=${page}&limit=${limit}`, source: "tecnicos" },
    { endpoint: `/tecnicos?page=${page}&limit=${limit}`, source: "tecnicos" },
    { endpoint: `/usuarios/tecnicos/?page=${page}&limit=${limit}`, source: "tecnicos" },
    { endpoint: `/usuarios/tecnicos?page=${page}&limit=${limit}`, source: "tecnicos" },
    { endpoint: `/usuarios/?page=${page}&limit=${limit}&role=TECNICO`, source: "usuarios-filtered" },
    { endpoint: `/usuarios?page=${page}&limit=${limit}&role=TECNICO`, source: "usuarios-filtered" },
    { endpoint: `/usuarios/?role=TECNICO&page=${page}&limit=${limit}`, source: "usuarios-filtered" },
    { endpoint: `/usuarios?role=TECNICO&page=${page}&limit=${limit}`, source: "usuarios-filtered" },
    { endpoint: `/usuarios/?page=${page}&limit=${limit}`, source: "usuarios" },
    { endpoint: `/usuarios?page=${page}&limit=${limit}`, source: "usuarios" },
  ]
}

function isTecnicoRecord(item) {
  if (!item || typeof item !== "object") {
    return false
  }

  const roleValue =
    item.role ??
    item.usuario?.role ??
    item.usuarioSemSenha?.role ??
    item.perfil?.role ??
    item.tipoUsuario

  if (typeof roleValue !== "string") {
    return true
  }

  return roleValue.trim().toUpperCase() === "TECNICO"
}

function getTecnicosFromPayload(payload, source) {
  const collection = extractCollection(payload)

  if (source === "usuarios") {
    return collection.filter(isTecnicoRecord)
  }

  return collection
}

async function fetchTecnicosPayload(accessToken, page, limit) {
  /** @type {unknown} */
  let lastRecoverableError = null

  for (const candidate of getTecnicosEndpoints(page, limit)) {
    try {
      const payload = await fetchDashboardJson(candidate.endpoint, accessToken, "os tecnicos")
      return { payload, source: candidate.source }
    } catch (error) {
      const statusCode = getHttpErrorStatus(error)

      if ([400, 403, 404].includes(Number(statusCode))) {
        lastRecoverableError = error
        continue
      }

      throw error
    }
  }

  if (lastRecoverableError) {
    throw lastRecoverableError
  }

  throw new Error("Nao foi possivel localizar um endpoint de leitura de tecnicos na API.")
}

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

    const permissions = getDashboardPermissions(session.usuario)

    if (!permissions.canViewTecnicos) {
      setTecnicos([])
      setTotalPaginas(0)
      setPaginaAtual(1)
      setStatus("success")
      setMensagem("")
      return
    }

    try {
      const resolved = await fetchTecnicosPayload(session.accessToken, page, limit)
      const tecnicoItems = getTecnicosFromPayload(resolved.payload, resolved.source)
      const normalizedTecnicos = normalizeTecnicoCollection(tecnicoItems)

      setTecnicos(normalizedTecnicos)

      if (resolved.payload && resolved.payload.totalPages) {
        setTotalPaginas(resolved.payload.totalPages)
      } else if (resolved.payload && resolved.payload.total && limit && resolved.source !== "usuarios") {
        setTotalPaginas(Math.ceil(resolved.payload.total / limit))
      } else {
        setTotalPaginas(Math.max(Math.ceil(normalizedTecnicos.length / limit), 1))
      }

      setPaginaAtual(page)
      
      setStatus("success")
      setMensagem("")
    } catch (error) {
      const statusCode = getHttpErrorStatus(error)

      if (statusCode === 401) {
        clearAuthSession()
      }

      if (statusCode === 403) {
        const message =
          "A API atual bloqueou a listagem de tecnicos para este usuario. Para exibir outros tecnicos via API, o backend precisa liberar uma rota de leitura para o perfil TECNICO."
        setStatus("error")
        setMensagem(message)
        setTecnicos((current) => (silent ? current : []))
        throw new Error(message)
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

    const permissions = getDashboardPermissions(session.usuario)

    if (!permissions.canViewTecnicos || !permissions.canManageTecnicos) {
      const error = new Error("Seu perfil tem acesso somente leitura para tecnicos.")
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
