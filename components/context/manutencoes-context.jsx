"use client"

import * as React from "react"

import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import { getDashboardPermissions } from "@/lib/dashboard-permissions"
import {
  fetchDashboardJson,
  getHttpErrorStatus,
  normalizeManutencaoCollection,
  requestDashboardJson,
} from "@/lib/dashboard-api"
import { buildPreventiveMaintenancePayload } from "@/lib/maintenance-contract.mjs"

/** @typedef {import("@/lib/orbis-types").WithChildrenProps} WithChildrenProps */
/** @typedef {import("@/lib/orbis-types").ManutencoesContextValue} ManutencoesContextValue */

/** @type {React.Context<ManutencoesContextValue | null>} */
const ManutencoesContext = React.createContext(null)

function getTrimmedObservation(value) {
  return typeof value === "string" ? value.trim() : ""
}

/**
 * @param {WithChildrenProps} props
 */
export function ManutencoesProvider({ children }) {
  const [manutencoes, setManutencoes] = React.useState([])
  const [status, setStatus] = React.useState("loading")
  const [mensagem, setMensagem] = React.useState("Carregando manutenÃ§Ãµes...")
  const [salvando, setSalvando] = React.useState(false)

  const carregarManutencoes = React.useCallback(async ({ silent = false } = {}) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      setManutencoes([])
      setStatus("error")
      setMensagem("FaÃ§a login para carregar as manutenÃ§Ãµes.")
      return
    }

    if (!silent) {
      setStatus("loading")
      setMensagem("Carregando manutenÃ§Ãµes...")
    }

    try {
      const payload = await fetchDashboardJson("/manutencoes", session.accessToken, "as manutenÃ§Ãµes")
      setManutencoes(normalizeManutencaoCollection(payload))
      setStatus("success")
      setMensagem("")
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
      }

      setStatus("error")
      setMensagem(error instanceof Error ? error.message : "NÃ£o foi possÃ­vel carregar as manutenÃ§Ãµes.")
      setManutencoes((current) => (silent ? current : []))
      throw error
    }
  }, [])

  React.useEffect(() => {
    carregarManutencoes().catch(() => {})
  }, [carregarManutencoes])

  const executarMutacao = React.useCallback(async (callback) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      const error = new Error("FaÃ§a login para gerenciar as manutenÃ§Ãµes.")
      setStatus("error")
      setMensagem(error.message)
      throw error
    }

    const permissions = getDashboardPermissions(session.usuario)

    if (!permissions.canManagePreventiveMaintenances) {
      const error = new Error("Apenas tÃ©cnicos podem criar ou atualizar manutenÃ§Ãµes preventivas.")
      setStatus("error")
      setMensagem(error.message)
      throw error
    }

    setSalvando(true)

    try {
      const payload = await callback(session.accessToken)
      await carregarManutencoes({ silent: true })
      return payload
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
      }

      const message = error instanceof Error ? error.message : "NÃ£o foi possÃ­vel atualizar a manutenÃ§Ã£o."
      setStatus((current) => (current === "loading" ? "error" : current))
      setMensagem(message)
      throw error instanceof Error ? error : new Error(message)
    } finally {
      setSalvando(false)
    }
  }, [carregarManutencoes])

  async function criarPreventiva(dados) {
    const payload = buildPreventiveMaintenancePayload(dados)

    return await executarMutacao((accessToken) =>
      requestDashboardJson("/manutencoes", accessToken, "a manutencao preventiva", {
        method: "POST",
        body: payload,
      })
    )
  }

  async function iniciarManutencao(id) {
    const manutencaoId = Number(id)

    if (!Number.isFinite(manutencaoId)) {
      throw new Error("Manutencao invalida.")
    }

    return await executarMutacao((accessToken) =>
      requestDashboardJson(`/manutencoes/${manutencaoId}`, accessToken, "o inicio da manutencao", {
        method: "PUT",
        body: {
          status: "EM_ANDAMENTO",
        },
      })
    )
  }

  async function concluirManutencao(id, observacao = "Preventiva finalizada.") {
    const manutencaoId = Number(id)
    const texto = getTrimmedObservation(observacao) || "Preventiva finalizada."

    if (!Number.isFinite(manutencaoId)) {
      throw new Error("ManutenÃ§Ã£o invÃ¡lida.")
    }

    return await executarMutacao((accessToken) =>
      requestDashboardJson(`/manutencoes/${manutencaoId}`, accessToken, "a conclusÃ£o da manutenÃ§Ã£o", {
        method: "PUT",
        body: {
          status: "RESOLVIDO",
          observacao: texto,
        },
      })
    )
  }

  const recarregarManutencoes = React.useCallback(async () => {
    await carregarManutencoes()
  }, [carregarManutencoes])

  const resetarDados = React.useCallback(async () => {
    await carregarManutencoes()
  }, [carregarManutencoes])

  const value = React.useMemo(() => ({
    manutencoes,
    status,
    mensagem,
    carregando: status === "loading",
    salvando,
    criarPreventiva,
    iniciarManutencao,
    concluirManutencao,
    recarregarManutencoes,
    resetarDados,
  }), [manutencoes, status, mensagem, salvando, recarregarManutencoes, resetarDados])

  return (
    <ManutencoesContext.Provider value={value}>
      {children}
    </ManutencoesContext.Provider>
  )
}

/**
 * @returns {ManutencoesContextValue}
 */
export function useManutencoes() {
  const ctx = React.useContext(ManutencoesContext)

  if (!ctx) {
    throw new Error("useManutencoes deve ser usado dentro de ManutencoesProvider")
  }

  return /** @type {ManutencoesContextValue} */ (ctx)
}
