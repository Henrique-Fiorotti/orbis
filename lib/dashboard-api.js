/** @typedef {import("@/lib/orbis-types").Maquina} Maquina */
/** @typedef {import("@/lib/orbis-types").Sensor} Sensor */
/** @typedef {import("@/lib/orbis-types").Tecnico} Tecnico */
/** @typedef {import("@/lib/orbis-types").Admin} Admin */
/** @typedef {import("@/lib/orbis-types").Alerta} Alerta */
/** @typedef {import("@/lib/orbis-types").DashboardAiResponse} DashboardAiResponse */

import { API_URL as ORBIS_API_URL, apiFetch } from "@/utils/apiFetch"
import { normalizeManutencaoRecord } from "./maintenance-contract.mjs"
import { normalizePredictiveMaintenanceState } from "./prediction-contract.mjs"

export const API_URL = ORBIS_API_URL

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function normalizeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function normalizeTimestamp(value, fallback = "") {
  if (typeof value === "string" && value.trim()) {
    return value.trim()
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value)
    return Number.isFinite(date.getTime()) ? date.toISOString() : fallback
  }

  return fallback
}

function getCreatedTimestampFromSource(source) {
  if (!source || typeof source !== "object") {
    return ""
  }

  return normalizeTimestamp(
    source.criadoEm ??
      source.criado_em ??
      source.createdAt ??
      source.created_at ??
      source.dataCriacao ??
      source.data_criacao ??
      source.dataCadastro ??
      source.data_cadastro ??
      source.cadastradoEm ??
      source.cadastrado_em ??
      source.cadastroEm ??
      source.registeredAt ??
      source.insertedAt,
    ""
  )
}

export function getUsuarioCriadoEm(raw) {
  if (!raw || typeof raw !== "object") {
    return ""
  }

  const wrappedSources = [raw.dados, raw.data, raw.resultado].filter(
    (source) => source && typeof source === "object" && !Array.isArray(source)
  )
  const usuario = raw.usuario && typeof raw.usuario === "object" ? raw.usuario : null
  const usuarioSemSenha = raw.usuarioSemSenha && typeof raw.usuarioSemSenha === "object" ? raw.usuarioSemSenha : null
  const perfil = raw.perfil && typeof raw.perfil === "object" ? raw.perfil : null

  return (
    getCreatedTimestampFromSource(raw) ||
    getCreatedTimestampFromSource(usuario) ||
    getCreatedTimestampFromSource(usuarioSemSenha) ||
    getCreatedTimestampFromSource(perfil) ||
    wrappedSources.map((source) => getUsuarioCriadoEm(source)).find(Boolean) ||
    ""
  )
}

function normalizeUppercase(value) {
  return normalizeString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .toUpperCase()
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
    return "Sua sessÃ£o expirou. FaÃ§a login novamente."
  }

  if (statusCode === 403) {
    return payload?.mensagem || payload?.message || `Seu usuÃ¡rio nÃ£o tem permissÃ£o para acessar ${contextLabel}.`
  }

  return payload?.mensagem || payload?.message || `Erro ${statusCode} ao carregar ${contextLabel}.`
}

/**
 * @param {string} endpoint
 * @param {string} accessToken
 * @param {string} contextLabel
 * @param {{ method?: string, body?: any, headers?: Record<string, string>, cache?: RequestCache, signal?: AbortSignal }} [options]
 * @returns {Promise<any>}
 */
export async function requestDashboardJson(endpoint, accessToken, contextLabel, options = {}) {
  return apiFetch(endpoint, { ...options, accessToken, contextLabel })
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
 * @param {string} pergunta
 * @returns {DashboardAiResponse}
 */
function normalizeDashboardAiResponse(payload, pergunta) {
  const source = payload && typeof payload === "object" ? payload : {}
  const resposta =
    typeof payload === "string"
      ? payload.trim()
      : normalizeString(source.resposta ?? source.answer ?? source.message ?? source.mensagem, "")
  const confirmation =
    source.confirmation && typeof source.confirmation === "object"
      ? source.confirmation
      : null
  const disambiguation =
    source.disambiguation && typeof source.disambiguation === "object"
      ? source.disambiguation
      : null

  return {
    pergunta: normalizeString(source.pergunta ?? source.question, pergunta),
    resposta,
    contextoGeradoEm:
      normalizeString(source.contextoGeradoEm ?? source.contextGeneratedAt ?? source.generatedAt, "") || null,
    readOnly: Boolean(source.readOnly),
    requiresConfirmation: Boolean(!source.readOnly && source.requiresConfirmation && confirmation?.id),
    confirmation,
    confirmationResolved: Boolean(source.confirmationResolved),
    confirmationDecision: normalizeString(source.confirmationDecision, "") || null,
    confirmationId: normalizeString(source.confirmationId, "") || null,
    actionResult: source.actionResult && typeof source.actionResult === "object" ? source.actionResult : null,
    requiresDisambiguation: Boolean(source.requiresDisambiguation && Array.isArray(disambiguation?.options)),
    disambiguation,
  }
}

/**
 * @param {string} pergunta
 * @param {string} accessToken
 * @param {{ signal?: AbortSignal, historico?: { role: "user" | "assistant", content: string }[], confirmationResponse?: { id: string, decision: "confirm" | "cancel" } }} [options]
 * @returns {Promise<DashboardAiResponse>}
 */
export async function askDashboardAi(pergunta, accessToken, options = {}) {
  const normalizedQuestion = normalizeString(pergunta)
  const historico = Array.isArray(options.historico) ? options.historico : []
  const confirmationResponse =
    options.confirmationResponse && typeof options.confirmationResponse === "object"
      ? options.confirmationResponse
      : null
  const body = {
    pergunta: normalizedQuestion,
    historico,
  }

  if (confirmationResponse) {
    body.confirmationResponse = confirmationResponse
  }

  const payload = await requestDashboardJson(
    "/dashboard/ia/perguntar",
    accessToken,
    "a resposta da IA",
    {
      method: "POST",
      body,
      signal: options.signal,
    }
  )

  return normalizeDashboardAiResponse(payload, normalizedQuestion)
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
    payload?.tecnicos,
    payload?.admins,
    payload?.administradores,
    payload?.usuarios,
    payload?.alertas,
    payload?.historico,
    payload?.historicoIntegridade,
    payload?.historico_integridade,
    payload?.historicos,
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

const SENSOR_OFFLINE_AFTER_MS = 20 * 1000

function isSensorReadingFresh(value) {
  if (!value) {
    return false
  }

  const timestamp = Date.parse(value)

  if (!Number.isFinite(timestamp)) {
    return false
  }

  return timestamp >= Date.now() || Date.now() - timestamp <= SENSOR_OFFLINE_AFTER_MS
}

function getSensorRuntimeStatus(statusValue, active, maquinaId, ultimaLeituraEm) {
  if (!active || maquinaId === null) {
    return "OFFLINE"
  }

  const status = normalizeSensorStatus(statusValue)

  if (status !== "ONLINE") {
    return status
  }

  return isSensorReadingFresh(ultimaLeituraEm) ? "ONLINE" : "OFFLINE"
}

function normalizeTecnicoStatus(value, activeValue) {
  const normalized = normalizeUppercase(value)

  if (["ATIVO", "ACTIVE", "ONLINE", "DISPONIVEL"].includes(normalized)) {
    return "ATIVO"
  }

  if (["INATIVO", "INACTIVE", "OFFLINE", "INDISPONIVEL", "BLOQUEADO"].includes(normalized)) {
    return "INATIVO"
  }

  if (activeValue !== undefined && activeValue !== null) {
    return normalizeBoolean(activeValue, true) ? "ATIVO" : "INATIVO"
  }

  return "ATIVO"
}

function normalizeAdminStatus(value, activeValue) {
  return normalizeTecnicoStatus(value, activeValue)
}

function getUsuarioRoleValue(item) {
  if (!item || typeof item !== "object") {
    return ""
  }

  return normalizeUppercase(
    item.role ??
      item.usuario?.role ??
      item.usuarioSemSenha?.role ??
      item.perfil?.role ??
      item.tipoUsuario
  )
}

export function isAdminRecord(item, assumeAdminWhenRoleMissing = false) {
  const role = getUsuarioRoleValue(item)
  return role ? role === "ADMIN" : assumeAdminWhenRoleMissing
}

function normalizeAlertaStatus(value) {
  const normalized = normalizeUppercase(value)
  const mapped = {
    ABERTO: "ATIVO",
    DISPONIVEL: "ATIVO",
    PENDENTE: "ATIVO",
    ATENDIDO: "RESOLVIDO",
    ENCERRADO: "RESOLVIDO",
    IGNORADO: "CANCELADO",
  }[normalized] ?? normalized

  if (["ATIVO", "EM_ANDAMENTO", "RESOLVIDO", "CANCELADO"].includes(mapped)) {
    return mapped
  }

  return "ATIVO"
}

function normalizeManutencaoTipo(value, alertaId) {
  const normalized = normalizeUppercase(value)

  if (normalized === "PREVENTIVA") {
    return "PREVENTIVA"
  }

  if (normalized === "CORRETIVA" || alertaId !== null) {
    return "CORRETIVA"
  }

  return "PREVENTIVA"
}

function normalizeManutencaoStatus(value) {
  const normalized = normalizeUppercase(value)
  const mapped = {
    ABERTO: "EM_ANDAMENTO",
    ATIVO: "EM_ANDAMENTO",
    ANDAMENTO: "EM_ANDAMENTO",
    EM_ATENDIMENTO: "EM_ANDAMENTO",
    INICIADO: "EM_ANDAMENTO",
    INICIADA: "EM_ANDAMENTO",
    PENDENTE: "EM_ANDAMENTO",
    CONCLUIDO: "RESOLVIDO",
    CONCLUIDA: "RESOLVIDO",
    FINALIZADO: "RESOLVIDO",
    FINALIZADA: "RESOLVIDO",
    ENCERRADO: "RESOLVIDO",
    ENCERRADA: "RESOLVIDO",
  }[normalized] ?? normalized

  if (["EM_ANDAMENTO", "RESOLVIDO", "CANCELADO", "ENCERRADO_SEM_SOLUCAO"].includes(mapped)) {
    return mapped
  }

  return "EM_ANDAMENTO"
}

function normalizeAlertaTipo(value) {
  const normalized = normalizeUppercase(value)

  if (
    [
      "LIMITE_ULTRAPASSADO",
      "TENDENCIA_CURTA",
      "TENDENCIA_LONGA",
      "DEGRADACAO_ACELERADA",
      "INSTABILIDADE",
    ].includes(normalized)
  ) {
    return normalized
  }

  return "LIMITE_ULTRAPASSADO"
}

function normalizeAlertaSeveridade(value, tipo) {
  const normalized = normalizeUppercase(value)

  if (["ALTA", "MEDIA", "BAIXA"].includes(normalized)) {
    return normalized
  }

  if (["LIMITE_ULTRAPASSADO", "DEGRADACAO_ACELERADA", "INSTABILIDADE"].includes(tipo)) {
    return "ALTA"
  }

  if (tipo === "TENDENCIA_LONGA") {
    return "MEDIA"
  }

  return "BAIXA"
}

const ALERTA_RECENTE_WINDOW_MS = 30 * 60 * 1000
const ALERTA_REPETICAO_MIN_INTERVAL_MS = 3 * 60 * 1000
const ALERTA_EVENTOS_OPERACIONAIS = new Set(["CRIADO", "ATUALIZADO", "REABERTO"])

function getOperationalAlertEvents(raw) {
  const eventos = Array.isArray(raw?.eventos) ? raw.eventos : []
  return eventos.filter((evento) => ALERTA_EVENTOS_OPERACIONAIS.has(normalizeUppercase(evento?.tipo)))
}

function getOperationalAlertEventDate(evento) {
  return normalizeString(
    evento?.criadoEm ??
      evento?.createdAt ??
      evento?.dataCriacao ??
      evento?.timestamp,
    ""
  )
}

function getDistinctAlertOccurrenceCount(raw, fallbackCount, criadoEm, ultimaOcorrenciaEm) {
  const eventTimestamps = getOperationalAlertEvents(raw)
    .map((evento) => Date.parse(getOperationalAlertEventDate(evento)))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)

  if (eventTimestamps.length > 0) {
    let count = 0
    let lastCountedAt = null

    for (const timestamp of eventTimestamps) {
      if (lastCountedAt === null || timestamp - lastCountedAt >= ALERTA_REPETICAO_MIN_INTERVAL_MS) {
        count += 1
        lastCountedAt = timestamp
      }
    }

    return Math.max(count, 1)
  }

  const firstTimestamp = Date.parse(criadoEm)
  const latestTimestamp = Date.parse(ultimaOcorrenciaEm)

  if (
    fallbackCount > 1 &&
    Number.isFinite(firstTimestamp) &&
    Number.isFinite(latestTimestamp) &&
    latestTimestamp - firstTimestamp >= ALERTA_REPETICAO_MIN_INTERVAL_MS
  ) {
    return fallbackCount
  }

  return 1
}

function getLatestOperationalAlertDate(raw, fallback) {
  const eventos = getOperationalAlertEvents(raw)
  const latestEvent = eventos
    .map((evento) => getOperationalAlertEventDate(evento))
    .filter(Boolean)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0]

  return normalizeString(
    raw?.ultimaOcorrenciaEm ??
      raw?.ultimaOcorrencia ??
      raw?.ultimaAtualizacao ??
      latestEvent ??
      raw?.atualizadoEm ??
      raw?.updatedAt ??
      fallback,
    fallback
  )
}

function getAlertaRecencia(value) {
  const timestamp = Date.parse(value)

  if (!Number.isFinite(timestamp)) {
    return "ANTIGO"
  }

  return Date.now() - timestamp <= ALERTA_RECENTE_WINDOW_MS ? "RECENTE" : "ANTIGO"
}

function normalizeBoolean(value, fallback = true) {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    const normalized = normalizeUppercase(value)

    if (["TRUE", "ATIVO", "ACTIVE", "ONLINE", "1"].includes(normalized)) {
      return true
    }

    if (["FALSE", "INATIVO", "INACTIVE", "OFFLINE", "0"].includes(normalized)) {
      return false
    }
  }

  return fallback
}

function getMetricCurrentValue(leitura, prefix, source) {
  const nested = leitura && typeof leitura === "object" ? leitura : null
  const latestKey = prefix === "temperatura" ? "ultimaTemperatura" : "ultimaVibracao"

  return toNumber(
    nested?.valorAtual ??
      nested?.valor ??
      source?.[latestKey] ??
      source?.[`${prefix}Atual`] ??
      source?.[prefix],
    NaN
  )
}

/**
 * @param {any} leitura
 * @param {string} prefix
 * @param {any} source
 * @returns {Sensor["temperatura"]}
 */
function normalizeLeitura(leitura, prefix, source) {
  const nested = leitura && typeof leitura === "object" ? leitura : null
  const valorAtual = getMetricCurrentValue(leitura, prefix, source)
  const limiteMin = toNumber(
    nested?.limiteMin ?? source?.[`${prefix}Min`] ?? source?.[`${prefix}Minimo`],
    0
  )
  const limiteMaxFallback = prefix === "temperatura" ? source?.limiteTemperatura : source?.limiteVibracao
  const limiteMax = toNumber(
    nested?.limiteMax ?? source?.[`${prefix}Max`] ?? source?.[`${prefix}Maximo`] ?? limiteMaxFallback,
    0
  )

  if (!Number.isFinite(valorAtual)) {
    return null
  }

  return {
    valorAtual,
    limiteMin,
    limiteMax,
  }
}

/**
 * @param {any} raw
 * @returns {{ id: number | null, sensorId: number, temperatura: number | null, vibracao: number | null, criadoEm: string } | null}
 */
function normalizeSensorLeitura(raw) {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const sensorId = toNumber(raw.sensorId ?? raw.sensor_id ?? raw.sensor?.id, NaN)
  const temperatura = toNumber(raw.temperatura ?? raw.temperature ?? raw.temp, NaN)
  const vibracao = toNumber(raw.vibracao ?? raw.vibracao_rms ?? raw.vibration, NaN)

  if (!Number.isInteger(sensorId) || (!Number.isFinite(temperatura) && !Number.isFinite(vibracao))) {
    return null
  }

  return {
    id: Number.isFinite(toNumber(raw.id ?? raw.leituraId, NaN)) ? toNumber(raw.id ?? raw.leituraId) : null,
    sensorId,
    temperatura: Number.isFinite(temperatura) ? temperatura : null,
    vibracao: Number.isFinite(vibracao) ? vibracao : null,
    criadoEm: normalizeString(raw.criadoEm ?? raw.timestamp ?? raw.createdAt, new Date().toISOString()),
  }
}

function isAfterOrEqualDate(value, reference) {
  const valueTime = Date.parse(value)
  const referenceTime = Date.parse(reference)

  if (!Number.isFinite(valueTime)) {
    return false
  }

  if (!Number.isFinite(referenceTime)) {
    return true
  }

  return valueTime >= referenceTime
}

/**
 * @param {Sensor} sensor
 * @param {{ sensorId: number, temperatura: number | null, vibracao: number | null, criadoEm: string }} leitura
 * @returns {Sensor}
 */
function applySensorLeitura(sensor, leitura) {
  const temperatura =
    leitura.temperatura === null
      ? sensor.temperatura
      : {
          valorAtual: leitura.temperatura,
          limiteMin: sensor.temperatura?.limiteMin ?? 0,
          limiteMax: sensor.temperatura?.limiteMax ?? sensor.limiteTemperatura,
        }
  const vibracao =
    leitura.vibracao === null
      ? sensor.vibracao
      : {
          valorAtual: leitura.vibracao,
          limiteMin: sensor.vibracao?.limiteMin ?? 0,
          limiteMax: sensor.vibracao?.limiteMax ?? sensor.limiteVibracao,
        }

  return {
    ...sensor,
    status: isSensorReadingFresh(leitura.criadoEm) ? "ONLINE" : "OFFLINE",
    active: true,
    ultimaLeituraEm: leitura.criadoEm,
    temperatura,
    vibracao,
  }
}

function isSameSensorLeitura(sensor, leitura) {
  const sensorTime = Date.parse(sensor.ultimaLeituraEm)
  const leituraTime = Date.parse(leitura.criadoEm)
  const sameTimestamp =
    Number.isFinite(sensorTime) && Number.isFinite(leituraTime)
      ? sensorTime === leituraTime
      : sensor.ultimaLeituraEm === leitura.criadoEm
  const sameTemperatura =
    leitura.temperatura === null || toNumber(sensor.temperatura?.valorAtual, NaN) === leitura.temperatura
  const sameVibracao =
    leitura.vibracao === null || toNumber(sensor.vibracao?.valorAtual, NaN) === leitura.vibracao

  return sameTimestamp && sameTemperatura && sameVibracao
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
  const manutencaoPreditivaSource =
    raw.manutencaoPreditiva ??
    raw.preventivaPreditiva ??
    raw.predictiveMaintenance ??
    raw.predictedMaintenance
  const manutencaoPreditiva =
    manutencaoPreditivaSource && typeof manutencaoPreditivaSource === "object"
      ? normalizeManutencaoRecord(manutencaoPreditivaSource, 0)
      : null

  return {
    id: toNumber(raw.id ?? raw.maquinaId, index + 1),
    nome: normalizeString(raw.nome ?? raw.nomeMaquina ?? raw.name, `MÃ¡quina ${index + 1}`),
    setor: normalizeString(raw.setor ?? raw.area ?? raw.linha ?? raw.localizacao, "Sem setor"),
    tipo: normalizeString(raw.tipo ?? raw.tipoMaquina ?? raw.categoria ?? raw.modelo, "MÃ¡quina"),
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
    previsaoManutencao: normalizeString(
      raw.previsaoManutencao ?? raw.previsaoFalha ?? raw.dataFalhaPrevista ?? raw.predictedFailureAt,
      ""
    ) || null,
    janelaManuInicio: normalizeString(
      raw.janelaManuInicio ?? raw.janelaManutencaoInicio ?? raw.maintenanceWindowStart,
      ""
    ) || null,
    janelaManuFim: normalizeString(
      raw.janelaManuFim ?? raw.janelaManutencaoFim ?? raw.maintenanceWindowEnd,
      ""
    ) || null,
    imagem: normalizeString(raw.imagem ?? raw.imagemUrl ?? raw.foto ?? raw.fotoUrl, "") || null,
    caminhoImagem: normalizeString(raw.caminhoImagem ?? raw.imagePath ?? raw.caminhoFoto, "") || null,
    estadoPredicaoManutencao: normalizePredictiveMaintenanceState(
      raw.estadoPredicaoManutencao ??
        raw.estado_predicao_manutencao ??
        raw.predictionMaintenanceState ??
        raw.predictiveMaintenanceState
    ),
    manutencaoPreditiva,
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

  const maquinaId = toNullableNumber(raw.maquinaId ?? raw.idMaquina)
  const active = normalizeBoolean(raw.active ?? raw.ativo, maquinaId !== null)
  const tipo = normalizeString(raw.tipo ?? raw.tipoSensor ?? raw.categoria, "Sensor")
  const limiteTemperatura = toNumber(
    raw.limiteTemperatura ?? raw.temperatura?.limiteMax ?? raw.temperaturaMax ?? raw.temperaturaMaxima,
    0
  )
  const idealTemperatura = toNumber(raw.idealTemperatura ?? raw.temperaturaIdeal, 0)
  const limiteVibracao = toNumber(
    raw.limiteVibracao ?? raw.vibracao?.limiteMax ?? raw.vibracaoMax ?? raw.vibracaoMaxima,
    0
  )
  const idealVibracao = toNumber(raw.idealVibracao ?? raw.vibracaoIdeal, 0)
  const temperatura = normalizeLeitura(raw.temperatura, "temperatura", raw)
  const vibracao = normalizeLeitura(raw.vibracao, "vibracao", raw)
  const ultimaLeituraEm = normalizeString(
    raw.ultimaLeituraEm ?? raw.ultimaAtualizacao ?? raw.dataUltimaLeitura,
    ""
  )

  return {
    id: toNumber(raw.id ?? raw.sensorId, index + 1),
    nome: normalizeString(raw.nome ?? raw.nomeSensor ?? raw.name ?? tipo, `Sensor ${index + 1}`),
    tipo,
    maquinaId,
    maquinaNome: normalizeString(raw.maquinaNome ?? raw.nomeMaquina ?? raw.maquina?.nome, "Sem mÃ¡quina vinculada"),
    status: getSensorRuntimeStatus(raw.status ?? raw.estado ?? raw.situacao, active, maquinaId, ultimaLeituraEm),
    active,
    ultimaLeituraEm,
    limiteTemperatura,
    idealTemperatura,
    limiteVibracao,
    idealVibracao,
    temperatura,
    vibracao,
  }
}

/**
 * @param {any} raw
 * @param {number} index
 * @returns {Tecnico | null}
 */
function normalizeTecnico(raw, index) {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const usuario = raw.usuario && typeof raw.usuario === "object" ? raw.usuario : null
  const usuarioSemSenha = raw.usuarioSemSenha && typeof raw.usuarioSemSenha === "object" ? raw.usuarioSemSenha : null
  const usuarioBase = usuario ?? usuarioSemSenha
  const perfil = raw.perfil && typeof raw.perfil === "object" ? raw.perfil : null
  const foto = normalizeString(
    raw.foto ??
      raw.fotoPerfil ??
      raw.fotoUrl ??
      raw.urlFoto ??
      raw.avatar ??
      raw.imagem ??
      raw.profileImage ??
      usuario?.fotoPerfil ??
      usuario?.foto ??
      usuarioSemSenha?.fotoPerfil ??
      usuarioSemSenha?.foto ??
      perfil?.fotoPerfil ??
      perfil?.foto,
    ""
  )

  return {
    id: toNumber(raw.id ?? raw.tecnicoId ?? raw.usuarioId ?? usuarioBase?.id, index + 1),
    nome: normalizeString(raw.nome ?? raw.nomeCompleto ?? raw.name ?? usuarioBase?.nome, `TÃ©cnico ${index + 1}`),
    email: normalizeString(raw.email ?? raw.emailUsuario ?? usuarioBase?.email, ""),
    telefone: normalizeString(raw.telefone ?? raw.celular ?? raw.whatsapp ?? raw.phone ?? usuarioBase?.telefone, ""),
    especialidade: normalizeString(raw.especialidade ?? raw.area ?? raw.funcao ?? raw.cargo, "Sem especialidade"),
    status: normalizeTecnicoStatus(raw.status ?? raw.estado ?? raw.situacao, raw.active ?? raw.ativo ?? usuarioBase?.ativo),
    alertasAtendidos: Math.max(
      toNumber(
        raw.alertasAtendidos ??
          raw.totalAlertasAtendidos ??
          raw.alertasResolvidos ??
          raw.atendimentos ??
          raw.chamadosAtendidos,
        0
      ),
      0
    ),
    criadoEm: getUsuarioCriadoEm(raw),
    foto: foto || null,
  }
}

/**
 * @param {any} raw
 * @param {number} index
 * @returns {Admin | null}
 */
function normalizeAdmin(raw, index) {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const usuario = raw.usuario && typeof raw.usuario === "object" ? raw.usuario : null
  const usuarioSemSenha = raw.usuarioSemSenha && typeof raw.usuarioSemSenha === "object" ? raw.usuarioSemSenha : null
  const usuarioBase = usuario ?? usuarioSemSenha
  const perfil = raw.perfil && typeof raw.perfil === "object" ? raw.perfil : null
  const foto = normalizeString(
    raw.foto ??
      raw.fotoPerfil ??
      raw.fotoUrl ??
      raw.urlFoto ??
      raw.avatar ??
      raw.imagem ??
      raw.profileImage ??
      usuario?.fotoPerfil ??
      usuario?.foto ??
      usuarioSemSenha?.fotoPerfil ??
      usuarioSemSenha?.foto ??
      perfil?.fotoPerfil ??
      perfil?.foto,
    ""
  )

  return {
    id: toNumber(raw.id ?? raw.adminId ?? raw.usuarioId ?? usuarioBase?.id, index + 1),
    nome: normalizeString(raw.nome ?? raw.nomeCompleto ?? raw.name ?? usuarioBase?.nome, `Administrador ${index + 1}`),
    email: normalizeString(raw.email ?? raw.emailUsuario ?? usuarioBase?.email, ""),
    telefone: normalizeString(raw.telefone ?? raw.celular ?? raw.whatsapp ?? raw.phone ?? usuarioBase?.telefone, ""),
    role: "ADMIN",
    status: normalizeAdminStatus(raw.status ?? raw.estado ?? raw.situacao, raw.active ?? raw.ativo ?? usuarioBase?.ativo),
    criadoEm: getUsuarioCriadoEm(raw),
    foto: foto || null,
  }
}

function normalizeManutencaoUsuario(source) {
  const usuario = source?.usuario && typeof source.usuario === "object" ? source.usuario : null
  const tecnico = source?.tecnico && typeof source.tecnico === "object" ? source.tecnico : null
  const user = usuario ?? tecnico
  const id = toNullableNumber(source?.usuarioId ?? source?.tecnicoId ?? user?.id)

  if (!id && !user && !source?.usuarioNome && !source?.tecnicoNome) {
    return null
  }

  return {
    id,
    nome: normalizeString(source?.usuarioNome ?? source?.tecnicoNome ?? user?.nome ?? user?.name, id ? `UsuÃ¡rio ${id}` : "UsuÃ¡rio nÃ£o informado"),
    email: normalizeString(source?.usuarioEmail ?? source?.tecnicoEmail ?? user?.email, ""),
    role: normalizeUppercase(source?.usuarioRole ?? source?.tecnicoRole ?? user?.role) || "TECNICO",
    telefone: normalizeString(source?.usuarioTelefone ?? source?.tecnicoTelefone ?? user?.telefone, ""),
    especialidade: normalizeString(source?.usuarioEspecialidade ?? source?.tecnicoEspecialidade ?? user?.especialidade, ""),
  }
}

/**
 * @param {any} raw
 * @param {number} index
 * @returns {Manutencao | null}
 */
function normalizeManutencao(raw, index) {
  return normalizeManutencaoRecord(raw, index, { normalizeMaquina, normalizeAlerta })
}

/**
 * @param {any} raw
 * @param {number} index
 * @returns {Alerta | null}
 */
function normalizeAlerta(raw, index) {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const tipo = normalizeAlertaTipo(raw.tipo ?? raw.tipoAlerta)
  const maquinaId = toNullableNumber(raw.maquinaId ?? raw.maquina?.id)
  const sensorId = toNullableNumber(raw.sensorId ?? raw.sensor?.id)
  const manutencao = raw.manutencao && typeof raw.manutencao === "object" ? raw.manutencao : null
  const tecnicoId = toNullableNumber(
    raw.tecnicoId ??
      raw.tecnico?.id ??
      raw.usuarioId ??
      raw.responsavelId ??
      raw.atendidoPorId ??
      raw.resolvidoPorId ??
      manutencao?.tecnicoId ??
      manutencao?.usuarioId ??
      manutencao?.responsavelId ??
      manutencao?.atendidoPorId ??
      manutencao?.resolvidoPorId
  )
  const criadoEm = normalizeString(raw.criadoEm ?? raw.createdAt ?? raw.dataCriacao, new Date().toISOString())
  const atualizadoEm = normalizeString(raw.atualizadoEm ?? raw.updatedAt, "") || null
  const ocorrenciasInformadas = Math.max(
    toNumber(
      raw.ocorrencias ?? raw.totalOcorrencias ?? raw.quantidadeOcorrencias,
      getOperationalAlertEvents(raw).length || 1
    ),
    1
  )
  const ultimaOcorrenciaEm = getLatestOperationalAlertDate(raw, atualizadoEm || criadoEm)
  const ocorrencias = getDistinctAlertOccurrenceCount(raw, ocorrenciasInformadas, criadoEm, ultimaOcorrenciaEm)

  return {
    id: toNumber(raw.id ?? raw.alertaId, index + 1),
    tipo,
    maquinaId,
    maquinaNome: normalizeString(
      raw.maquinaNome ?? raw.nomeMaquina ?? raw.maquina?.nome,
      maquinaId === null ? "MÃ¡quina nÃ£o informada" : `MÃ¡quina ${maquinaId}`
    ),
    sensorId,
    sensorNome: normalizeString(
      raw.sensorNome ?? raw.nomeSensor ?? raw.sensor?.nome ?? raw.sensor?.tipo,
      sensorId === null ? "Sensor nÃ£o informado" : `Sensor ${sensorId}`
    ),
    severidade: normalizeAlertaSeveridade(raw.severidade ?? raw.criticidade, tipo),
    status: normalizeAlertaStatus(raw.status ?? raw.estado ?? raw.situacao),
    mensagem: normalizeString(raw.mensagem ?? raw.descricao, "Alerta sem mensagem registrada."),
    criadoEm,
    atualizadoEm,
    ocorrencias,
    ultimaOcorrenciaEm,
    recencia: getAlertaRecencia(ultimaOcorrenciaEm),
    duplicado: ocorrencias > 1,
    tecnicoId,
    tecnicoNome: normalizeString(
      raw.tecnicoNome ??
        raw.nomeTecnico ??
        raw.usuarioNome ??
        raw.responsavelNome ??
        raw.atendidoPorNome ??
        raw.resolvidoPorNome ??
        raw.tecnico?.nome ??
        raw.usuario?.nome ??
        raw.responsavel?.nome ??
        manutencao?.tecnicoNome ??
        manutencao?.usuarioNome ??
        manutencao?.responsavelNome ??
        manutencao?.atendidoPorNome ??
        manutencao?.resolvidoPorNome,
      ""
    ) || null,
    sla: raw.sla && typeof raw.sla === "object" ? raw.sla : null,
  }
}

function isAlertaStatusAberto(status) {
  return status === "ATIVO" || status === "EM_ANDAMENTO"
}

function getAlertaDedupKeys(alerta) {
  const keys = []

  if (alerta.id !== null && alerta.id !== undefined) {
    keys.push(`id:${alerta.id}`)
  }

  if (isAlertaStatusAberto(alerta.status)) {
    const maquinaKey = alerta.maquinaId ?? normalizeString(alerta.maquinaNome).toLowerCase()
    const sensorKey = alerta.sensorId ?? normalizeString(alerta.sensorNome).toLowerCase()

    if (maquinaKey && sensorKey && alerta.tipo) {
      keys.push(`aberto:${maquinaKey}:${sensorKey}:${alerta.tipo}`)
    }
  }

  return keys
}

function getAlertaDateValue(alerta) {
  return alerta.ultimaOcorrenciaEm || alerta.atualizadoEm || alerta.criadoEm
}

function shouldCountMergedAlertaOccurrence(current, next) {
  const currentTimestamp = Date.parse(getAlertaDateValue(current))
  const nextTimestamp = Date.parse(getAlertaDateValue(next))

  return (
    Number.isFinite(currentTimestamp) &&
    Number.isFinite(nextTimestamp) &&
    Math.abs(nextTimestamp - currentTimestamp) >= ALERTA_REPETICAO_MIN_INTERVAL_MS
  )
}

function mergeAlertasDuplicados(current, next) {
  const currentOcorrencias = Math.max(toNumber(current.ocorrencias, 1), 1)
  const nextOcorrencias = Math.max(toNumber(next.ocorrencias, 1), 1)
  const sameId = current.id === next.id
  const countAsRepeatedOccurrence = !sameId && shouldCountMergedAlertaOccurrence(current, next)
  const ocorrencias = sameId
    ? Math.max(currentOcorrencias, nextOcorrencias)
    : countAsRepeatedOccurrence
      ? currentOcorrencias + nextOcorrencias
      : Math.max(currentOcorrencias, nextOcorrencias)
  const latest = isAfterOrEqualDate(getAlertaDateValue(next), getAlertaDateValue(current)) ? next : current
  const previous = latest === next ? current : next
  const ultimaOcorrenciaEm = isAfterOrEqualDate(current.ultimaOcorrenciaEm, next.ultimaOcorrenciaEm)
    ? current.ultimaOcorrenciaEm
    : next.ultimaOcorrenciaEm
  const criadoEm = isAfterOrEqualDate(current.criadoEm, next.criadoEm) ? next.criadoEm : current.criadoEm
  const bothOpen = isAlertaStatusAberto(current.status) && isAlertaStatusAberto(next.status)
  const status = bothOpen && [current.status, next.status].includes("EM_ANDAMENTO") ? "EM_ANDAMENTO" : latest.status

  return {
    ...latest,
    criadoEm,
    status,
    ocorrencias,
    ultimaOcorrenciaEm,
    recencia: getAlertaRecencia(ultimaOcorrenciaEm),
    duplicado: ocorrencias > 1 && (countAsRepeatedOccurrence || current.duplicado || next.duplicado),
    tecnicoId: latest.tecnicoId ?? previous.tecnicoId,
    tecnicoNome: latest.tecnicoNome ?? previous.tecnicoNome,
  }
}

function dedupeAlertas(alertas) {
  const byKey = new Map()
  const deduped = []

  for (const alerta of alertas) {
    const keys = getAlertaDedupKeys(alerta)

    if (keys.length === 0) {
      deduped.push(alerta)
      continue
    }

    const currentKey = keys.find((key) => byKey.has(key))
    const current = currentKey ? byKey.get(currentKey) : null

    if (!current) {
      for (const key of keys) {
        byKey.set(key, alerta)
      }
      deduped.push(alerta)
      continue
    }

    const merged = mergeAlertasDuplicados(current, alerta)

    for (const [key, value] of byKey.entries()) {
      if (value === current) {
        if (key.startsWith("aberto:") && !isAlertaStatusAberto(merged.status)) {
          byKey.delete(key)
        } else {
          byKey.set(key, merged)
        }
      }
    }

    for (const key of keys) {
      if (key.startsWith("aberto:") && !isAlertaStatusAberto(merged.status)) {
        continue
      }

      byKey.set(key, merged)
    }

    const index = deduped.indexOf(current)
    if (index >= 0) {
      deduped[index] = merged
    }
  }

  return deduped
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

/**
 * @param {any} payload
 * @returns {{ id: number | null, sensorId: number, temperatura: number | null, vibracao: number | null, criadoEm: string }[]}
 */
export function normalizeSensorLeituraCollection(payload) {
  return extractCollection(payload)
    .map((item) => normalizeSensorLeitura(item))
    .filter(Boolean)
}

/**
 * @param {Sensor[]} sensores
 * @param {any} payload
 * @returns {Sensor[]}
 */
export function mergeSensorLeituras(sensores, payload) {
  const leituras = normalizeSensorLeituraCollection(payload)

  if (leituras.length === 0 || sensores.length === 0) {
    return sensores
  }

  const latestBySensorId = new Map()

  for (const leitura of leituras) {
    const current = latestBySensorId.get(leitura.sensorId)

    if (!current || isAfterOrEqualDate(leitura.criadoEm, current.criadoEm)) {
      latestBySensorId.set(leitura.sensorId, leitura)
    }
  }

  return sensores.map((sensor) => {
    const leitura = latestBySensorId.get(sensor.id)
    return leitura ? applySensorLeitura(sensor, leitura) : sensor
  })
}

/**
 * @param {Sensor[]} sensores
 * @param {any} payload
 * @returns {Sensor[]}
 */
export function mergeSensorLeitura(sensores, payload) {
  const leitura = normalizeSensorLeitura(payload)

  if (!leitura || sensores.length === 0) {
    return sensores
  }

  let changed = false
  const merged = sensores.map((sensor) => {
    if (sensor.id !== leitura.sensorId) {
      return sensor
    }

    if (isSameSensorLeitura(sensor, leitura)) {
      return sensor
    }

    changed = true
    return applySensorLeitura(sensor, leitura)
  })

  return changed ? merged : sensores
}

/**
 * @param {Sensor[]} sensores
 * @returns {Sensor[]}
 */
export function refreshSensorStatuses(sensores) {
  if (!Array.isArray(sensores) || sensores.length === 0) {
    return sensores
  }

  let changed = false
  const refreshed = sensores.map((sensor) => {
    const status = getSensorRuntimeStatus(sensor.status, sensor.active, sensor.maquinaId, sensor.ultimaLeituraEm)

    if (status === sensor.status) {
      return sensor
    }

    changed = true
    return { ...sensor, status }
  })

  return changed ? refreshed : sensores
}

/**
 * @param {any} payload
 * @returns {Tecnico[]}
 */
export function normalizeTecnicoCollection(payload) {
  return extractCollection(payload)
    .map((item, index) => normalizeTecnico(item, index))
    .filter(Boolean)
}

/**
 * @param {any} payload
 * @param {{ assumeAdminWhenRoleMissing?: boolean }} [options]
 * @returns {Admin[]}
 */
export function normalizeAdminCollection(payload, options = {}) {
  const { assumeAdminWhenRoleMissing = false } = options

  return extractCollection(payload)
    .filter((item) => isAdminRecord(item, assumeAdminWhenRoleMissing))
    .map((item, index) => normalizeAdmin(item, index))
    .filter(Boolean)
}

/**
 * @param {any} payload
 * @returns {Manutencao[]}
 */
export function normalizeManutencaoCollection(payload) {
  return extractCollection(payload)
    .map((item, index) => normalizeManutencao(item, index))
    .filter(Boolean)
}

/**
 * @param {any} payload
 * @returns {Alerta[]}
 */
export function normalizeAlertaCollection(payload) {
  const alertas = extractCollection(payload)
    .map((item, index) => normalizeAlerta(item, index))
    .filter(Boolean)

  return dedupeAlertas(alertas)
}
