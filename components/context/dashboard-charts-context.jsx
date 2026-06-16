"use client"

import * as React from "react"

import { useDashboardBootstrap } from "@/components/context/dashboard-bootstrap-context"
import { useSensores } from "@/components/context/sensores-context"
import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import {
  fetchDashboardJson,
  getHttpErrorStatus,
  normalizeMaquinaCollection,
  normalizeSensorCollection,
  requestDashboardJson,
} from "@/lib/dashboard-api"
import {
  getIntegrityTrendDataFromHistories,
  getIntegrityTrendDataFromSnapshot,
  getMachineIntegrityTrendOptions,
  normalizeHistoricoIntegridadeCollection,
} from "@/lib/orbis-dashboard"

/** @typedef {import("@/lib/orbis-types").WithChildrenProps} WithChildrenProps */
/** @typedef {import("@/lib/orbis-types").DashboardChartsContextValue} DashboardChartsContextValue */

/** @type {DashboardChartsContextValue} */
const INITIAL_STATE = {
  status: "loading",
  mensagem: "Carregando dados do dashboard...",
  maquinas: [],
  sensores: [],
  integrityTrendData: [],
  machineIntegrityOptions: [],
  errors: {
    maquinas: "",
    sensores: "",
    integrityTrend: "",
  },
  notices: {
    integrityTrend: "",
  },
}

/** @type {React.Context<DashboardChartsContextValue | null>} */
const DashboardChartsContext = React.createContext(null)

/**
 * @param {WithChildrenProps} props
 */
export function DashboardChartsProvider({ children }) {
  const [state, setState] = React.useState(INITIAL_STATE)
  const dashboardBootstrap = useDashboardBootstrap()
  const sensoresContext = useSensores()

  React.useEffect(() => {
    if (dashboardBootstrap.status === "loading") {
      setState(INITIAL_STATE)
      return
    }

    if (dashboardBootstrap.status === "success") {
      const maquinas = dashboardBootstrap.snapshot.maquinas
      const sensores = dashboardBootstrap.snapshot.sensores
      const referenceDate = dashboardBootstrap.snapshot.generatedAt || new Date()
      const integrityTrendData = getIntegrityTrendDataFromSnapshot(maquinas, referenceDate)
      const integrityReferenceDate = integrityTrendData[integrityTrendData.length - 1]?.date ?? referenceDate
      const machineIntegrityOptions = getMachineIntegrityTrendOptions([], maquinas, integrityReferenceDate)

      setState({
        status: "success",
        mensagem: "",
        maquinas,
        sensores,
        integrityTrendData,
        machineIntegrityOptions,
        errors: {
          maquinas: "",
          sensores: "",
          integrityTrend: "",
        },
        notices: {
          integrityTrend: maquinas.length > 0
            ? "Histórico de integridade ainda indisponível. Exibindo integridade média atual da frota."
            : "",
        },
      })
      return
    }

    const session = getAuthSession()

    if (!session?.accessToken) {
      setState({
        ...INITIAL_STATE,
        status: "error",
        mensagem: "Faça login para carregar os dados do dashboard.",
      })
      return
    }

    let isActive = true

    async function carregarGraficos() {
      setState(INITIAL_STATE)

      const [maquinasResult, sensoresResult] = await Promise.allSettled([
        fetchDashboardJson("/maquinas", session.accessToken, "as máquinas do dashboard"),
        fetchDashboardJson("/sensores", session.accessToken, "os sensores do dashboard"),
      ])

      if (!isActive) {
        return
      }

      const authError = [maquinasResult, sensoresResult]
        .filter((result) => result.status === "rejected")
        .map((result) => /** @type {PromiseRejectedResult} */ (result).reason)
        .find((error) => getHttpErrorStatus(error) === 401)

      if (authError) {
        clearAuthSession()
        setState({
          ...INITIAL_STATE,
          status: "error",
          mensagem:
            authError instanceof Error
              ? authError.message
              : "Sua sessão expirou. Faça login novamente.",
        })
        return
      }

      const maquinas =
        maquinasResult.status === "fulfilled"
          ? normalizeMaquinaCollection(maquinasResult.value)
          : []
      const sensores =
        sensoresResult.status === "fulfilled"
          ? normalizeSensorCollection(sensoresResult.value)
          : []

      const historicoResults = maquinas.length > 0
        ? await Promise.allSettled(
            maquinas.map((maquina) =>
              requestDashboardJson(
                `/maquinas/${maquina.id}/historico-integridade?limite=720`,
                session.accessToken,
                `o histórico de integridade da máquina ${maquina.nome}`
              )
            )
          )
        : []

      if (!isActive) {
        return
      }

      const historicoAuthError = historicoResults
        .filter((result) => result.status === "rejected")
        .map((result) => /** @type {PromiseRejectedResult} */ (result).reason)
        .find((error) => getHttpErrorStatus(error) === 401)

      if (historicoAuthError) {
        clearAuthSession()
        setState({
          ...INITIAL_STATE,
          status: "error",
          mensagem:
            historicoAuthError instanceof Error
              ? historicoAuthError.message
              : "Sua sessão expirou. Faça login novamente.",
        })
        return
      }

      const machineHistories = historicoResults
        .map((result, index) => {
          const maquina = maquinas[index]

          return {
            maquina,
            historico: result.status === "fulfilled"
              ? normalizeHistoricoIntegridadeCollection(result.value, maquina)
              : [],
          }
        })

      const integrityTrendData = machineHistories.some((entry) => entry.historico.length > 0)
        ? getIntegrityTrendDataFromHistories(machineHistories, maquinas)
        : getIntegrityTrendDataFromSnapshot(maquinas)
      const integrityReferenceDate = integrityTrendData[integrityTrendData.length - 1]?.date
      const machineIntegrityOptions = getMachineIntegrityTrendOptions(machineHistories, maquinas, integrityReferenceDate)

      const errors = {
        maquinas:
          maquinasResult.status === "rejected" && maquinasResult.reason instanceof Error
            ? maquinasResult.reason.message
            : "",
        sensores:
          sensoresResult.status === "rejected" && sensoresResult.reason instanceof Error
            ? sensoresResult.reason.message
            : "",
        integrityTrend: historicoResults
          .filter((result) => result.status === "rejected" && result.reason instanceof Error)
          .map((result) => /** @type {PromiseRejectedResult} */ (result).reason.message)
          .find(Boolean) ?? "",
      }

      const notices = {
        integrityTrend:
          machineHistories.length > 0 && !machineHistories.some((entry) => entry.historico.length > 0) && maquinas.length > 0
            ? errors.integrityTrend
              ? `${errors.integrityTrend} Exibindo integridade média atual da frota.`
              : "Histórico de integridade ainda indisponível. Exibindo integridade média atual da frota."
            : "",
      }

      const hasResolvedCoreData =
        maquinasResult.status === "fulfilled" || sensoresResult.status === "fulfilled"
      const firstError =
        errors.maquinas || errors.sensores || errors.integrityTrend || "Não foi possível carregar os dados do dashboard."

      setState({
        status: hasResolvedCoreData ? "success" : "error",
        mensagem: hasResolvedCoreData ? "" : firstError,
        maquinas,
        sensores,
        integrityTrendData,
        machineIntegrityOptions,
        errors,
        notices,
      })
    }

    carregarGraficos().catch((error) => {
      if (!isActive) {
        return
      }

      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os dados do dashboard."

      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
      }

      setState({
        ...INITIAL_STATE,
        status: "error",
        mensagem: message,
      })
    })

    return () => {
      isActive = false
    }
  }, [dashboardBootstrap.status, dashboardBootstrap.snapshot])

  const value = React.useMemo(() => {
    const sensoresErro =
      sensoresContext.status === "error" ? sensoresContext.mensagem : state.errors.sensores
    const sensoresSincronizados =
      sensoresContext.sensores.length > 0 || sensoresContext.status !== "loading"
        ? sensoresContext.sensores
        : state.sensores

    return {
      ...state,
      sensores: sensoresSincronizados,
      errors: {
        ...state.errors,
        sensores: sensoresErro,
      },
    }
  }, [state, sensoresContext.sensores, sensoresContext.status, sensoresContext.mensagem])

  return (
    <DashboardChartsContext.Provider value={value}>
      {children}
    </DashboardChartsContext.Provider>
  )
}

/**
 * @returns {DashboardChartsContextValue}
 */
export function useDashboardCharts() {
  const context = React.useContext(DashboardChartsContext)

  if (!context) {
    throw new Error("useDashboardCharts deve ser usado dentro de DashboardChartsProvider")
  }

  return context
}
