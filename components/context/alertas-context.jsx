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

const STATUS_ALIASES = {
  ABERTO: "ATIVO",
  ATENDIDO: "RESOLVIDO",
  IGNORADO: "CANCELADO",
}

const STATUS_VALIDOS = new Set(["ATIVO", "EM_ANDAMENTO", "RESOLVIDO", "CANCELADO"])

const TRANSICOES_TECNICO = {
  ATIVO: new Set(["EM_ANDAMENTO"]),
  EM_ANDAMENTO: new Set(["RESOLVIDO"]),
}

const STATUS_CANCELAVEIS = new Set(["ATIVO", "EM_ANDAMENTO"])

function normalizeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

/**
 * @param {unknown} value
 * @returns {StatusAlerta}
 */
function normalizeAlertaStatus(value) {
  const normalized = normalizeString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .toUpperCase()

  const mapped = STATUS_ALIASES[normalized] ?? normalized

  return STATUS_VALIDOS.has(mapped) ? /** @type {StatusAlerta} */ (mapped) : "ATIVO"
}

/**
 * @param {StatusAlerta} statusAtual
 * @param {StatusAlerta} novoStatus
 * @returns {boolean}
 */
function canAtualizarStatus(statusAtual, novoStatus) {
  return TRANSICOES_TECNICO[statusAtual]?.has(novoStatus) ?? false
}

/**
 * @param {any} raw
 * @returns {Alerta}
 */
function normalizeAlerta(raw) {
  const { descricao, mensagem, status, ...rest } = raw && typeof raw === "object" ? raw : {}

  return {
    ...rest,
    maquinaId: rest.maquinaId ?? null,
    sensorId: rest.sensorId ?? null,
    tecnicoId: rest.tecnicoId ?? null,
    tecnicoNome: rest.tecnicoNome ?? null,
    status: normalizeAlertaStatus(status),
    mensagem: normalizeString(mensagem ?? descricao, "Chamado sem mensagem registrada."),
  }
}

/**
 * @param {unknown} value
 * @returns {Alerta[]}
 */
function normalizeAlertaCollection(value) {
  return Array.isArray(value) ? value.map((item) => normalizeAlerta(item)) : []
}

/** @type {Alerta[]} */
const ALERTAS_INICIAIS = normalizeAlertaCollection(dadosIniciais)

/** @type {React.Context<AlertasContextValue | null>} */
const AlertasContext = React.createContext(null)

/**
 * @returns {Alerta[]}
 */
function carregarAlertas() {
  if (typeof window === "undefined") return ALERTAS_INICIAIS

  try {
    const salvo = localStorage.getItem(STORAGE_KEY)
    return salvo ? normalizeAlertaCollection(JSON.parse(salvo)) : ALERTAS_INICIAIS
  } catch {
    return ALERTAS_INICIAIS
  }
}

function getAlertasMutationSession() {
  const session = getAuthSession()

  if (!session?.accessToken) {
    throw new Error("Faca login para gerenciar os chamados.")
  }

  return {
    session,
    permissions: getDashboardPermissions(session.usuario),
  }
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
    const { permissions } = getAlertasMutationSession()

    if (!permissions.canCreateAlertas) {
      throw new Error("Seu perfil pode apenas atualizar o status dos chamados.")
    }

    const novo = normalizeAlerta({
      ...dados,
      id: alertas.length > 0 ? Math.max(...alertas.map((alerta) => alerta.id)) + 1 : 1,
      maquinaId: dados.maquinaId ?? null,
      sensorId: dados.sensorId ?? null,
      status: "ATIVO",
      criadoEm: new Date().toISOString(),
      atualizadoEm: null,
    })

    setAlertas((prev) => [novo, ...prev])
    return novo
  }

  /**
   * @param {number} id
   * @param {AtualizacaoAlertaInput} dados
   */
  function editarAlerta(id, dados) {
    const { permissions } = getAlertasMutationSession()

    if (!permissions.canCreateAlertas) {
      throw new Error("Seu perfil pode apenas atualizar o status dos chamados.")
    }

    setAlertas((prev) => prev.map((alerta) => (alerta.id === id ? normalizeAlerta({ ...alerta, ...dados }) : alerta)))
  }

  /**
   * @param {number} id
   * @param {StatusAlerta} novoStatus
   */
  function atualizarStatus(id, novoStatus) {
    const { session, permissions } = getAlertasMutationSession()

    if (!permissions.canUpdateAlertStatus) {
      throw new Error("Seu perfil nao pode alterar chamados.")
    }

    const statusDestino = normalizeAlertaStatus(novoStatus)
    const chamadoAtual = alertas.find((alerta) => alerta.id === id)

    if (!chamadoAtual) {
      throw new Error("Chamado nao encontrado.")
    }

    if (!canAtualizarStatus(chamadoAtual.status, statusDestino)) {
      throw new Error("Este chamado nao pode seguir para o status selecionado.")
    }

    const usuario = session.usuario

    setAlertas((prev) =>
      prev.map((alerta) =>
        alerta.id === id
          ? {
              ...alerta,
              status: statusDestino,
              atualizadoEm: new Date().toISOString(),
              ...(statusDestino === "EM_ANDAMENTO"
                ? {
                    tecnicoId: usuario?.id ?? alerta.tecnicoId ?? null,
                    tecnicoNome: usuario?.nome || alerta.tecnicoNome || null,
                  }
                : {}),
            }
          : alerta
      )
    )
  }

  /**
   * @param {number} id
   */
  function cancelarAlerta(id) {
    const { permissions } = getAlertasMutationSession()

    if (!permissions.canDeleteAlertas) {
      throw new Error("Apenas administradores podem cancelar chamados.")
    }

    const chamadoAtual = alertas.find((alerta) => alerta.id === id)

    if (!chamadoAtual) {
      throw new Error("Chamado nao encontrado.")
    }

    if (!STATUS_CANCELAVEIS.has(chamadoAtual.status)) {
      throw new Error("Apenas chamados ativos ou em andamento podem ser cancelados.")
    }

    setAlertas((prev) =>
      prev.map((alerta) =>
        alerta.id === id
          ? {
              ...alerta,
              status: "CANCELADO",
              atualizadoEm: new Date().toISOString(),
            }
          : alerta
      )
    )
  }

  function resetarDados() {
    setAlertas(ALERTAS_INICIAIS)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AlertasContext.Provider value={{ alertas, adicionarAlerta, editarAlerta, atualizarStatus, cancelarAlerta, resetarDados }}>
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
