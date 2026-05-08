"use client"

import * as React from "react"

import { useSensores } from "@/components/context/sensores-context"
import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import {
  fetchDashboardJson,
  fetchFirstAvailableDashboardJson,
  getHttpErrorStatus,
  normalizeMaquinaCollection,
  normalizeSensorCollection,
} from "@/lib/dashboard-api"
import {
  getAlertTrendDataFromApi,
  getAlertTrendDataFromSnapshot,
} from "@/lib/orbis-dashboard"

/** @typedef {import("@/lib/orbis-types").WithChildrenProps} WithChildrenProps */
/** @typedef {import("@/lib/orbis-types").DashboardChartsContextValue} DashboardChartsContextValue */

const OPTIONAL_ALERT_TREND_ENDPOINTS = [
  "/dashboard/alertas-por-dia",
  "/dashboard/alertas-tendencia",
  "/dashboard/evolucao-alertas",
]

/** @type {DashboardChartsContextValue} */
const INITIAL_STATE = {
  status: "loading",
  mensagem: "Carregando dados do dashboard...",
  maquinas: [],
  sensores: [],
  alertTrendData: [],
  errors: {
    maquinas: "",
    sensores: "",
    alertTrend: "",
  },
  notices: {
    alertTrend: "",
  },
}

/** @type {React.Context<DashboardChartsContextValue | null>} */
const DashboardChartsContext = React.createContext(null)

/**
 * @param {WithChildrenProps} props
 */
export function DashboardChartsProvider({ children }) {
  const [state, setState] = React.useState(INITIAL_STATE)
  const sensoresContext = useSensores()

  React.useEffect(() => {
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

      const [maquinasResult, sensoresResult, alertTrendResult] = await Promise.allSettled([
        fetchDashboardJson("/maquinas", session.accessToken, "as máquinas do dashboard"),
        fetchDashboardJson("/sensores", session.accessToken, "os sensores do dashboard"),
        fetchFirstAvailableDashboardJson(
          OPTIONAL_ALERT_TREND_ENDPOINTS,
          session.accessToken,
          "a tendência de alertas do dashboard"
        ),
      ])

      if (!isActive) {
        return
      }

      const authError = [maquinasResult, sensoresResult, alertTrendResult]
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
      const alertTrendPayload =
        alertTrendResult.status === "fulfilled" ? alertTrendResult.value : null

      const alertTrendData = alertTrendPayload
        ? getAlertTrendDataFromApi(alertTrendPayload)
        : getAlertTrendDataFromSnapshot(sensores, maquinas)

      const errors = {
        maquinas:
          maquinasResult.status === "rejected" && maquinasResult.reason instanceof Error
            ? maquinasResult.reason.message
            : "",
        sensores:
          sensoresResult.status === "rejected" && sensoresResult.reason instanceof Error
            ? sensoresResult.reason.message
            : "",
        alertTrend:
          alertTrendResult.status === "rejected" && alertTrendResult.reason instanceof Error
            ? alertTrendResult.reason.message
            : "",
      }

      const notices = {
        alertTrend:
          !alertTrendPayload && (sensores.length > 0 || maquinas.length > 0)
            ? errors.alertTrend
              ? `${errors.alertTrend} Exibindo tendência derivada das últimas leituras sincronizadas.`
              : "Tendência derivada das últimas leituras sincronizadas."
            : "",
      }

      const hasResolvedCoreData =
        maquinasResult.status === "fulfilled" || sensoresResult.status === "fulfilled"
      const firstError =
        errors.maquinas || errors.sensores || errors.alertTrend || "Não foi possível carregar os dados do dashboard."

      setState({
        status: hasResolvedCoreData ? "success" : "error",
        mensagem: hasResolvedCoreData ? "" : firstError,
        maquinas,
        sensores,
        alertTrendData,
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
  }, [])

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
