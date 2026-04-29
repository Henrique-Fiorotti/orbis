"use client"

import * as React from "react"
import dadosIniciais from "@/app/dashboard/alertas/data.json"
import { getAuthSession } from "@/lib/auth-session"
import { getDashboardPermissions } from "@/lib/dashboard-permissions"

/** @typedef {import("@/lib/orbis-types").WithChildrenProps} WithChildrenProps */
/** @typedef {import("@/lib/orbis-types").Alerta} Alerta */
/** @typedef {import("@/lib/orbis-types").NovoAlertaInput} NovoAlertaInput */
/** @typedef {import("@/lib/orbis-types").AtualizacaoAlertaInput} AtualizacaoAlertaInput */
/** @typedef {import("@/lib/orbis-types").StatusAlerta} StatusAlerta */
/** @typedef {import("@/lib/orbis-types").AlertasContextValue} AlertasContextValue */

const STORAGE_KEY = "orbis-alertas"

/** @type {Alerta[]} */
const ALERTAS_INICIAIS = dadosIniciais

/** @type {React.Context<AlertasContextValue | null>} */
const AlertasContext = React.createContext(null)

/**
 * @returns {Alerta[]}
 */
function carregarAlertas() {
  if (typeof window === "undefined") return ALERTAS_INICIAIS

  try {
    const salvo = localStorage.getItem(STORAGE_KEY)
    return salvo ? /** @type {Alerta[]} */ (JSON.parse(salvo)) : ALERTAS_INICIAIS
  } catch {
    return ALERTAS_INICIAIS
  }
}

function getAlertasMutationPermissions() {
  const session = getAuthSession()

  if (!session?.accessToken) {
    throw new Error("Faca login para gerenciar os alertas.")
  }

  return getDashboardPermissions(session.usuario)
}

/**
 * @param {WithChildrenProps} props
 */
export function AlertasProvider({ children }) {
  const [alertas, setAlertas] = React.useState(() => carregarAlertas())

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alertas))
    } catch {}
  }, [alertas])

  /**
   * @param {NovoAlertaInput} dados
   * @returns {Alerta}
   */
  function adicionarAlerta(dados) {
    const permissions = getAlertasMutationPermissions()

    if (!permissions.canCreateAlertas) {
      throw new Error("Seu perfil pode apenas atualizar o status dos alertas.")
    }

    const novo = {
      ...dados,
      id: alertas.length > 0 ? Math.max(...alertas.map((alerta) => alerta.id)) + 1 : 1,
      maquinaId: dados.maquinaId ?? null,
      sensorId: dados.sensorId ?? null,
      status: "ABERTO",
      criadoEm: new Date().toISOString(),
    }

    setAlertas((prev) => [novo, ...prev])
    return novo
  }

  /**
   * @param {number} id
   * @param {AtualizacaoAlertaInput} dados
   */
  function editarAlerta(id, dados) {
    const permissions = getAlertasMutationPermissions()

    if (!permissions.canCreateAlertas) {
      throw new Error("Seu perfil pode apenas atualizar o status dos alertas.")
    }

    setAlertas((prev) => prev.map((alerta) => (alerta.id === id ? { ...alerta, ...dados } : alerta)))
  }

  /**
   * @param {number} id
   * @param {StatusAlerta} novoStatus
   */
  function atualizarStatus(id, novoStatus) {
    const permissions = getAlertasMutationPermissions()

    if (!permissions.canUpdateAlertStatus) {
      throw new Error("Seu perfil nao pode alterar alertas.")
    }

    setAlertas((prev) => prev.map((alerta) => (alerta.id === id ? { ...alerta, status: novoStatus } : alerta)))
  }

  /**
   * @param {number} id
   */
  function excluirAlerta(id) {
    const permissions = getAlertasMutationPermissions()

    if (!permissions.canDeleteAlertas) {
      throw new Error("Seu perfil pode apenas atualizar o status dos alertas.")
    }

    setAlertas((prev) => prev.filter((alerta) => alerta.id !== id))
  }

  function resetarDados() {
    setAlertas(ALERTAS_INICIAIS)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AlertasContext.Provider value={{ alertas, adicionarAlerta, editarAlerta, atualizarStatus, excluirAlerta, resetarDados }}>
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
