"use client"

import * as React from "react"

import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import {
  extractCollection,
  fetchDashboardJson,
  getHttpErrorStatus,
  normalizeAlertaCollection,
  requestDashboardJson,
} from "@/lib/dashboard-api"
import { REALTIME_SENSOR_READING_EVENT } from "@/lib/realtime-events.mjs"
import { SMOOTH_SCROLL_LOCK_CHANGE, isSmoothScrollLocked } from "@/lib/scroll-lock"

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

function getTrimmedObservation(value) {
  return typeof value === "string" ? value.trim() : ""
}

function getTrimmedComment(value) {
  return typeof value === "string" ? value.trim() : ""
}

async function fetchOpenMaintenanceForAlert(accessToken, alertaId) {
  const manutencoes = await fetchDashboardJson(`/manutencoes/alerta/${alertaId}`, accessToken, "as manutencoes do alerta")
  const manutencao = getOpenMaintenance(manutencoes)

  if (!manutencao?.id) {
    throw new Error("Não foi encontrada uma manutenção em andamento para este alerta.")
  }

  return manutencao
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
    let reloadPendingWhileLocked = false

    function reloadSilencioso() {
      reloadTimer = null

      if (isSmoothScrollLocked()) {
        reloadPendingWhileLocked = true
        return
      }

      lastReloadAt = Date.now()
      reloadPendingWhileLocked = false
      carregarAlertas({ silent: true }).catch(() => {})
    }

    function scheduleReload() {
      if (reloadTimer) {
        return
      }

      const elapsed = Date.now() - lastReloadAt
      const wait = elapsed >= 3000 ? 0 : 3000 - elapsed
      reloadTimer = window.setTimeout(reloadSilencioso, wait)
    }

    function handleSensorReading() {
      scheduleReload()
    }

    function handleScrollLockChange(event) {
      const locked =
        typeof event.detail?.locked === "boolean"
          ? event.detail.locked
          : isSmoothScrollLocked()

      if (!locked && reloadPendingWhileLocked) {
        scheduleReload()
      }
    }

    window.addEventListener(REALTIME_SENSOR_READING_EVENT, handleSensorReading)
    window.addEventListener(SMOOTH_SCROLL_LOCK_CHANGE, handleScrollLockChange)

    return () => {
      window.clearTimeout(reloadTimer)
      window.removeEventListener(REALTIME_SENSOR_READING_EVENT, handleSensorReading)
      window.removeEventListener(SMOOTH_SCROLL_LOCK_CHANGE, handleScrollLockChange)
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

      const message = error instanceof Error ? error.message : "Não foi possível atualizar o alerta."
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
  async function atualizarStatus(id, novoStatus, opcoes = {}) {
    const observacao = getTrimmedObservation(opcoes?.observacao)

    if (novoStatus === "EM_ANDAMENTO") {
      return await executarMutacao((accessToken) =>
        requestDashboardJson("/manutencoes", accessToken, "o início da manutenção", {
          method: "POST",
          body: {
            alertaId: id,
            observacao: observacao || "Manutenção iniciada pelo dashboard.",
          },
        })
      )
    }

    if (novoStatus === "RESOLVIDO") {
      return await executarMutacao(async (accessToken) => {
        const manutencao = await fetchOpenMaintenanceForAlert(accessToken, id)
        const observacaoResolucao = observacao || getTrimmedObservation(manutencao.observacao) || "Manutenção concluída pelo dashboard."

        if (!manutencao?.id) {
          throw new Error("Não foi encontrada uma manutenção em andamento para este alerta.")
        }

        return await requestDashboardJson(`/manutencoes/${manutencao.id}`, accessToken, "a conclusão da manutenção", {
          method: "PUT",
          body: {
            status: "RESOLVIDO",
            observacao: observacaoResolucao,
          },
        })
      })
    }

    throw new Error("Este status não pode ser aplicado pelo fluxo atual do backend.")
  }

  async function registrarRelatoAtendimento(id, observacao) {
    const relato = getTrimmedObservation(observacao)

    if (relato.length < 3) {
      throw new Error("Informe um relato com pelo menos 3 caracteres.")
    }

    return await executarMutacao(async (accessToken) => {
      const manutencao = await fetchOpenMaintenanceForAlert(accessToken, id)

      return await requestDashboardJson(`/manutencoes/${manutencao.id}`, accessToken, "o relato da manutenção", {
        method: "PUT",
        body: {
          observacao: relato,
        },
      })
    })
  }

  async function registrarComentarioAlerta(id, mensagem) {
    const comentario = getTrimmedComment(mensagem)

    if (!comentario) {
      throw new Error("Informe uma mensagem para comentar no alerta.")
    }

    if (comentario.length > 1000) {
      throw new Error("O comentário deve ter no máximo 1000 caracteres.")
    }

    return await executarMutacao((accessToken) =>
      requestDashboardJson(`/alertas/${id}/comentarios`, accessToken, "o comentário do alerta", {
        method: "POST",
        body: {
          mensagem: comentario,
        },
      })
    )
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
    registrarRelatoAtendimento,
    registrarComentarioAlerta,
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
