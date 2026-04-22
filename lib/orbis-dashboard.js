// @ts-check

/** @typedef {import("@/lib/orbis-types").Maquina} Maquina */
/** @typedef {import("@/lib/orbis-types").CriticidadeChartDatum} CriticidadeChartDatum */
/** @typedef {import("@/lib/orbis-types").IntegridadeSetorChartDatum} IntegridadeSetorChartDatum */
/** @typedef {import("@/lib/orbis-types").Sensor} Sensor */
/** @typedef {import("@/lib/orbis-types").AlertTrendChartDatum} AlertTrendChartDatum */
/** @typedef {import("@/lib/orbis-types").StatusDistribuicaoChartDatum} StatusDistribuicaoChartDatum */

const CRITICIDADE_LABEL = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAIXA: "Baixa",
}

const SETOR_LABEL_OVERRIDES = {
  "linha de producao a": "Linha A",
  "linha de producao b": "Linha B",
  "setor hidraulico": "Hidraulico",
  "esteira principal": "Esteira",
  resfriamento: "Resfriamento",
  usinagem: "Usinagem",
  conformacao: "Conformacao",
}

const ALERTA_TENDENCIA_TIPOS = new Set([
  "TENDENCIA_CURTA",
  "TENDENCIA_LONGA",
  "DEGRADACAO_ACELERADA",
  "INSTABILIDADE",
])

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
 * @param {string | Date | null | undefined} value
 * @returns {string | null}
 */
function toDateKey(value) {
  if (!value) {
    return null
  }

  const date = value instanceof Date ? new Date(value) : new Date(String(value))

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString().slice(0, 10)
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
    .replace(/^linha de producao\s+/i, "Linha ")
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

    return {
      criticidade,
      label: CRITICIDADE_LABEL[criticidade],
      operando: maquinasDaFaixa.filter((maquina) => maquina.status === "OK").length,
      emAlerta: maquinasDaFaixa.filter((maquina) => maquina.status !== "OK").length,
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
      if (maquina.status === "OK") {
        acc.Estavel += 1
        return acc
      }

      if (maquina.criticidade === "ALTA" || maquina.integridade < 40) {
        acc.Critico += 1
        return acc
      }

      acc.Alerta += 1
      return acc
    },
    { Estavel: 0, Alerta: 0, Critico: 0 }
  )

  return [
    { status: "Estavel", quantidade: totals.Estavel, fill: "var(--chart-1)" },
    { status: "Alerta", quantidade: totals.Alerta, fill: "var(--chart-2)" },
    { status: "Critico", quantidade: totals.Critico, fill: "#ef4444" },
  ]
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
