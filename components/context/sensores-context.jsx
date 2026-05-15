"use client"

import * as React from "react"
import { io } from "socket.io-client"

import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import { getDashboardPermissions } from "@/lib/dashboard-permissions"
import {
  API_URL,
  fetchDashboardJson,
  getHttpErrorStatus,
  mergeSensorLeitura,
  mergeSensorLeituras,
  normalizeSensorCollection,
  refreshSensorStatuses,
  requestDashboardJson,
} from "@/lib/dashboard-api"

/** @typedef {import("@/lib/orbis-types").WithChildrenProps} WithChildrenProps */
/** @typedef {import("@/lib/orbis-types").SensoresContextValue} SensoresContextValue */
/** @typedef {import("@/lib/orbis-types").NovoSensorInput} NovoSensorInput */
/** @typedef {import("@/lib/orbis-types").AtualizacaoSensorInput} AtualizacaoSensorInput */

export const SENSOR_READING_EVENT = "orbis-sensor-reading"

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
      setMensagem("Faça login para carregar os sensores.")
      return
    }

    if (!silent) {
      setStatus("loading")
      setMensagem("Carregando sensores...")
    }

    try {
      const payload = await fetchDashboardJson("/sensores", session.accessToken, "os sensores")
      let sensoresNormalizados = normalizeSensorCollection(payload)

      try {
        const leiturasPayload = await fetchDashboardJson("/leituras", session.accessToken, "as leituras dos sensores")
        sensoresNormalizados = mergeSensorLeituras(sensoresNormalizados, leiturasPayload)
      } catch {}

      setSensores(refreshSensorStatuses(sensoresNormalizados))
      setStatus("success")
      setMensagem("")
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
      }

      setStatus("error")
      setMensagem(error instanceof Error ? error.message : "Não foi possível carregar os sensores.")
      setSensores((current) => (silent ? current : []))
      throw error
    }
  }, [])

  React.useEffect(() => {
    carregarSensores().catch(() => {})
  }, [carregarSensores])

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSensores((current) => refreshSensorStatuses(current))
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [])

  React.useEffect(() => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      return
    }

    const socket = io(API_URL, {
      auth: {
        token: session.accessToken,
        accessToken: session.accessToken,
      },
      query: {
        token: session.accessToken,
      },
      transports: ["websocket", "polling"],
    })

    function handleNovaLeitura(payload) {
      setSensores((current) => refreshSensorStatuses(mergeSensorLeitura(current, payload)))
      window.dispatchEvent(new CustomEvent(SENSOR_READING_EVENT, { detail: payload }))
    }

    socket.on("novaLeitura", handleNovaLeitura)
    socket.on("nova-leitura", handleNovaLeitura)

    return () => {
      socket.off("novaLeitura", handleNovaLeitura)
      socket.off("nova-leitura", handleNovaLeitura)
      socket.disconnect()
    }
  }, [])

  /**
   * @param {string} endpoint
   * @param {{ method: string, body?: any, contextLabel: string }} params
   */
  const executarMutacao = React.useCallback(async (endpoint, params) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      const error = new Error("Faça login para gerenciar os sensores.")
      setStatus("error")
      setMensagem(error.message)
      throw error
    }

    const permissions = getDashboardPermissions(session.usuario)

    if (!permissions.canManageSensores) {
      const error = new Error("Seu perfil tem acesso somente leitura para sensores.")
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
        error instanceof Error ? error.message : "Não foi possível concluir a operação nos sensores."
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
      contextLabel: "a atualização do sensor",
    })
  }, [executarMutacao])

  /**
   * @param {number} id
   */
  const excluirSensor = React.useCallback(async (id) => {
    await executarMutacao(`/sensores/${id}`, {
      method: "DELETE",
      contextLabel: "a exclusão do sensor",
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
