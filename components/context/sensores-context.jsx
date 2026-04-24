"use client"

import * as React from "react"

import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import {
  fetchDashboardJson,
  getHttpErrorStatus,
  normalizeSensorCollection,
  requestDashboardJson,
} from "@/lib/dashboard-api"

/** @typedef {import("@/lib/orbis-types").WithChildrenProps} WithChildrenProps */
/** @typedef {import("@/lib/orbis-types").SensoresContextValue} SensoresContextValue */
/** @typedef {import("@/lib/orbis-types").NovoSensorInput} NovoSensorInput */
/** @typedef {import("@/lib/orbis-types").AtualizacaoSensorInput} AtualizacaoSensorInput */

/** @type {React.Context<SensoresContextValue | null>} */
const SensoresContext = React.createContext(null)

/**
 * @param {WithChildrenProps} props
 */
export function SensoresProvider({ children }) {
  const [sensores, setSensores] = React.useState([])
  const [status, setStatus] = React.useState("loading")
  const [mensagem, setMensagem] = React.useState("Carregando sensores...")
  const [salvando, setSalvando] = React.useState(false)

  const carregarSensores = React.useCallback(async ({ silent = false } = {}) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      setSensores([])
      setStatus("error")
      setMensagem("Faca login para carregar os sensores.")
      return
    }

    if (!silent) {
      setStatus("loading")
      setMensagem("Carregando sensores...")
    }

    try {
      const payload = await fetchDashboardJson("/sensores", session.accessToken, "os sensores")
      setSensores(normalizeSensorCollection(payload))
      setStatus("success")
      setMensagem("")
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
      }

      setStatus("error")
      setMensagem(error instanceof Error ? error.message : "Nao foi possivel carregar os sensores.")
      setSensores((current) => (silent ? current : []))
      throw error
    }
  }, [])

  React.useEffect(() => {
    carregarSensores().catch(() => {})
  }, [carregarSensores])

  /**
   * @param {string} endpoint
   * @param {{ method: string, body?: any, contextLabel: string }} params
   */
  const executarMutacao = React.useCallback(async (endpoint, params) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      const error = new Error("Faca login para gerenciar os sensores.")
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

      await carregarSensores({ silent: true })
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
      }

      const message =
        error instanceof Error ? error.message : "Nao foi possivel concluir a operacao nos sensores."
      setStatus("error")
      setMensagem(message)
      throw error instanceof Error ? error : new Error(message)
    } finally {
      setSalvando(false)
    }
  }, [carregarSensores])

  /**
   * @param {NovoSensorInput} dados
   */
  const adicionarSensor = React.useCallback(async (dados) => {
    await executarMutacao("/sensores", {
      method: "POST",
      body: dados,
      contextLabel: "o cadastro do sensor",
    })
  }, [executarMutacao])

  /**
   * @param {number} id
   * @param {AtualizacaoSensorInput} dados
   */
  const editarSensor = React.useCallback(async (id, dados) => {
    await executarMutacao(`/sensores/${id}`, {
      method: "PUT",
      body: dados,
      contextLabel: "a atualizacao do sensor",
    })
  }, [executarMutacao])

  /**
   * @param {number} id
   */
  const excluirSensor = React.useCallback(async (id) => {
    await executarMutacao(`/sensores/${id}`, {
      method: "DELETE",
      contextLabel: "a exclusao do sensor",
    })
  }, [executarMutacao])

  const recarregarSensores = React.useCallback(async () => {
    await carregarSensores()
  }, [carregarSensores])

  const resetarDados = React.useCallback(async () => {
    await carregarSensores()
  }, [carregarSensores])

  const value = React.useMemo(() => ({
    sensores,
    status,
    mensagem,
    carregando: status === "loading",
    salvando,
    adicionarSensor,
    editarSensor,
    excluirSensor,
    recarregarSensores,
    resetarDados,
  }), [sensores, status, mensagem, salvando, adicionarSensor, editarSensor, excluirSensor, recarregarSensores, resetarDados])

  return (
    <SensoresContext.Provider value={value}>
      {children}
    </SensoresContext.Provider>
  )
}

/**
 * @returns {SensoresContextValue}
 */
export function useSensores() {
  const ctx = React.useContext(SensoresContext)

  if (!ctx) {
    throw new Error("useSensores deve ser usado dentro de SensoresProvider")
  }

  return /** @type {SensoresContextValue} */ (ctx)
}
