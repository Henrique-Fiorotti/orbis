"use client"

import * as React from "react"

import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import { getDashboardPermissions } from "@/lib/dashboard-permissions"
import {
  extractCollection,
  fetchDashboardJson,
  getHttpErrorStatus,
  getUsuarioCriadoEm,
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
    { endpoint: `/usuarios/?page=${page}&limit=${limit}&role=TECNICO`, source: "usuarios-filtered", optional: true },
    { endpoint: `/usuarios?page=${page}&limit=${limit}&role=TECNICO`, source: "usuarios-filtered", optional: true },
    { endpoint: `/usuarios/?role=TECNICO&page=${page}&limit=${limit}`, source: "usuarios-filtered", optional: true },
    { endpoint: `/usuarios?role=TECNICO&page=${page}&limit=${limit}`, source: "usuarios-filtered", optional: true },
    { endpoint: `/usuarios/?page=${page}&limit=${limit}`, source: "usuarios" },
    { endpoint: `/usuarios?page=${page}&limit=${limit}`, source: "usuarios" },
  ]
}

function isTecnicoRecord(item, assumeTecnicoWhenRoleMissing = true) {
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
    return assumeTecnicoWhenRoleMissing
  }

  return roleValue.trim().toUpperCase() === "TECNICO"
}

function getTecnicosFromPayload(payload, source) {
  const collection = extractCollection(payload)

  if (source === "usuarios") {
    return collection.filter((item) => isTecnicoRecord(item, false))
  }

  if (source === "usuarios-filtered") {
    return collection.filter((item) => isTecnicoRecord(item, true))
  }

  return collection
}

function getTecnicoRecordId(item) {
  if (!item || typeof item !== "object") {
    return null
  }

  const wrappedSource = [item.dados, item.data, item.resultado].find(
    (source) => source && typeof source === "object" && !Array.isArray(source)
  )
  const source = wrappedSource || item
  const id = Number(source.id ?? source.tecnicoId ?? source.usuarioId ?? source.usuario?.id ?? source.usuarioSemSenha?.id)

  return Number.isFinite(id) ? id : null
}

function getPayloadTotal(payload, fallback) {
  const total = Number(payload?.total ?? payload?.count ?? payload?.totalRegistros)
  return Number.isFinite(total) ? total : fallback
}

function mergeTecnicoRecords(...groups) {
  const records = new Map()

  for (const group of groups) {
    for (const item of group) {
      const id = getTecnicoRecordId(item)

      if (id === null) {
        continue
      }

      records.set(id, item)
    }
  }

  return Array.from(records.values())
}

async function fetchTecnicosCriadoEmPorId(accessToken, records) {
  const normalizedRecords = normalizeTecnicoCollection({ dados: records })
  const idsSemCadastro = Array.from(
    new Set(
      normalizedRecords
        .filter((item) => !item.criadoEm)
        .map((item) => item.id)
        .filter((id) => Number.isFinite(id))
    )
  )

  if (idsSemCadastro.length === 0) {
    return new Map()
  }

  const criadosEm = new Map()

  for (let index = 0; index < idsSemCadastro.length; index += 8) {
    const batch = idsSemCadastro.slice(index, index + 8)
    const results = await Promise.all(batch.map(async (id) => {
      try {
        return await fetchDashboardJson(`/usuarios/${id}`, accessToken, "o técnico")
      } catch (error) {
        const statusCode = getHttpErrorStatus(error)

        if ([400, 403, 404, 500].includes(Number(statusCode))) {
          return null
        }

        throw error
      }
    }))

    for (const payload of results) {
      if (!payload) {
        continue
      }

      const id = getTecnicoRecordId(payload)
      const criadoEm = getUsuarioCriadoEm(payload)

      if (id !== null && criadoEm) {
        criadosEm.set(id, criadoEm)
      }
    }
  }

  return criadosEm
}

function applyTecnicosCriadoEm(records, criadosEm) {
  if (criadosEm.size === 0) {
    return records
  }

  return records.map((record) => {
    const id = getTecnicoRecordId(record)

    if (id === null || getUsuarioCriadoEm(record) || !criadosEm.has(id)) {
      return record
    }

    return {
      ...record,
      criadoEm: criadosEm.get(id),
    }
  })
}

function isTecnicoInativoRecord(item) {
  if (!isTecnicoRecord(item, false)) {
    return false
  }

  return item.ativo === false || item.active === false || item.usuario?.ativo === false
}

async function fetchTecnicosAtivosParaConferencia(accessToken, totalTecnicos, baseItems) {
  if (totalTecnicos <= baseItems.length) {
    return baseItems
  }

  const limit = Math.min(Math.max(totalTecnicos, baseItems.length), 100)

  try {
    const payload = await fetchDashboardJson(`/tecnicos/?page=1&limit=${limit}`, accessToken, "os técnicos")
    return mergeTecnicoRecords(baseItems, getTecnicosFromPayload(payload, "tecnicos"))
  } catch (error) {
    const statusCode = getHttpErrorStatus(error)

    if (statusCode === 401) {
      throw error
    }

    return baseItems
  }
}

async function fetchTecnicosInativosPorId(accessToken, knownItems, totalTecnicos) {
  const idsConhecidos = new Set(knownItems.map(getTecnicoRecordId).filter((id) => id !== null))

  if (totalTecnicos <= idsConhecidos.size) {
    return []
  }

  const maiorIdConhecido = Math.max(0, ...Array.from(idsConhecidos))
  const scanLimit = Math.min(Math.max(totalTecnicos * 3, maiorIdConhecido + totalTecnicos + 10, 30), 250)
  const idsParaBuscar = Array.from({ length: scanLimit }, (_, index) => index + 1).filter((id) => !idsConhecidos.has(id))
  const encontrados = []

  for (let index = 0; index < idsParaBuscar.length; index += 12) {
    const batch = idsParaBuscar.slice(index, index + 12)
    const results = await Promise.all(batch.map(async (id) => {
      try {
        return await fetchDashboardJson(`/usuarios/${id}`, accessToken, "o técnico")
      } catch (error) {
        const statusCode = getHttpErrorStatus(error)

        if ([400, 403, 404, 500].includes(Number(statusCode))) {
          return null
        }

        throw error
      }
    }))

    for (const item of results) {
      if (!item || !isTecnicoInativoRecord(item)) {
        continue
      }

      encontrados.push(item)
    }

    if (idsConhecidos.size + encontrados.length >= totalTecnicos) {
      break
    }
  }

  return encontrados
}

async function fetchTecnicosPayload(accessToken, page, limit) {
  /** @type {unknown} */
  let lastRecoverableError = null

  for (const candidate of getTecnicosEndpoints(page, limit)) {
    try {
      const payload = await fetchDashboardJson(candidate.endpoint, accessToken, "os técnicos")
      return { payload, source: candidate.source }
    } catch (error) {
      const statusCode = getHttpErrorStatus(error)
      const recoverableStatusCodes = candidate.optional ? [400, 403, 404, 500] : [400, 403, 404]

      if (recoverableStatusCodes.includes(Number(statusCode))) {
        lastRecoverableError = error
        continue
      }

      throw error
    }
  }

  if (lastRecoverableError) {
    throw lastRecoverableError
  }

  throw new Error("Não foi possível localizar um endpoint de leitura de técnicos na API.")
}

/**
 * @param {WithChildrenProps} props
 */
export function TecnicosProvider({ children }) {
  const [tecnicos, setTecnicos] = React.useState([])
  const [status, setStatus] = React.useState("loading")
  const [mensagem, setMensagem] = React.useState("Carregando técnicos...")
  const [salvando, setSalvando] = React.useState(false)
  const [totalPaginas, setTotalPaginas] = React.useState(0)
  const [paginaAtual, setPaginaAtual] = React.useState(1)

  const carregarTecnicos = React.useCallback(async ({ silent = false, page = 1, limit = 10 } = {}) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      setTecnicos([])
      setStatus("error")
      setMensagem("Faça login para carregar os técnicos.")
      return
    }

    if (!silent) {
      setStatus("loading")
      setMensagem("Carregando técnicos...")
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
      const totalTecnicos = getPayloadTotal(resolved.payload, tecnicoItems.length)
      const tecnicosParaConferencia = await fetchTecnicosAtivosParaConferencia(
        session.accessToken,
        totalTecnicos,
        tecnicoItems
      )
      const tecnicosInativos = await fetchTecnicosInativosPorId(
        session.accessToken,
        tecnicosParaConferencia,
        totalTecnicos
      )
      const mergedTecnicos = mergeTecnicoRecords(tecnicoItems, tecnicosInativos)
      const criadosEm = await fetchTecnicosCriadoEmPorId(session.accessToken, mergedTecnicos)
      const normalizedTecnicos = normalizeTecnicoCollection(applyTecnicosCriadoEm(mergedTecnicos, criadosEm))

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
          "A API atual bloqueou a listagem de técnicos para este usuário. Para exibir outros técnicos via API, o backend precisa liberar uma rota de leitura para o perfil TECNICO."
        setStatus("error")
        setMensagem(message)
        setTecnicos((current) => (silent ? current : []))
        throw new Error(message)
      }

      setStatus("error")
      setMensagem(error instanceof Error ? error.message : "Não foi possível carregar os técnicos.")
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
      const error = new Error("Faça login para gerenciar os técnicos.")
      setStatus("error")
      setMensagem(error.message)
      throw error
    }

    const permissions = getDashboardPermissions(session.usuario)

    if (!permissions.canViewTecnicos || !permissions.canManageTecnicos) {
      const error = new Error("Seu perfil tem acesso somente leitura para técnicos.")
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
        error instanceof Error ? error.message : "Não foi possível concluir a operação nos técnicos."
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
      contextLabel: "o cadastro do técnico",
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
      contextLabel: "a atualização do técnico",
    })
  }, [executarMutacao])

  /**
   * @param {number} id
   */
  const excluirTecnico = React.useCallback(async (id) => {
    await executarMutacao(`/usuarios/${id}`, {
      method: "DELETE",
      contextLabel: "a exclusão do técnico",
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
