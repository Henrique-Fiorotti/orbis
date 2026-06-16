"use client"

import * as React from "react"

import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import { getDashboardPermissions } from "@/lib/dashboard-permissions"
import {
  getHttpErrorStatus,
  mergeSensorLeituras,
  normalizeAlertaCollection,
  normalizeMaquinaCollection,
  normalizeManutencaoCollection,
  normalizeSensorCollection,
  normalizeSensorLeituraCollection,
  normalizeTecnicoCollection,
  requestDashboardJson,
} from "@/lib/dashboard-api"

const DASHBOARD_BOOTSTRAP_LIMIT = 5
const DASHBOARD_BOOTSTRAP_LISTAS_LIMIT = 20
const DASHBOARD_BOOTSTRAP_USUARIOS_LIMIT = 100
const DASHBOARD_BOOTSTRAP_TECNICOS_LIMIT = 10

const EMPTY_SNAPSHOT = {
  role: "",
  generatedAt: "",
  limites: null,
  resumo: null,
  maquinas: [],
  sensores: [],
  alertas: [],
  manutencoes: [],
  tecnicos: [],
  raw: null,
}

const INITIAL_STATE = {
  status: "loading",
  mensagem: "Carregando dashboard...",
  snapshot: EMPTY_SNAPSHOT,
}

const DashboardBootstrapContext = React.createContext(null)

function getCollectionPayload(value) {
  if (Array.isArray(value)) {
    return { dados: value }
  }

  if (value && typeof value === "object") {
    return value
  }

  return { dados: [] }
}

function mergeById(...groups) {
  const merged = new Map()
  const withoutId = []

  for (const group of groups) {
    for (const item of Array.isArray(group) ? group : []) {
      const id = item?.id

      if (id === null || id === undefined || id === "") {
        withoutId.push(item)
        continue
      }

      merged.set(String(id), item)
    }
  }

  return [...merged.values(), ...withoutId]
}

function buildBootstrapEndpoint(role) {
  const params = new URLSearchParams({
    limit: String(DASHBOARD_BOOTSTRAP_LIMIT),
    listasLimit: String(DASHBOARD_BOOTSTRAP_LISTAS_LIMIT),
  })

  if (role === "TECNICO") {
    params.set("usuariosLimit", String(DASHBOARD_BOOTSTRAP_USUARIOS_LIMIT))
    params.set("tecnicosLimit", String(DASHBOARD_BOOTSTRAP_TECNICOS_LIMIT))
    return `/dashboard/tecnico/completo?${params.toString()}`
  }

  return `/dashboard/completo?${params.toString()}`
}

function normalizeBootstrapPayload(payload, role) {
  const maquinas = normalizeMaquinaCollection(getCollectionPayload(payload?.maquinas?.lista ?? payload?.maquinas))
  const sensoresBase = normalizeSensorCollection(getCollectionPayload(payload?.sensores?.lista ?? payload?.sensores))
  const leiturasRecentes = normalizeSensorLeituraCollection(getCollectionPayload(payload?.leiturasRecentes))
  const sensores = mergeSensorLeituras(sensoresBase, { dados: leiturasRecentes })

  const alertasAtivos = normalizeAlertaCollection(getCollectionPayload(payload?.alertas?.ativos))
  const alertasTecnico = normalizeAlertaCollection(getCollectionPayload(payload?.alertas?.doTecnico))
  const alertasTop = normalizeAlertaCollection(getCollectionPayload(payload?.alertas?.topAtivos))
  const alertas = role === "TECNICO"
    ? mergeById(alertasAtivos, alertasTecnico)
    : mergeById(alertasAtivos, alertasTop)

  const tecnicos = normalizeTecnicoCollection(getCollectionPayload(payload?.tecnicos))

  return {
    role,
    generatedAt: typeof payload?.generatedAt === "string" ? payload.generatedAt : "",
    limites: payload?.limites ?? null,
    resumo: payload?.resumo ?? null,
    maquinas,
    sensores,
    alertas,
    manutencoes: normalizeManutencaoCollection(getCollectionPayload(payload?.manutencoes)),
    tecnicos,
    raw: payload,
  }
}

export function DashboardBootstrapProvider({ children }) {
  const [state, setState] = React.useState(INITIAL_STATE)

  React.useEffect(() => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      setState({
        status: "error",
        mensagem: "Faça login para carregar o dashboard.",
        snapshot: EMPTY_SNAPSHOT,
      })
      return
    }

    const permissions = getDashboardPermissions(session.usuario)
    const role = permissions.role

    if (!permissions.isAdmin && !permissions.isVisitante && !permissions.isTecnico) {
      setState({
        status: "success",
        mensagem: "",
        snapshot: { ...EMPTY_SNAPSHOT, role },
      })
      return
    }

    const controller = new AbortController()
    let isActive = true

    async function loadBootstrap() {
      setState(INITIAL_STATE)

      try {
        const payload = await requestDashboardJson(
          buildBootstrapEndpoint(role),
          session.accessToken,
          "o dashboard completo",
          { signal: controller.signal }
        )

        if (!isActive) {
          return
        }

        setState({
          status: "success",
          mensagem: "",
          snapshot: normalizeBootstrapPayload(payload, role),
        })
      } catch (error) {
        if (!isActive || error?.name === "AbortError") {
          return
        }

        if (getHttpErrorStatus(error) === 401) {
          clearAuthSession()
        }

        setState({
          status: "error",
          mensagem: error instanceof Error ? error.message : "Não foi possível carregar o dashboard completo.",
          snapshot: { ...EMPTY_SNAPSHOT, role },
        })
      }
    }

    loadBootstrap()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [])

  const value = React.useMemo(() => state, [state])

  return (
    <DashboardBootstrapContext.Provider value={value}>
      {children}
    </DashboardBootstrapContext.Provider>
  )
}

export function useDashboardBootstrap() {
  const context = React.useContext(DashboardBootstrapContext)

  if (!context) {
    throw new Error("useDashboardBootstrap deve ser usado dentro de DashboardBootstrapProvider")
  }

  return context
}

export function useIsDashboardHome(pathname) {
  return pathname === "/dashboard"
}
