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

function getOpenMaintenance(payload) {
  return extractCollection(payload).find((item) => item?.status === "EM_ANDAMENTO") ?? null
}

/**
 * @param {WithChildrenProps} props
 */
export function AlertasProvider({ children }) {
  const [alertas, setAlertas] = React.useState([])
  const [status, setStatus] = React.useState("loading")
  const [mensagem, setMensagem] = React.useState("Carregando chamados...")
  const [salvando, setSalvando] = React.useState(false)

  const carregarAlertas = React.useCallback(async ({ silent = false } = {}) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      setAlertas([])
      setStatus("error")
      setMensagem("Faca login para carregar os chamados.")
      return
    }

    if (!silent) {
      setStatus("loading")
      setMensagem("Carregando chamados...")
    }

    try {
      const payload = await fetchDashboardJson("/alertas", session.accessToken, "os chamados")
      setAlertas(normalizeAlertaCollection(payload))
      setStatus("success")
      setMensagem("")
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
      }

      setStatus("error")
      setMensagem(error instanceof Error ? error.message : "Nao foi possivel carregar os chamados.")
      setAlertas((current) => (silent ? current : []))
      throw error
    }
  }, [])

  React.useEffect(() => {
    carregarAlertas().catch(() => {})
  }, [carregarAlertas])

  React.useEffect(() => {
    let reloadTimer = null

    function handleSensorReading() {
      window.clearTimeout(reloadTimer)
      reloadTimer = window.setTimeout(() => {
        carregarAlertas({ silent: true }).catch(() => {})
      }, 600)
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
      const error = new Error("Faca login para gerenciar os chamados.")
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

      const message = error instanceof Error ? error.message : "Nao foi possivel atualizar o chamado."
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
    throw new Error("Os chamados sao gerados automaticamente pelas leituras dos sensores.")
  }

  /**
   * @param {number} id
   * @param {StatusAlerta} novoStatus
   */
  async function atualizarStatus(id, novoStatus) {
    if (novoStatus === "EM_ANDAMENTO") {
      return await executarMutacao((accessToken) =>
        requestDashboardJson("/manutencoes", accessToken, "o inicio do atendimento", {
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
          throw new Error("Nao foi encontrada uma manutencao em andamento para este chamado.")
        }

        return await requestDashboardJson(`/manutencoes/${manutencao.id}`, accessToken, "a resolucao do chamado", {
          method: "PUT",
          body: {
            status: "RESOLVIDO",
            observacao: manutencao.observacao || "Chamado resolvido pelo dashboard.",
          },
        })
      })
    }

    throw new Error("Este status nao pode ser aplicado pelo fluxo atual do backend.")
  }

  /**
   * @param {number} _id
   */
  async function cancelarAlerta(_id) {
    throw new Error("O backend atual nao possui rota para cancelar chamados.")
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
