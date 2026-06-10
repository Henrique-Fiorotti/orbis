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
  const [mensagem, setMensagem] = React.useState("Carregando manutenções...")
  const [salvando, setSalvando] = React.useState(false)

  const carregarManutencoes = React.useCallback(async ({ silent = false } = {}) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      setManutencoes([])
      setStatus("error")
      setMensagem("Faça login para carregar as manutenções.")
      return
    }

    if (!silent) {
      setStatus("loading")
      setMensagem("Carregando manutenções...")
    }

    try {
      const payload = await fetchDashboardJson("/manutencoes", session.accessToken, "as manutenções")
      setManutencoes(normalizeManutencaoCollection(payload))
      setStatus("success")
      setMensagem("")
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
      }

      setStatus("error")
      setMensagem(error instanceof Error ? error.message : "Não foi possível carregar as manutenções.")
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
      const error = new Error("Faça login para gerenciar as manutenções.")
      setStatus("error")
      setMensagem(error.message)
      throw error
    }

    const permissions = getDashboardPermissions(session.usuario)

    if (!permissions.canManagePreventiveMaintenances) {
      const error = new Error("Apenas técnicos podem criar ou atualizar manutenções preventivas.")
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

      const message = error instanceof Error ? error.message : "Não foi possível atualizar a manutenção."
      setStatus((current) => (current === "loading" ? "error" : current))
      setMensagem(message)
      throw error instanceof Error ? error : new Error(message)
    } finally {
      setSalvando(false)
    }
  }, [carregarManutencoes])

  async function criarPreventiva({ maquinaId, observacao }) {
    const maquinaIdNumber = Number(maquinaId)
    const texto = getTrimmedObservation(observacao)

    if (!Number.isFinite(maquinaIdNumber)) {
      throw new Error("Selecione uma máquina válida para a preventiva.")
    }

    if (!texto) {
      throw new Error("Informe uma observação para a manutenção preventiva.")
    }

    return await executarMutacao((accessToken) =>
      requestDashboardJson("/manutencoes", accessToken, "a manutenção preventiva", {
        method: "POST",
        body: {
          tipo: "PREVENTIVA",
          maquinaId: maquinaIdNumber,
          observacao: texto,
        },
      })
    )
  }

  async function concluirManutencao(id, observacao = "Preventiva finalizada.") {
    const manutencaoId = Number(id)
    const texto = getTrimmedObservation(observacao) || "Preventiva finalizada."

    if (!Number.isFinite(manutencaoId)) {
      throw new Error("Manutenção inválida.")
    }

    return await executarMutacao((accessToken) =>
      requestDashboardJson(`/manutencoes/${manutencaoId}`, accessToken, "a conclusão da manutenção", {
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
