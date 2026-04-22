// @ts-check

/** @typedef {import("@/lib/orbis-types").Maquina} Maquina */
/** @typedef {import("@/lib/orbis-types").Sensor} Sensor */

import { apiFetch } from "@/utils/apiFetch"

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://orbis-5hnm.onrender.com"

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function normalizeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function normalizeUppercase(value) {
  return normalizeString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .toUpperCase()
}

function createHttpError(status, message) {
  const error = new Error(message)
  // @ts-expect-error - enriching runtime error for status-aware handling.
  error.status = status
  return error
}

/**
 * @param {unknown} error
 * @returns {number | null}
 */
export function getHttpErrorStatus(error) {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return null
  }

  return toNumber(error.status, NaN)
}

/**
 * @param {number} statusCode
 * @param {Record<string, any> | null} payload
 * @param {string} contextLabel
 * @returns {string}
 */
export function getDashboardErrorMessage(statusCode, payload, contextLabel = "o dashboard") {
  if (statusCode === 401) {
    return "Sua sessao expirou. Faca login novamente."
  }

  if (statusCode === 403) {
    return `Seu usuario nao tem permissao para visualizar ${contextLabel}.`
  }

  return payload?.mensagem || payload?.message || `Erro ${statusCode} ao carregar ${contextLabel}.`
}

/**
 * @param {string} endpoint
 * @param {string} accessToken
 * @param {string} contextLabel
 * @param {{ method?: string, body?: any, headers?: Record<string, string>, cache?: RequestCache }} [options]
 * @returns {Promise<any>}
 */
export async function requestDashboardJson(endpoint, accessToken, contextLabel, options = {}) {
  const { method = "GET", body, headers = {}, cache = "no-store" } = options

  try {
    return await apiFetch(endpoint, {
      auth: typeof window === "undefined" ? "token" : "auto",
      accessToken: typeof window === "undefined" ? accessToken : null,
      method,
      body,
      headers,
      cache,
    })
  } catch (error) {
    const statusCode = getHttpErrorStatus(error)

    if (statusCode) {
      throw createHttpError(
        statusCode,
        getDashboardErrorMessage(statusCode, error?.payload ?? null, contextLabel)
      )
    }

    if (error instanceof Error) {
      throw error
    }

    throw createHttpError(500, `Nao foi possivel carregar ${contextLabel}.`)
  }
}

/**
 * @param {string} endpoint
 * @param {string} accessToken
 * @param {string} contextLabel
 * @returns {Promise<any>}
 */
export async function fetchDashboardJson(endpoint, accessToken, contextLabel) {
  return requestDashboardJson(endpoint, accessToken, contextLabel)
}

/**
 * @param {string[]} endpoints
 * @param {string} accessToken
 * @param {string} contextLabel
 * @returns {Promise<any | null>}
 */
export async function fetchFirstAvailableDashboardJson(endpoints, accessToken, contextLabel) {
  for (const endpoint of endpoints) {
    try {
      return await fetchDashboardJson(endpoint, accessToken, contextLabel)
    } catch (error) {
      const status = getHttpErrorStatus(error)

      if (status === 404) {
        continue
      }

      throw error
    }
  }

  return null
}

/**
 * @param {any} payload
 * @returns {any[]}
 */
export function extractCollection(payload) {
  const candidates = [
    payload,
    payload?.content,
    payload?.dados,
    payload?.data,
    payload?.items,
    payload?.resultado,
    payload?.results,
    payload?.maquinas,
    payload?.sensores,
    payload?.alertas,
    payload?.registros,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
    }
  }

  return []
}

function normalizeCriticidade(value) {
  const normalized = normalizeUppercase(value)

  if (normalized === "ALTA" || normalized === "MEDIA" || normalized === "BAIXA") {
    return normalized
  }

  if (normalized === "MEDIUM") {
    return "MEDIA"
  }

  if (normalized === "LOW") {
    return "BAIXA"
  }

  return "MEDIA"
}

function normalizeMaquinaStatus(value, integridade) {
  const normalized = normalizeUppercase(value)

  if (["OK", "ONLINE", "ATIVO", "OPERANDO"].includes(normalized)) {
    return "OK"
  }

  if (
    [
      "ALERTA",
      "EM_ALERTA",
      "CRITICO",
      "CRITICA",
      "CRITICAL",
      "FALHA",
      "ERRO",
      "OFFLINE",
      "MANUTENCAO",
      "MANUTENCAO_PROGRAMADA",
    ].includes(normalized)
  ) {
    return "ALERTA"
  }

  return integridade < 70 ? "ALERTA" : "OK"
}

function normalizeSensorStatus(value) {
  const normalized = normalizeUppercase(value)

  if (["ONLINE", "ATIVO", "OK"].includes(normalized)) {
    return "ONLINE"
  }

  return "OFFLINE"
}

/**
 * @param {any} leitura
 * @param {string} prefix
 * @param {any} source
 * @returns {Sensor["temperatura"]}
 */
function normalizeLeitura(leitura, prefix, source) {
  const nested = leitura && typeof leitura === "object" ? leitura : null
  const valorAtual = toNumber(
    nested?.valorAtual ?? source?.[`${prefix}Atual`] ?? source?.[prefix]?.valor ?? source?.[prefix],
    NaN
  )
  const limiteMin = toNumber(
    nested?.limiteMin ?? source?.[`${prefix}Min`] ?? source?.[`${prefix}Minimo`],
    NaN
  )
  const limiteMax = toNumber(
    nested?.limiteMax ?? source?.[`${prefix}Max`] ?? source?.[`${prefix}Maximo`],
    NaN
  )

  if (![valorAtual, limiteMin, limiteMax].some(Number.isFinite)) {
    return null
  }

  return {
    valorAtual: Number.isFinite(valorAtual) ? valorAtual : 0,
    limiteMin: Number.isFinite(limiteMin) ? limiteMin : 0,
    limiteMax: Number.isFinite(limiteMax) ? limiteMax : 0,
  }
}

/**
 * @param {any} raw
 * @param {number} index
 * @returns {Maquina | null}
 */
function normalizeMaquina(raw, index) {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const integridade = clamp(
    toNumber(raw.integridade ?? raw.saude ?? raw.healthScore ?? raw.integridadeMedia, 0),
    0,
    100
  )
  const sensores = Array.isArray(raw.sensores)
    ? raw.sensores.length
    : toNumber(raw.sensores ?? raw.totalSensores ?? raw.quantidadeSensores ?? raw.sensoresOnline, 0)

  return {
    id: toNumber(raw.id ?? raw.maquinaId, index + 1),
    nome: normalizeString(raw.nome ?? raw.nomeMaquina ?? raw.name, `Maquina ${index + 1}`),
    setor: normalizeString(raw.setor ?? raw.area ?? raw.linha ?? raw.localizacao, "Sem setor"),
    tipo: normalizeString(raw.tipo ?? raw.tipoMaquina ?? raw.categoria ?? raw.modelo, "Maquina"),
    criticidade: normalizeCriticidade(raw.criticidade ?? raw.nivelCriticidade ?? raw.prioridade),
    integridade,
    scoreEstabilidade: clamp(
      toNumber(raw.scoreEstabilidade ?? raw.estabilidade ?? raw.stabilityScore ?? raw.score, integridade),
      0,
      100
    ),
    status: normalizeMaquinaStatus(raw.status ?? raw.estado ?? raw.situacao, integridade),
    ultimaLeituraEm: normalizeString(
      raw.ultimaLeituraEm ?? raw.ultimaAtualizacao ?? raw.updatedAt ?? raw.dataUltimaLeitura,
      new Date().toISOString()
    ),
    sensores: Math.max(sensores, 0),
  }
}

/**
 * @param {any} raw
 * @param {number} index
 * @returns {Sensor | null}
 */
function normalizeSensor(raw, index) {
  if (!raw || typeof raw !== "object") {
    return null
  }

  return {
    id: toNumber(raw.id ?? raw.sensorId, index + 1),
    nome: normalizeString(raw.nome ?? raw.nomeSensor ?? raw.name, `Sensor ${index + 1}`),
    maquinaId: toNumber(raw.maquinaId ?? raw.idMaquina, 0),
    maquinaNome: normalizeString(raw.maquinaNome ?? raw.nomeMaquina ?? raw.maquina?.nome, "Maquina"),
    status: normalizeSensorStatus(raw.status ?? raw.estado ?? raw.situacao),
    ultimaLeituraEm: normalizeString(
      raw.ultimaLeituraEm ?? raw.ultimaAtualizacao ?? raw.updatedAt ?? raw.dataUltimaLeitura,
      new Date().toISOString()
    ),
    temperatura: normalizeLeitura(raw.temperatura, "temperatura", raw),
    vibracao: normalizeLeitura(raw.vibracao, "vibracao", raw),
  }
}

/**
 * @param {any} payload
 * @returns {Maquina[]}
 */
export function normalizeMaquinaCollection(payload) {
  return extractCollection(payload)
    .map((item, index) => normalizeMaquina(item, index))
    .filter(Boolean)
}

/**
 * @param {any} payload
 * @returns {Sensor[]}
 */
export function normalizeSensorCollection(payload) {
  return extractCollection(payload)
    .map((item, index) => normalizeSensor(item, index))
    .filter(Boolean)
}
