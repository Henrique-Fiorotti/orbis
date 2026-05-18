"use client"

import * as React from "react"

import { SENSOR_READING_EVENT } from "@/components/context/sensores-context"
import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import {
  extractCollection,
  fetchDashboardJson,
  getHttpErrorStatus,
  normalizeAlertaCollection,
  requestDashboardJson,
} from "@/lib/dashboard-api"

/** @typedef {import("@/lib/orbis-types").WithChildrenProps} WithChildrenProps */
/** @typedef {import("@/lib/orbis-types").NovoAlertaInput} NovoAlertaInput */
/** @typedef {import("@/lib/orbis-types").StatusAlerta} StatusAlerta */
/** @typedef {import("@/lib/orbis-types").AlertasContextValue} AlertasContextValue */

/** @type {React.Context<AlertasContextValue | null>} */
const AlertasContext = React.createContext(null)

function normalizeManutencaoStatus(value) {
  if (typeof value !== "string") {
    return ""
  }

  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_")

  return {
    ANDAMENTO: "EM_ANDAMENTO",
    ABERTO: "EM_ANDAMENTO",
    ATIVO: "EM_ANDAMENTO",
    EM_ATENDIMENTO: "EM_ANDAMENTO",
    EM_ANDAMENTO: "EM_ANDAMENTO",
    INICIADA: "EM_ANDAMENTO",
    INICIADO: "EM_ANDAMENTO",
    PENDENTE: "EM_ANDAMENTO",
  }[normalized] ?? normalized
}

function getMaintenanceItems(payload) {
  const collection = extractCollection(payload)

  if (collection.length > 0) {
    return collection
  }

  const candidates = [
    payload?.manutencao,
    payload?.manutencoes,
    payload?.data?.manutencao,
    payload?.data?.manutencoes,
    payload?.dados?.manutencao,
    payload?.dados?.manutencoes,
    payload?.resultado?.manutencao,
    payload?.resultado?.manutencoes,
    payload?.registro,
    payload?.item,
    payload,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
    }

    if (candidate && typeof candidate === "object") {
      return [candidate]
    }
  }

  return []
}

function getOpenMaintenance(payload) {
  return getMaintenanceItems(payload).find((item) =>
    normalizeManutencaoStatus(item?.status ?? item?.estado ?? item?.situacao) === "EM_ANDAMENTO"
  ) ?? null
}

/**
 * @param {WithChildrenProps} props
 */
export function AlertasProvider({ children }) {
  const [alertas, setAlertas] = React.useState([])
  const [status, setStatus] = React.useState("loading")
  const [mensagem, setMensagem] = React.useState("Carregando alertas...")
  const [salvando, setSalvando] = React.useState(false)

  const carregarAlertas = React.useCallback(async ({ silent = false } = {}) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      setAlertas([])
      setStatus("error")
      setMensagem("Faça login para carregar os alertas.")
      return
    }

    if (!silent) {
      setStatus("loading")
      setMensagem("Carregando alertas...")
    }

    try {
      const payload = await fetchDashboardJson("/alertas", session.accessToken, "os alertas")
      setAlertas(normalizeAlertaCollection(payload))
      setStatus("success")
      setMensagem("")
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
      }

      setStatus("error")
      setMensagem(error instanceof Error ? error.message : "Não foi possível carregar os alertas.")
      setAlertas((current) => (silent ? current : []))
      throw error
    }
  }, [])

  React.useEffect(() => {
    carregarAlertas().catch(() => {})
  }, [carregarAlertas])

  React.useEffect(() => {
    let reloadTimer = null
    let lastReloadAt = 0

    function reloadSilencioso() {
      lastReloadAt = Date.now()
      reloadTimer = null
      carregarAlertas({ silent: true }).catch(() => {})
    }

    function handleSensorReading() {
      if (reloadTimer) {
        return
      }

      const elapsed = Date.now() - lastReloadAt
      const wait = elapsed >= 3000 ? 0 : 3000 - elapsed
      reloadTimer = window.setTimeout(reloadSilencioso, wait)
    }

    window.addEventListener(SENSOR_READING_EVENT, handleSensorReading)

    return () => {
      window.clearTimeout(reloadTimer)
      window.removeEventListener(SENSOR_READING_EVENT, handleSensorReading)
    }
  }, [carregarAlertas])

  async function executarMutacao(callback) {
    const session = getAuthSession()

    if (!session?.accessToken) {
      const error = new Error("Faça login para gerenciar os alertas.")
      setStatus("error")
      setMensagem(error.message)
      throw error
    }

    setSalvando(true)

    try {
      const result = await callback(session.accessToken)
      await carregarAlertas({ silent: true })
      return result
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
      }

      const message = error instanceof Error ? error.message : "Não foi possível atualizar o chamado."
      setStatus((current) => (current === "loading" ? "error" : current))
      setMensagem(message)
      throw error instanceof Error ? error : new Error(message)
    } finally {
      setSalvando(false)
    }
  }

  /**
   * @param {NovoAlertaInput} _dados
   */
  async function adicionarAlerta(_dados) {
    throw new Error("Os alertas sao gerados automaticamente pelas leituras dos sensores.")
  }

  /**
   * @param {number} id
   * @param {StatusAlerta} novoStatus
   */
  async function atualizarStatus(id, novoStatus) {
    if (novoStatus === "EM_ANDAMENTO") {
      return await executarMutacao((accessToken) =>
        requestDashboardJson("/manutencoes", accessToken, "o início do atendimento", {
          method: "POST",
          body: {
            alertaId: id,
            observacao: "Atendimento iniciado pelo dashboard.",
          },
        })
      )
    }

    if (novoStatus === "RESOLVIDO") {
      return await executarMutacao(async (accessToken) => {
        const manutencoes = await fetchDashboardJson(`/manutencoes/alerta/${id}`, accessToken, "as manutencoes do chamado")
        const manutencao = getOpenMaintenance(manutencoes)

        if (!manutencao?.id) {
          throw new Error("Não foi encontrada uma manutenção em andamento para este chamado.")
        }

        return await requestDashboardJson(`/manutencoes/${manutencao.id}`, accessToken, "a resolução do chamado", {
          method: "PUT",
          body: {
            status: "RESOLVIDO",
            observacao: manutencao.observacao || "Chamado resolvido pelo dashboard.",
          },
        })
      })
    }

    throw new Error("Este status não pode ser aplicado pelo fluxo atual do backend.")
  }

  /**
   * @param {number} _id
   */
  async function cancelarAlerta(_id) {
    throw new Error("O backend atual não possui rota para cancelar alertas.")
  }

  const recarregarAlertas = React.useCallback(async () => {
    await carregarAlertas()
  }, [carregarAlertas])

  const resetarDados = React.useCallback(async () => {
    await carregarAlertas()
  }, [carregarAlertas])

  const value = React.useMemo(() => ({
    alertas,
    status,
    mensagem,
    carregando: status === "loading",
    salvando,
    adicionarAlerta,
    atualizarStatus,
    cancelarAlerta,
    recarregarAlertas,
    resetarDados,
  }), [alertas, status, mensagem, salvando, recarregarAlertas, resetarDados])

  return (
    <AlertasContext.Provider value={value}>
      {children}
    </AlertasContext.Provider>
  )
}

/**
 * @returns {AlertasContextValue}
 */
export function useAlertas() {
  const ctx = React.useContext(AlertasContext)

  if (!ctx) {
    throw new Error("useAlertas deve ser usado dentro de AlertasProvider")
  }

  return /** @type {AlertasContextValue} */ (ctx)
}
