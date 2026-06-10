// @ts-check

/** @typedef {import("@/lib/orbis-types").Maquina} Maquina */
/** @typedef {import("@/lib/orbis-types").CriticidadeChartDatum} CriticidadeChartDatum */
/** @typedef {import("@/lib/orbis-types").IntegridadeSetorChartDatum} IntegridadeSetorChartDatum */
/** @typedef {import("@/lib/orbis-types").Sensor} Sensor */
/** @typedef {import("@/lib/orbis-types").AlertTrendChartDatum} AlertTrendChartDatum */
/** @typedef {import("@/lib/orbis-types").IntegridadeTrendChartDatum} IntegridadeTrendChartDatum */
/** @typedef {import("@/lib/orbis-types").MachineIntegridadeTrendOption} MachineIntegridadeTrendOption */
/** @typedef {import("@/lib/orbis-types").StatusDistribuicaoChartDatum} StatusDistribuicaoChartDatum */
/** @typedef {import("@/lib/orbis-types").StatusHistoricoChartDatum} StatusHistoricoChartDatum */

import { getMaquinaStatusExibicao, maquinaTemSensores } from "./maquinas-table.js"

const CRITICIDADE_LABEL = {
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
}

const SETOR_LABEL_OVERRIDES = {
  "linha de producao a": "Linha A",
  "linha de producao b": "Linha B",
  "linha de produção a": "Linha A",
  "linha de produção b": "Linha B",
  "setor hidraulico": "Hidráulico",
  "esteira principal": "Esteira",
  resfriamento: "Resfriamento",
  usinagem: "Usinagem",
  conformacao: "Conformação",
}

const ALERTA_TENDENCIA_TIPOS = new Set([
  "TENDENCIA_CURTA",
  "TENDENCIA_LONGA",
  "DEGRADACAO_ACELERADA",
  "INSTABILIDADE",
])

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeAlertType(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .toUpperCase()
}

/**
 * @param {string | number | Date | null | undefined} value
 * @returns {string | null}
 */
function toDateKey(value) {
  if (!value) {
    return null
  }

  const date = value instanceof Date
    ? new Date(value)
    : typeof value === "number"
      ? new Date(value < 1000000000000 ? value * 1000 : value)
      : new Date(String(value))

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString().slice(0, 10)
}

function toTimestamp(value) {
  if (!value) {
    return NaN
  }

  if (value instanceof Date) {
    return value.getTime()
  }

  if (typeof value === "number") {
    return value < 1000000000000 ? value * 1000 : value
  }

  return Date.parse(String(value))
}

/**
 * @param {string | null | undefined} value
 * @returns {Date | null}
 */
function parseDateKey(value) {
  if (!value) {
    return null
  }

  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function getReferenceDate(value = new Date()) {
  const date = parseDateKey(toDateKey(value)) || new Date()
  date.setUTCHours(0, 0, 0, 0)
  return date
}

function getCurrentWeekDays(referenceDateValue) {
  const referenceDate = getReferenceDate(referenceDateValue)
  const firstDay = new Date(referenceDate)
  firstDay.setUTCDate(referenceDate.getUTCDate() - referenceDate.getUTCDay())

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(firstDay)
    current.setUTCDate(firstDay.getUTCDate() + index)
    return toDateKey(current) ?? ""
  })
}

function getWeekdayLabel(dateKey) {
  const date = parseDateKey(dateKey)
  return date ? WEEKDAY_LABELS[date.getUTCDay()] : dateKey
}

function getAlertaDateKey(alerta) {
  return toDateKey(alerta?.ultimaOcorrenciaEm ?? alerta?.atualizadoEm ?? alerta?.criadoEm)
}

function getAlertaMaquinaKey(alerta) {
  if (alerta?.maquinaId !== null && alerta?.maquinaId !== undefined && alerta?.maquinaId !== "") {
    return `id:${alerta.maquinaId}`
  }

  const nome = String(alerta?.maquinaNome ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()

  return nome ? `nome:${nome}` : ""
}

function getMaquinaKey(maquina) {
  if (maquina?.id !== null && maquina?.id !== undefined && maquina?.id !== "") {
    return `id:${maquina.id}`
  }

  const nome = String(maquina?.nome ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()

  return nome ? `nome:${nome}` : ""
}

/**
 * @param {AlertTrendChartDatum[]} entries
 * @param {string | Date | null | undefined} referenceDateValue
 * @param {number} days
 * @returns {AlertTrendChartDatum[]}
 */
function fillTrendWindow(entries, referenceDateValue, days = 90) {
  const referenceDate =
    parseDateKey(toDateKey(referenceDateValue)) ||
    parseDateKey(entries.reduce((latest, item) => (item.date > latest ? item.date : latest), "")) ||
    new Date()

  referenceDate.setUTCHours(0, 0, 0, 0)

  /** @type {Map<string, AlertTrendChartDatum>} */
  const window = new Map()

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const current = new Date(referenceDate)
    current.setUTCDate(referenceDate.getUTCDate() - offset)
    const key = toDateKey(current)

    if (key) {
      window.set(key, { date: key, limite: 0, tendencia: 0 })
    }
  }

  for (const entry of entries) {
    const item = window.get(entry.date)

    if (!item) {
      continue
    }

    item.limite += toNumber(entry.limite, 0)
    item.tendencia += toNumber(entry.tendencia, 0)
  }

  return Array.from(window.values())
}

/**
 * @param {Sensor["temperatura"] | Sensor["vibracao"]} leitura
 * @returns {boolean}
 */
function isLeituraOutOfBounds(leitura) {
  if (!leitura) {
    return false
  }

  return leitura.valorAtual < leitura.limiteMin || leitura.valorAtual > leitura.limiteMax
}

/**
 * @param {Sensor["temperatura"] | Sensor["vibracao"]} leitura
 * @returns {boolean}
 */
function isLeituraNearLimit(leitura) {
  if (!leitura) {
    return false
  }

  const range = leitura.limiteMax - leitura.limiteMin

  if (!Number.isFinite(range) || range <= 0) {
    return false
  }

  const relativeValue = (leitura.valorAtual - leitura.limiteMin) / range
  return relativeValue >= 0.85 || relativeValue <= 0.15
}

/**
 * @param {any} payload
 * @returns {any[]}
 */
function extractCollection(payload) {
  const candidates = [
    payload,
    payload?.content,
    payload?.dados,
    payload?.data,
    payload?.items,
    payload?.resultado,
    payload?.results,
    payload?.alertas,
    payload?.historico,
    payload?.historicoIntegridade,
    payload?.historico_integridade,
    payload?.historicos,
    payload?.series,
    payload?.registros,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
    }
  }

  return []
}

/**
 * @param {any} item
 * @returns {AlertTrendChartDatum | null}
 */
function normalizeTrendSeriesItem(item) {
  if (!item || typeof item !== "object") {
    return null
  }

  const date = toDateKey(item.date ?? item.data ?? item.dia ?? item.referenceDate)

  if (!date) {
    return null
  }

  const limiteCandidates = [
    item.limite,
    item.limites,
    item.limiteUltrapassado,
    item.limiteUltrapassados,
    item.totalLimite,
  ]
  const tendenciaCandidates = [
    item.tendencia,
    item.tendencias,
    item.degradacao,
    item.instabilidade,
    item.totalTendencia,
  ]
  const hasLimite = limiteCandidates.some((value) => Number.isFinite(Number(value)))
  const hasTendencia = tendenciaCandidates.some((value) => Number.isFinite(Number(value)))

  if (!hasLimite && !hasTendencia) {
    return null
  }

  return {
    date,
    limite: limiteCandidates.reduce((total, value) => total + toNumber(value, 0), 0),
    tendencia: tendenciaCandidates.reduce((total, value) => total + toNumber(value, 0), 0),
  }
}

/**
 * @param {any} item
 * @param {number} index
 * @param {Maquina | null} maquina
 * @returns {{ id: any, maquinaId: number | string | null, date: string, timestamp: number, integridade: number } | null}
 */
export function normalizeHistoricoIntegridadeItem(item, index = 0, maquina = null) {
  if (!item || typeof item !== "object") {
    return null
  }

  const integridade = toNumber(
    item.integridade ??
      item.integridadeAtual ??
      item.integridade_atual ??
      item.integridadeMedia ??
      item.integridade_media ??
      item.saude ??
      item.saudeMedia ??
      item.saude_media ??
      item.healthScore ??
      item.health_score,
    NaN
  )
  const timestampValue =
    item.criadoEm ??
    item.criado_em ??
    item.createdAt ??
    item.created_at ??
    item.dataCriacao ??
    item.data_criacao ??
    item.registradoEm ??
    item.registrado_em ??
    item.coletadoEm ??
    item.coletado_em ??
    item.leituraEm ??
    item.leitura_em ??
    item.dataLeitura ??
    item.data_leitura ??
    item.dataHora ??
    item.data_hora ??
    item.data ??
    item.date ??
    item.timestamp
  const dateKey = toDateKey(timestampValue)
  const timestamp = toTimestamp(timestampValue)

  if (!dateKey || !Number.isFinite(timestamp) || !Number.isFinite(integridade)) {
    return null
  }

  return {
    id: item.id ?? `${maquina?.id ?? "maquina"}-${dateKey}-${index}`,
    maquinaId: item.maquinaId ?? item.maquina_id ?? item.idMaquina ?? item.maquina?.id ?? maquina?.id ?? null,
    date: dateKey,
    timestamp,
    integridade: Math.round(Math.min(Math.max(integridade, 0), 100)),
  }
}

/**
 * @param {any} payload
 * @param {Maquina | null} [maquina]
 * @returns {ReturnType<typeof normalizeHistoricoIntegridadeItem>[]}
 */
export function normalizeHistoricoIntegridadeCollection(payload, maquina = null) {
  return extractCollection(payload)
    .map((item, index) => normalizeHistoricoIntegridadeItem(item, index, maquina))
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp)
}

/**
 * @param {IntegridadeTrendChartDatum[]} entries
 * @param {string | Date | null | undefined} referenceDateValue
 * @param {number} days
 * @returns {IntegridadeTrendChartDatum[]}
 */
function fillIntegrityWindow(entries, referenceDateValue, days = 90) {
  if (entries.length === 0) {
    return []
  }

  const referenceDate =
    parseDateKey(toDateKey(referenceDateValue)) ||
    parseDateKey(entries.reduce((latest, item) => (item.date > latest ? item.date : latest), "")) ||
    new Date()

  referenceDate.setUTCHours(0, 0, 0, 0)

  const byDate = new Map(entries.map((entry) => [entry.date, entry]))
  let lastKnown = null
  let lastKnownMaquinas = 0

  return Array.from({ length: days }, (_, index) => {
    const current = new Date(referenceDate)
    current.setUTCDate(referenceDate.getUTCDate() - (days - 1 - index))
    const date = toDateKey(current) ?? ""
    const entry = byDate.get(date)

    if (entry && Number.isFinite(Number(entry.integridade))) {
      lastKnown = Number(entry.integridade)
      lastKnownMaquinas = entry.maquinas
      return entry
    }

    return {
      date,
      timestamp: current.getTime(),
      integridade: lastKnown,
      maquinas: lastKnown === null ? 0 : lastKnownMaquinas,
      estimado: lastKnown !== null,
    }
  })
}

/**
 * @param {string} setor
 * @returns {string}
 */
function formatarSetorLabel(setor) {
  const setorNormalizado = setor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

  if (SETOR_LABEL_OVERRIDES[setorNormalizado]) {
    return SETOR_LABEL_OVERRIDES[setorNormalizado]
  }

  return setorNormalizado
    .replace(/^linha de produ[cç][aã]o\s+/i, "Linha ")
    .replace(/^setor\s+/i, "")
    .replace(/^linha\s+/i, "Linha ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase())
}

/**
 * @param {Maquina[]} maquinas
 * @returns {CriticidadeChartDatum[]}
 */
export function getMaquinasPorCriticidade(maquinas) {
  return ["ALTA", "MEDIA", "BAIXA"].map((criticidade) => {
    const maquinasDaFaixa = maquinas.filter((maquina) => maquina.criticidade === criticidade)
    const maquinasEmAlerta = maquinasDaFaixa.filter((maquina) => ["COM_ALERTA", "EM_ANDAMENTO"].includes(getMaquinaStatusExibicao(maquina)))

    return {
      criticidade,
      label: CRITICIDADE_LABEL[criticidade],
      operando: maquinasDaFaixa.filter((maquina) => getMaquinaStatusExibicao(maquina) === "OK").length,
      emAlerta: maquinasEmAlerta.length,
      semSensor: maquinasDaFaixa.filter((maquina) => !maquinaTemSensores(maquina) && !maquinasEmAlerta.includes(maquina)).length,
    }
  })
}

/**
 * @param {Maquina[]} maquinas
 * @returns {IntegridadeSetorChartDatum[]}
 */
export function getIntegridadePorSetor(maquinas) {
  /** @type {Map<string, { totalIntegridade: number, maquinas: number }>} */
  const agrupado = maquinas.reduce((acc, maquina) => {
    const atual = acc.get(maquina.setor)

    if (atual) {
      atual.totalIntegridade += maquina.integridade
      atual.maquinas += 1
      return acc
    }

    acc.set(maquina.setor, {
      totalIntegridade: maquina.integridade,
      maquinas: 1,
    })

    return acc
  }, new Map())

  return Array.from(agrupado.entries())
    .map(([setor, valores]) => ({
      setor,
      setorLabel: formatarSetorLabel(setor),
      integridade: Math.round(valores.totalIntegridade / valores.maquinas),
      maquinas: valores.maquinas,
    }))
    .sort((a, b) => b.integridade - a.integridade)
}

/**
 * @param {Maquina[]} maquinas
 * @returns {StatusDistribuicaoChartDatum[]}
 */
export function getDistribuicaoStatusMaquinas(maquinas) {
  const totals = maquinas.reduce(
    (acc, maquina) => {
      const status = getMaquinaStatusExibicao(maquina)

      if (status === "OK" || status === "SEM_SENSOR") {
        acc.Estavel += 1
        return acc
      }

      acc.Alerta += 1
      return acc
    },
    { Estavel: 0, Alerta: 0, Critico: 0 }
  )

  return [
    { status: "Estável", quantidade: totals.Estavel, fill: "var(--chart-1)" },
    { status: "Alerta", quantidade: totals.Alerta, fill: "var(--chart-2)" },
    { status: "Crítico", quantidade: totals.Critico, fill: "#ef4444" },
  ]
}

/**
 * @param {Maquina[]} maquinas
 * @param {any[]} alertas
 * @param {string | Date | null | undefined} [referenceDateValue]
 * @returns {StatusHistoricoChartDatum[]}
 */
export function getHistoricoStatusMaquinas(maquinas, alertas = [], referenceDateValue) {
  const referenceDate = getReferenceDate(referenceDateValue)
  const today = toDateKey(referenceDate) ?? ""
  const maquinaKeys = new Set(maquinas.map(getMaquinaKey).filter(Boolean))
  const totalMaquinas = maquinas.length
  const semSensorKeys = new Set(
    maquinas
      .filter((maquina) => !maquinaTemSensores(maquina))
      .map(getMaquinaKey)
      .filter(Boolean)
  )
  const days = getCurrentWeekDays(referenceDate)

  /** @type {Map<string, Map<string, "emAlerta" | "emAndamento">>} */
  const alertasPorDia = new Map()

  for (const alerta of alertas) {
    const startDate = getAlertaDateKey(alerta)
    const maquinaKey = getAlertaMaquinaKey(alerta)

    if (!startDate || !maquinaKey || !maquinaKeys.has(maquinaKey)) {
      continue
    }

    if (alerta?.status !== "ATIVO" && alerta?.status !== "ABERTO" && alerta?.status !== "EM_ANDAMENTO") {
      continue
    }

    const status = alerta.status === "EM_ANDAMENTO" ? "emAndamento" : "emAlerta"

    for (const date of days) {
      if (date < startDate || date > today) {
        continue
      }

      const dayStatuses = alertasPorDia.get(date) ?? new Map()
      const currentStatus = dayStatuses.get(maquinaKey)

      if (currentStatus !== "emAlerta") {
        dayStatuses.set(maquinaKey, status)
      }

      alertasPorDia.set(date, dayStatuses)
    }
  }

  return days.map((date) => {
    if (date > today) {
      return {
        date,
        label: getWeekdayLabel(date),
        ok: 0,
        semSensor: 0,
        emAndamento: 0,
        emAlerta: 0,
        total: 0,
      }
    }

    const dayStatuses = alertasPorDia.get(date) ?? new Map()
    const emAlerta = Array.from(dayStatuses.values()).filter((status) => status === "emAlerta").length
    const emAndamento = Array.from(dayStatuses.values()).filter((status) => status === "emAndamento").length
    const semSensor = Array.from(semSensorKeys).filter((maquinaKey) => !dayStatuses.has(maquinaKey)).length
    const ok = Math.max(totalMaquinas - semSensor - emAndamento - emAlerta, 0)

    return {
      date,
      label: getWeekdayLabel(date),
      ok,
      semSensor,
      emAndamento,
      emAlerta,
      total: totalMaquinas,
    }
  })
}

/**
 * @param {any} payload
 * @param {string | Date | null | undefined} [referenceDateValue]
 * @returns {AlertTrendChartDatum[]}
 */
export function getAlertTrendDataFromApi(payload, referenceDateValue) {
  const items = extractCollection(payload)

  if (items.length === 0) {
    return []
  }

  const directSeries = items
    .map((item) => normalizeTrendSeriesItem(item))
    .filter(Boolean)

  if (directSeries.length > 0) {
    return fillTrendWindow(directSeries, referenceDateValue, 90)
  }

  /** @type {Map<string, AlertTrendChartDatum>} */
  const grouped = new Map()

  for (const item of items) {
    if (!item || typeof item !== "object") {
      continue
    }

    const date = toDateKey(item.criadoEm ?? item.dataCriacao ?? item.date ?? item.data)

    if (!date) {
      continue
    }

    const current = grouped.get(date) ?? { date, limite: 0, tendencia: 0 }
    const tipo = normalizeAlertType(item.tipo ?? item.tipoAlerta)

    if (tipo === "LIMITE_ULTRAPASSADO") {
      current.limite += 1
    } else if (ALERTA_TENDENCIA_TIPOS.has(tipo)) {
      current.tendencia += 1
    }

    grouped.set(date, current)
  }

  return grouped.size > 0
    ? fillTrendWindow(Array.from(grouped.values()), referenceDateValue, 90)
    : []
}

/**
 * @param {Sensor[]} sensores
 * @param {Maquina[]} maquinas
 * @param {string | Date | null | undefined} [referenceDateValue]
 * @returns {AlertTrendChartDatum[]}
 */
export function getAlertTrendDataFromSnapshot(sensores, maquinas, referenceDateValue) {
  /** @type {Map<string, AlertTrendChartDatum>} */
  const grouped = new Map()

  for (const sensor of sensores) {
    const date = toDateKey(sensor.ultimaLeituraEm)

    if (!date) {
      continue
    }

    const current = grouped.get(date) ?? { date, limite: 0, tendencia: 0 }

    current.limite += Number(isLeituraOutOfBounds(sensor.temperatura))
    current.limite += Number(isLeituraOutOfBounds(sensor.vibracao))
    current.tendencia += Number(isLeituraNearLimit(sensor.temperatura))
    current.tendencia += Number(isLeituraNearLimit(sensor.vibracao))
    current.tendencia += Number(sensor.status !== "ONLINE")

    grouped.set(date, current)
  }

  for (const maquina of maquinas.filter((item) => item.status === "ALERTA")) {
    const date = toDateKey(maquina.ultimaLeituraEm)

    if (!date) {
      continue
    }

    const current = grouped.get(date) ?? { date, limite: 0, tendencia: 0 }
    current.tendencia += 1
    grouped.set(date, current)
  }

  return grouped.size > 0
    ? fillTrendWindow(Array.from(grouped.values()), referenceDateValue, 90)
    : []
}

/**
 * @param {{ maquina: Maquina, historico: ReturnType<typeof normalizeHistoricoIntegridadeCollection> }[]} machineHistories
 * @param {Maquina[]} maquinas
 * @param {string | Date | null | undefined} [referenceDateValue]
 * @returns {IntegridadeTrendChartDatum[]}
 */
export function getIntegrityTrendDataFromHistories(machineHistories, maquinas = [], referenceDateValue) {
  /** @type {{ maquinaKey: string, timestamp: number, integridade: number }[]} */
  const timeline = []

  for (const entry of machineHistories) {
    const maquina = entry?.maquina
    const maquinaKey = getMaquinaKey(maquina)

    if (!maquinaKey || !Array.isArray(entry?.historico)) {
      continue
    }

    for (const point of entry.historico) {
      if (!Number.isFinite(point?.timestamp) || !Number.isFinite(point.integridade)) {
        continue
      }

      timeline.push({
        maquinaKey,
        timestamp: point.timestamp,
        integridade: point.integridade,
      })
    }
  }

  timeline.sort((a, b) => a.timestamp - b.timestamp)

  if (timeline.length > 0) {
    /** @type {Map<string, number>} */
    const latestByMachine = new Map()
    /** @type {IntegridadeTrendChartDatum[]} */
    const entries = []

    for (let index = 0; index < timeline.length;) {
      const timestamp = timeline[index].timestamp

      while (index < timeline.length && timeline[index].timestamp === timestamp) {
        latestByMachine.set(timeline[index].maquinaKey, timeline[index].integridade)
        index += 1
      }

      const readings = Array.from(latestByMachine.values())
      const total = readings.reduce((sum, value) => sum + value, 0)

      entries.push({
        date: toDateKey(timestamp) ?? "",
        timestamp,
        integridade: Math.round(total / readings.length),
        maquinas: readings.length,
      })
    }

    return entries
  }

  return getIntegrityTrendDataFromSnapshot(maquinas, referenceDateValue)
}

/**
 * @param {Maquina[]} maquinas
 * @param {string | Date | null | undefined} [referenceDateValue]
 * @returns {IntegridadeTrendChartDatum[]}
 */
export function getIntegrityTrendDataFromSnapshot(maquinas, referenceDateValue) {
  const readings = maquinas
    .map((maquina) => toNumber(maquina?.integridade, NaN))
    .filter((value) => Number.isFinite(value))

  if (readings.length === 0) {
    return []
  }

  const date = toDateKey(referenceDateValue ?? new Date()) ?? ""
  const integridade = Math.round(readings.reduce((sum, value) => sum + value, 0) / readings.length)

  return fillIntegrityWindow([
    {
      date,
      timestamp: Date.parse(`${date}T00:00:00Z`),
      integridade,
      maquinas: readings.length,
      estimado: true,
    },
  ], date, 90)
}

/**
 * @param {ReturnType<typeof normalizeHistoricoIntegridadeCollection>} historico
 * @param {Maquina} maquina
 * @param {string | Date | null | undefined} [referenceDateValue]
 * @returns {IntegridadeTrendChartDatum[]}
 */
function getSingleMachineIntegrityTrendData(historico, maquina, referenceDateValue) {
  /** @type {Map<string, { timestamp: number, integridade: number }>} */
  const valuesByDate = new Map()

  for (const point of Array.isArray(historico) ? historico : []) {
    if (!point?.date || !Number.isFinite(point.timestamp) || !Number.isFinite(point.integridade)) {
      continue
    }

    const current = valuesByDate.get(point.date)

    if (!current || point.timestamp >= current.timestamp) {
      valuesByDate.set(point.date, {
        timestamp: point.timestamp,
        integridade: point.integridade,
      })
    }
  }

  const entries = Array.from(valuesByDate.entries())
    .map(([date, value]) => ({
      date,
      timestamp: value.timestamp,
      integridade: value.integridade,
      maquinas: 1,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  if (entries.length > 0) {
    return entries
  }

  return getIntegrityTrendDataFromSnapshot([maquina], referenceDateValue)
}

/**
 * @param {{ maquina: Maquina, historico: ReturnType<typeof normalizeHistoricoIntegridadeCollection> }[]} machineHistories
 * @param {Maquina[]} maquinas
 * @param {string | Date | null | undefined} [referenceDateValue]
 * @returns {MachineIntegridadeTrendOption[]}
 */
export function getMachineIntegrityTrendOptions(machineHistories, maquinas = [], referenceDateValue) {
  const historiesById = new Map(
    machineHistories
      .filter((entry) => entry?.maquina?.id !== null && entry?.maquina?.id !== undefined)
      .map((entry) => [String(entry.maquina.id), entry.historico])
  )

  return maquinas
    .map((maquina) => {
      const integridade = toNumber(maquina?.integridade, NaN)

      if (!maquina || !Number.isFinite(integridade)) {
        return null
      }

      return {
        id: maquina.id,
        nome: maquina.nome,
        setor: maquina.setor,
        criticidade: maquina.criticidade,
        integridade: Math.round(integridade),
        data: getSingleMachineIntegrityTrendData(historiesById.get(String(maquina.id)) ?? [], maquina, referenceDateValue),
      }
    })
    .filter(Boolean)
}
