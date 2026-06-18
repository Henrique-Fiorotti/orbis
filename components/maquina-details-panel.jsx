"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"
import {
  ActivityIcon,
  AlertTriangleIcon,
  CalendarCheckIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  CircleHelpIcon,
  CircleMinusIcon,
  GaugeIcon,
  ImageIcon,
  Loader2Icon,
  Maximize2Icon,
  ThermometerIcon,
  WrenchIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  getMaquinaIntegridadeExibicao,
  getMaquinaStatusExibicao,
} from "@/lib/maquinas-table"
import { getAuthSession } from "@/lib/auth-session"
import { extractCollection, getHttpErrorStatus, normalizeMaquinaCollection, requestDashboardJson } from "@/lib/dashboard-api"
import {
  REALTIME_MACHINE_DASHBOARD_UPDATE_EVENT,
  REALTIME_MACHINE_INTEGRITY_HISTORY_UPDATE_EVENT,
} from "@/lib/realtime-events.mjs"
import {
  PREDICTIVE_MAINTENANCE_REQUIRED_CONFIRMATIONS,
  formatCoveredHours,
  formatPredictiveMaintenanceCriteria,
  formatPredictionReason,
  getPredictiveMaintenanceStatus,
  getPredictionModelMetadata,
  getPredictionOperationalStatus,
} from "@/lib/prediction-contract.mjs"
import { cn, tempoRelativo } from "@/lib/utils"

const PREDICAO_LIMIAR_MANUTENCAO = 70
const PREDICAO_LIMIAR_FALHA = 30
const DEFAULT_REGRESSION_PERIOD = "1d"
const REGRESSION_PERIOD_OPTIONS = [
  { value: "1d", label: "1 dia", hours: 24 },
  { value: "3d", label: "3 dias", hours: 72 },
  { value: "7d", label: "7 dias", hours: 168 },
]

const FATOR_RISCO_LABELS = {
  proporcao_acima_limite_24h: "leituras acima do limite em 24h",
  proporcao_acima_ideal_24h: "leituras acima do ideal em 24h",
  desvio_vibracao_24h: "variação de vibração em 24h",
  desvio_temperatura_24h: "variação de temperatura em 24h",
  instabilidades_ultimas_72h: "instabilidades nas últimas 72h",
  vibracao_media_2h: "vibração média nas últimas 2h",
  risco_instabilidade_24h: "risco de instabilidade em 24h",
  tendencias_curtas_72h: "tendências curtas nas últimas 72h",
  tendencias_longas_7d: "tendências longas em 7 dias",
  queda_integridade_24h: "queda de integridade em 24h",
  queda_estabilidade_24h: "queda de estabilidade em 24h",
  vibracao_media_7d: "vibração média em 7 dias",
  alertas_recentes_72h: "alertas recentes em 72h",
  risco_alerta_24h: "risco de alerta em 24h",
  alertas_ativos: "alertas ativos",
  alertas_recentes_24h: "alertas recentes em 24h",
  queda_integridade_7d: "queda de integridade em 7 dias",
  criticidade_maquina: "criticidade da máquina",
  integridade_atual: "integridade atual",
  score_estabilidade_atual: "estabilidade atual",
  variacao_integridade_24h: "variação de integridade em 24h",
}

const RISCO_LABELS = {
  instabilidade: "Instabilidade",
  alerta: "Alerta",
  manutencao: "Manutenção",
}

const ALERTA_TIPO_LABELS = {
  INSTABILIDADE: "Instabilidade",
  TENDENCIA_CURTA: "Tendência curta",
  TENDENCIA_LONGA: "Tendência longa",
  DEGRADACAO_ACELERADA: "Degradação acelerada",
  LIMITE_ULTRAPASSADO: "Limite ultrapassado",
}

const FONTE_LIMIAR_LABELS = {
  MAQUINA: "Máquina",
  TIPO_MAQUINA: "Tipo de máquina",
  GLOBAL: "Base global",
}

const REGRESSION_CHART_CONFIG = {
  integridade: {
    label: "Integridade real",
    color: "var(--primary)",
  },
  regressao: {
    label: "Regressao linear",
    color: "var(--chart-3)",
  },
}

const MAINTENANCE_PRIORITY_LABEL = {
  BAIXA: "Baixa",
  MEDIA: "Media",
  ALTA: "Alta",
  URGENTE: "Urgente",
}

const MAINTENANCE_ORIGIN_LABEL = {
  MANUAL: "Manual",
  ALERTA: "Alerta",
  PREDICAO: "Predicao",
}

const MAINTENANCE_COMPLIANCE_LABEL = {
  ANTECIPADA: "Antecipada",
  NO_PRAZO: "No prazo",
  ATRASADA: "Atrasada",
  NAO_APLICAVEL: "Nao aplicavel",
}

function getMachineSensors(maquina, sensores) {
  return sensores.filter((sensor) => sensor.maquinaId === maquina.id || sensor.maquinaNome === maquina.nome)
}

function getNumericValue(...values) {
  for (const value of values) {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function formatMetric(value, suffix = "", digits = 1) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return "N/A"
  }

  return `${parsed.toFixed(digits)}${suffix}`
}

function parseDateValue(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date : null
}

function formatPredictionDate(value) {
  const date = parseDateValue(value)

  if (!date) {
    return "Sem previsão"
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatPredictionRange(start, end) {
  const startDate = parseDateValue(start)
  const endDate = parseDateValue(end)

  if (!startDate && !endDate) {
    return "Sem janela"
  }

  if (!startDate) {
    return `Até ${formatPredictionDate(end)}`
  }

  if (!endDate) {
    return `A partir de ${formatPredictionDate(start)}`
  }

  if (startDate.getTime() === endDate.getTime()) {
    return formatPredictionDate(start)
  }

  return `${formatPredictionDate(start)} - ${formatPredictionDate(end)}`
}

function formatDaysUntil(value) {
  const date = parseDateValue(value)

  if (!date) {
    return ""
  }

  const diff = date.getTime() - Date.now()

  if (diff <= 0) {
    return "Prazo atingido"
  }

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (days === 1) {
    return "Em 1 dia"
  }

  return `Em ${days} dias`
}

function formatMaintenanceDate(value) {
  const date = parseDateValue(value)

  if (!date) {
    return "Data não informada"
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function formatMaintenanceWindow(start, end) {
  const startDate = parseDateValue(start)
  const endDate = parseDateValue(end)

  if (!startDate && !endDate) {
    return ""
  }

  if (startDate && endDate) {
    if (startDate.getTime() === endDate.getTime()) {
      return formatMaintenanceDate(start)
    }

    return `${formatMaintenanceDate(start)} - ${formatMaintenanceDate(end)}`
  }

  return startDate ? `A partir de ${formatMaintenanceDate(start)}` : `Ate ${formatMaintenanceDate(end)}`
}

function getFailurePredictionMetric(maquina) {
  const dataFalha = maquina?.dataFalha

  return {
    value: dataFalha ? formatPredictionDate(dataFalha) : "Sem previsão",
    sub: dataFalha ? formatDaysUntil(dataFalha) || "Data de cruzamento 30%" : "Falha 30% não projetada",
  }
}

function getMaintenanceStartMetric(maquina) {
  const dataInicioManutencao = maquina?.dataInicioManutencao ?? maquina?.previsaoManutencao
  const sourceLabel = maquina?.dataInicioManutencao ? "Cruzamento 70%" : "Previsão de manutenção"

  return {
    value: dataInicioManutencao ? formatPredictionDate(dataInicioManutencao) : "Sem previsão",
    sub: dataInicioManutencao ? formatDaysUntil(dataInicioManutencao) || sourceLabel : "Cruzamento 70% não projetado",
  }
}

function getMaintenanceWindowMetric(maquina) {
  const start = maquina?.janelaManuInicio
  const end = maquina?.janelaManuFim
  const startDate = parseDateValue(start)
  const endDate = parseDateValue(end)

  if (!startDate && !endDate) {
    return {
      value: "Sem janela calculada",
      sub: "Aguardando janela ideal de manutenção",
    }
  }

  if (startDate && endDate && startDate.getTime() === endDate.getTime()) {
    const isImmediate = startDate.getTime() <= Date.now()

    return {
      value: isImmediate ? "Manutenção imediata" : formatPredictionDate(start),
      sub: isImmediate
        ? `Janela pontual desde ${formatPredictionDate(start)}`
        : "Janela pontual de manutenção",
    }
  }

  return {
    value: formatPredictionRange(start, end),
    sub: "Janela ideal de manutenção",
  }
}

function formatScheduleDeviation(value) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return ""
  }

  const abs = Math.abs(parsed)
  const unit = abs === 1 ? "dia" : "dias"

  if (parsed < 0) {
    return `${abs} ${unit} antes`
  }

  if (parsed > 0) {
    return `${abs} ${unit} depois`
  }

  return "Sem desvio"
}

function formatPercentProbability(value) {
  if (value === null || value === undefined || value === "") {
    return "N/A"
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return "N/A"
  }

  return `${Math.round(parsed * 100)}%`
}

function formatDecimal(value, digits = 2) {
  if (value === null || value === undefined || value === "") {
    return "N/A"
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return "N/A"
  }

  return parsed.toFixed(digits).replace(".", ",")
}

function formatIntegrityPercentValue(value) {
  if (value === null || value === undefined || value === "") {
    return "--"
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return "--"
  }

  return `${parsed.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`
}

function formatR2Score(value) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return "N/A"
  }

  return `${Math.round(Math.max(0, Math.min(1, parsed)) * 100)}%`
}

function formatSlopeAngle(value) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return "N/A"
  }

  const angle = Math.atan(parsed) * (180 / Math.PI)

  return `${angle.toFixed(2).replace(".", ",")}°`
}

function getSlopeAngleDescription(value) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return "Sem tendencia calculada."
  }

  if (parsed < 0) {
    return "Negativo indica queda da integridade."
  }

  if (parsed > 0) {
    return "Positivo indica recuperacao ou alta."
  }

  return "Linha praticamente estavel."
}

function formatCount(value) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return "0"
  }

  return new Intl.NumberFormat("pt-BR").format(parsed)
}

function formatRegressionPointCount(value) {
  const parsed = Number(value)
  const count = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0

  if (count === 0) {
    return "Sem pontos"
  }

  if (count === 1) {
    return "1 ponto"
  }

  return `${new Intl.NumberFormat("pt-BR").format(count)} pontos`
}

function getRegressionChartCoverageHours(data) {
  const realPoints = Array.isArray(data)
    ? data.filter((point) => !point.projected && Number.isFinite(point.timestamp))
    : []

  if (realPoints.length < 2) {
    return null
  }

  const firstTimestamp = realPoints[0].timestamp
  const lastTimestamp = realPoints[realPoints.length - 1].timestamp
  const hours = (lastTimestamp - firstTimestamp) / (1000 * 60 * 60)

  return Number.isFinite(hours) ? Math.max(0, hours) : null
}

function getLatestFiniteChartValue(data, key, { realOnly = false } = {}) {
  const points = Array.isArray(data) ? data : []

  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (realOnly && points[index]?.projected) {
      continue
    }

    if (points[index]?.[key] === null || points[index]?.[key] === undefined || points[index]?.[key] === "") {
      continue
    }

    const value = Number(points[index]?.[key])

    if (Number.isFinite(value)) {
      return value
    }
  }

  return null
}

function formatRiskFactor(value) {
  if (!value) {
    return ""
  }

  return FATOR_RISCO_LABELS[value] ?? String(value).replace(/_/g, " ")
}

function getRiskTone(classificacao) {
  if (classificacao === "ALTO") {
    return "critical"
  }

  if (classificacao === "MEDIO") {
    return "warning"
  }

  if (classificacao === "BAIXO") {
    return "stable"
  }

  return "muted"
}

function getRiskBadgeLabel(classificacao) {
  if (classificacao === "ALTO") {
    return "Alto"
  }

  if (classificacao === "MEDIO") {
    return "Médio"
  }

  if (classificacao === "BAIXO") {
    return "Baixo"
  }

  return "Indisponível"
}

function unwrapPredictionPayload(payload, key) {
  if (!payload || typeof payload !== "object") {
    return null
  }

  if (payload[key] && typeof payload[key] === "object") {
    return payload[key]
  }

  if (payload.dados && typeof payload.dados === "object") {
    return unwrapPredictionPayload(payload.dados, key)
  }

  if (payload.data && typeof payload.data === "object") {
    return unwrapPredictionPayload(payload.data, key)
  }

  return payload
}

function normalizeHistoricoIntegridadeCollection(payload) {
  return extractCollection(payload)
    .map((raw, index) => {
      const integridade = getNumericValue(raw?.integridade, raw?.saude, raw?.healthScore)
      const scoreEstabilidade = getNumericValue(raw?.scoreEstabilidade, raw?.estabilidade, raw?.stabilityScore)
      const criadoEm = raw?.criadoEm ?? raw?.createdAt ?? raw?.dataCriacao ?? raw?.timestamp
      const date = parseDateValue(criadoEm)

      if (!date || integridade === null) {
        return null
      }

      return {
        id: raw?.id ?? `${date.toISOString()}-${index}`,
        maquinaId: raw?.maquinaId ?? raw?.maquina?.id ?? null,
        integridade,
        scoreEstabilidade,
        origem: raw?.origem ?? "",
        observacao: raw?.observacao ?? "",
        criadoEm: date.toISOString(),
      }
    })
    .filter(Boolean)
    .sort((a, b) => Date.parse(a.criadoEm) - Date.parse(b.criadoEm))
}

function normalizeRealtimeHistoricoIntegridade(payload) {
  const source = payload?.historicoIntegridade ?? payload?.historico_integridade ?? payload?.historico ?? payload
  const collection = normalizeHistoricoIntegridadeCollection(source)

  if (collection.length > 0 || !source || Array.isArray(source) || typeof source !== "object") {
    return collection
  }

  return normalizeHistoricoIntegridadeCollection([source])
}

function getHistoricoIntegridadePointKey(point, index) {
  if (point?.id !== undefined && point.id !== null && point.id !== "") {
    return `id:${point.id}`
  }

  if (point?.criadoEm) {
    return `criadoEm:${point.criadoEm}`
  }

  return `index:${index}`
}

function mergeHistoricoIntegridade(current, incoming) {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return Array.isArray(current) ? current : []
  }

  const pointsByKey = new Map()
  const appendPoint = (point, index) => {
    pointsByKey.set(getHistoricoIntegridadePointKey(point, index), point)
  }

  for (const [index, point] of (Array.isArray(current) ? current : []).entries()) {
    appendPoint(point, index)
  }

  for (const [index, point] of incoming.entries()) {
    appendPoint(point, index)
  }

  return Array.from(pointsByKey.values())
    .sort((a, b) => Date.parse(a.criadoEm) - Date.parse(b.criadoEm))
}

function getRealtimeMaquinaId(payload) {
  if (!payload || typeof payload !== "object") {
    return null
  }

  return payload.maquinaId ??
    payload.maquina_id ??
    payload.idMaquina ??
    payload.maquina?.id ??
    payload.historicoIntegridade?.maquinaId ??
    payload.historico_integridade?.maquinaId ??
    payload.historico?.maquinaId ??
    null
}

async function fetchMachinePredictions(maquinaId, accessToken, signal, historicoPeriod = DEFAULT_REGRESSION_PERIOD) {
  const historicoParams = new URLSearchParams({
    periodo: getRegressionPeriodOption(historicoPeriod).value,
  })
  const [alertasResult, riscoResult, historicoResult] = await Promise.allSettled([
    requestDashboardJson(`/maquinas/${maquinaId}/predicao-alertas`, accessToken, "a predição de alertas", { signal }),
    requestDashboardJson(`/maquinas/${maquinaId}/predicao-risco`, accessToken, "a predição de risco", { signal }),
    requestDashboardJson(`/maquinas/${maquinaId}/historico-integridade?${historicoParams.toString()}`, accessToken, "o histórico de integridade", { signal }),
  ])

  const alertas =
    alertasResult.status === "fulfilled"
      ? unwrapPredictionPayload(alertasResult.value, "predicaoAlertas")
      : null
  const risco =
    riscoResult.status === "fulfilled"
      ? unwrapPredictionPayload(riscoResult.value, "predicaoRisco")
      : null
  const historico =
    historicoResult.status === "fulfilled"
      ? normalizeHistoricoIntegridadeCollection(historicoResult.value)
      : []
  const errors = {
    alertas: alertasResult.status === "rejected" && alertasResult.reason instanceof Error
      ? alertasResult.reason.message
      : "",
    risco: riscoResult.status === "rejected" && riscoResult.reason instanceof Error
      ? riscoResult.reason.message
      : "",
    historico: historicoResult.status === "rejected" && historicoResult.reason instanceof Error
      ? historicoResult.reason.message
      : "",
  }
  const unauthorized = [alertasResult, riscoResult, historicoResult].some(
    (result) => result.status === "rejected" && getHttpErrorStatus(result.reason) === 401
  )

  return { alertas, risco, historico, errors, unauthorized }
}

function calculateSensorHealthScore(sensor) {
  const temp = getNumericValue(sensor?.temperatura?.valorAtual, sensor?.temperatura, sensor?.ultimaTemperatura)
  const vibra = getNumericValue(sensor?.vibracao?.valorAtual, sensor?.vibracao, sensor?.ultimaVibracao)
  const idealTemp = getNumericValue(sensor?.idealTemperatura)
  const limitTemp = getNumericValue(sensor?.limiteTemperatura, sensor?.temperatura?.limiteMax)
  const idealVibra = getNumericValue(sensor?.idealVibracao)
  const limitVibra = getNumericValue(sensor?.limiteVibracao, sensor?.vibracao?.limiteMax)

  if ([temp, vibra, idealTemp, limitTemp, idealVibra, limitVibra].some((value) => value === null)) {
    return null
  }

  const diffTemp = limitTemp - idealTemp || 1
  const diffVibra = limitVibra - idealVibra || 1
  const scoreTemp = Math.max(0, Math.min(1, 1 - (temp - idealTemp) / diffTemp))
  const scoreVibra = Math.max(0, Math.min(1, 1 - (vibra - idealVibra) / diffVibra))
  const score = ((scoreTemp * 0.4) + (scoreVibra * 0.6)) * 100

  return Number.isFinite(score) ? score : null
}

function getAverageSensorHealthScore(sensores) {
  const scores = sensores
    .map((sensor) => calculateSensorHealthScore(sensor))
    .filter((score) => Number.isFinite(score))

  if (scores.length === 0) {
    return null
  }

  return scores.reduce((total, score) => total + score, 0) / scores.length
}

function getPredictionSummary({ maquina, statusExibicao, integridadeExibicao }) {
  const hasSensors = statusExibicao !== "SEM_SENSOR"
  const integridade = Number(integridadeExibicao)
  const falhaPrevista = parseDateValue(maquina.dataFalha)
  const janelaInicio = parseDateValue(maquina.janelaManuInicio)
  const janelaFim = parseDateValue(maquina.janelaManuFim)
  const now = Date.now()
  const janelaAtiva =
    Boolean(janelaInicio && janelaFim) &&
    janelaInicio.getTime() <= now &&
    janelaFim.getTime() >= now

  if (!hasSensors) {
    return {
      tone: "muted",
      badge: "Sem base",
      title: "Previsão indisponível",
      description: "A máquina ainda não tem sensores vinculados para sustentar uma leitura preditiva.",
    }
  }

  if (falhaPrevista) {
    if (janelaAtiva) {
      return {
        tone: "warning",
        badge: "Janela ativa",
        title: "Priorizar manutenção",
        description: "A janela recomendada pelo modelo já está aberta para esta máquina.",
      }
    }

    return {
      tone: "attention",
      badge: "Previsão ativa",
      title: "Planejar intervenção",
      description: "O histórico de integridade já indica uma data provável de falha.",
    }
  }

  if (Number.isFinite(integridade) && integridade <= PREDICAO_LIMIAR_FALHA) {
    return {
      tone: "critical",
      badge: "Crítico",
      title: "Integridade em nível de falha",
      description: "A máquina já está abaixo do limiar crítico usado pela predição.",
    }
  }

  if (Number.isFinite(integridade) && integridade < PREDICAO_LIMIAR_MANUTENCAO) {
    return {
      tone: "warning",
      badge: "Atenção",
      title: "Abaixo do limiar de manutenção",
      description: "A saúde atual pede acompanhamento, mesmo sem uma data de falha confiável.",
    }
  }

  return {
    tone: "stable",
    badge: "Estável",
    title: "Sem previsão crítica",
    description: "A curva atual não indica queda suficiente para projetar falha dentro da janela monitorada.",
  }
}

function PredictionPrimaryMetric({ label, value, sub }) {
  return (
    <div className="min-w-0 rounded-lg border border-border/80 bg-background/90 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <span className="block text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">{label}</span>
      <span className="mt-1.5 block break-words text-lg font-semibold leading-tight">{value}</span>
      {sub ? <span className="mt-1.5 block text-sm leading-snug text-muted-foreground">{sub}</span> : null}
    </div>
  )
}

function RegressionLegendSwatch({ color, dashed = false, vertical = false, dot = false }) {
  if (vertical) {
    return (
      <span className="relative h-5 w-8 shrink-0" aria-hidden="true">
        <span
          className="absolute left-1/2 top-0 h-full w-0 -translate-x-1/2 border-l-2"
          style={{ borderColor: color, borderStyle: dashed ? "dashed" : "solid" }}
        />
      </span>
    )
  }

  return (
    <span className="relative h-3 w-8 shrink-0" aria-hidden="true">
      <span
        className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 rounded-full"
        style={{ backgroundColor: dashed ? "transparent" : color, borderTop: dashed ? `2px dashed ${color}` : undefined }}
      />
      {dot ? (
        <span
          className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background"
          style={{ backgroundColor: color }}
        />
      ) : null}
    </span>
  )
}

function RegressionLegendItem({ color, dashed, vertical, dot, label, detail, value }) {
  const labelLines = Array.isArray(label) ? label : [label]

  return (
    <div className="flex min-w-0 items-center gap-3">
      <RegressionLegendSwatch color={color} dashed={dashed} vertical={vertical} dot={dot} />
      <span className="min-w-0 flex-1">
        <span className="block font-medium leading-snug text-foreground">
          {labelLines.map((line) => (
            <span key={line} className="block truncate">{line}</span>
          ))}
        </span>
        {detail ? <span className="block truncate text-muted-foreground">{detail}</span> : null}
      </span>
      {value ? (
        <span className="max-w-24 shrink-0 truncate rounded-md bg-background/30 px-2 py-1 text-right font-mono font-semibold text-foreground tabular-nums">
          {value}
        </span>
      ) : null}
    </div>
  )
}

function RegressionChartLegend({ latestIntegrity, latestRegression, maintenancePrediction, failurePrediction }) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-black/10 bg-slate-950/2 px-4 py-3 text-xs shadow-inner dark:bg-slate-950/45 sm:grid-cols-2">
      <RegressionLegendItem
        color="var(--primary)"
        dot
        label="Integridade real"
        detail="Pontos retornados pelo historico"
        value={formatIntegrityPercentValue(latestIntegrity)}
      />
      <RegressionLegendItem
        color="var(--chart-3)"
        dashed
        label="Regressão linear"
        detail="Tendência usada na previsão"
        value={formatIntegrityPercentValue(latestRegression)}
      />
      <RegressionLegendItem
        color="#94a3b8"
        dashed
        vertical
        label="Atual"
        detail="Linha do tempo atual"
        value="Agora"
      />
      <RegressionLegendItem
        color="#f59e0b"
        dashed
        vertical
        label={["Manutenção", "Previsão"]}
        detail="Cruzamento com 70%"
        value={maintenancePrediction?.value}
      />
      <RegressionLegendItem
        color="#f59e0b"
        dashed
        label="Limiar de manutenção"
        detail="Referência horizontal"
        value="70%"
      />
      <RegressionLegendItem
        color="#ef4444"
        dashed
        vertical
        label="Falha prevista"
        detail="Cruzamento com 30%"
        value={failurePrediction?.value}
      />
      <RegressionLegendItem
        color="#ef4444"
        dashed
        label="Limiar crítico"
        detail="Referência horizontal"
        value="30%"
      />
    </div>
  )
}

function PredictionMetric({ label, value, sub }) {
  return (
    <div className="min-w-0 rounded-md border border-border/70 bg-background/80 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <span className="block text-[11px] font-medium uppercase text-muted-foreground">{label}</span>
      <span className="mt-1 block break-words text-sm font-semibold leading-snug">{value}</span>
      {sub ? <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{sub}</span> : null}
    </div>
  )
}

function getPredictionModel(predicao) {
  const modelo = getPredictionModelMetadata(predicao?.modeloIntegridade)

  if (!modelo) {
    return null
  }

  if (modelo.slope === null || modelo.intercept === null) {
    return null
  }

  return modelo
}

function getNextAlertSummary(predicao) {
  const prediction = predicao?.proximoAlerta
  const operationalStatus = getPredictionOperationalStatus(predicao)

  if (!prediction) {
    const reason =
      formatPredictionReason(predicao?.ausenciaProximoAlerta?.motivo) ||
      operationalStatus?.reasonLabel

    return {
      value: operationalStatus?.badge || "Sem previsao",
      sub: reason || operationalStatus?.description || "Ainda sem evento previsivel.",
    }
  }

  const tipo = ALERTA_TIPO_LABELS[prediction.tipo] ?? prediction.tipo ?? "Alerta"
  const confidence = formatPercentProbability(prediction.confianca)

  return {
    value: formatPredictionDate(prediction.dataPrevista),
    sub: `${tipo} - ${confidence} confianca`,
  }
}

function getHighestRiskSummary(predicao) {
  const riscos = predicao?.riscos && typeof predicao.riscos === "object" ? predicao.riscos : {}
  const candidates = Object.entries(riscos)
    .map(([type, risk]) => ({
      type,
      risk,
      value: Number(risk?.["72h"]),
    }))
    .filter((item) => Number.isFinite(item.value))
    .sort((a, b) => b.value - a.value)

  if (candidates.length === 0) {
    const reason = Object.values(riscos)
      .map((risk) => formatPredictionReason(risk?.motivoAusencia))
      .find(Boolean)

    return {
      value: "N/A",
      sub: reason || "Risco ainda nao calculado.",
    }
  }

  const top = candidates[0]
  const label = RISCO_LABELS[top.type] ?? top.type

  return {
    value: `${label} ${formatPercentProbability(top.value)}`,
    sub: `${getRiskBadgeLabel(top.risk?.classificacao)} em 72h`,
  }
}

function PredicaoResumoCard({ maquina, summary, predicaoAlertas, predicaoRisco, onOpenRegression }) {
  const nextAlert = getNextAlertSummary(predicaoAlertas)
  const highestRisk = getHighestRiskSummary(predicaoRisco)
  const operationalStatus = getPredictionOperationalStatus(predicaoAlertas)
  const failurePrediction = getFailurePredictionMetric(maquina)
  const maintenanceStart = getMaintenanceStartMetric(maquina)

  return (
    <div className="rounded-lg border border-[#5E17EB]/25 bg-[#5E17EB]/5 p-3 dark:border-[#5E17EB]/45 dark:bg-[#5E17EB]/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Label>Resumo preditivo</Label>
          </div>
          <p className="mt-2 text-sm font-semibold leading-snug">{summary.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{summary.description}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <PredictionMetric
          label="Status IA"
          value={operationalStatus?.badge ?? summary.badge}
          sub={operationalStatus?.reasonLabel || operationalStatus?.title || summary.title}
        />
        <PredictionMetric
          label="Decisao"
          value={operationalStatus?.urgencyLabel ?? "N/A"}
          sub={operationalStatus?.sourceLabel || "Aguardando backend"}
        />
        <PredictionMetric
          label="Falha prevista"
          value={failurePrediction.value}
          sub={failurePrediction.sub}
        />
        <PredictionMetric
          label="Manutenção prevista"
          value={maintenanceStart.value}
          sub={maintenanceStart.sub}
        />
        <PredictionMetric label="Proximo alerta" value={nextAlert.value} sub={nextAlert.sub} />
        <PredictionMetric label="Maior risco 72h" value={highestRisk.value} sub={highestRisk.sub} />
      </div>

      <Button type="button" className="mt-3 w-full cursor-pointer" onClick={onOpenRegression}>
        <ActivityIcon className="mr-1 size-4" />
        Ver regressao
      </Button>
    </div>
  )
}

function PredicaoManutencaoCard({
  maquina,
  sensoresDaMaquina,
  integridadeExibicao,
  statusExibicao,
  summary: providedSummary,
  showHeader = true,
}) {
  const summary = providedSummary ?? getPredictionSummary({ maquina, statusExibicao, integridadeExibicao })
  const sensorHealthScore = getAverageSensorHealthScore(sensoresDaMaquina)
  const integridade = Number(integridadeExibicao)
  const healthScore = Number.isFinite(sensorHealthScore)
    ? sensorHealthScore
    : Number.isFinite(integridade)
      ? integridade
      : null
  const failurePrediction = getFailurePredictionMetric(maquina)
  const maintenanceStart = getMaintenanceStartMetric(maquina)
  const maintenanceWindow = getMaintenanceWindowMetric(maquina)
  const limiarSub = Number.isFinite(healthScore)
    ? healthScore < PREDICAO_LIMIAR_MANUTENCAO
      ? "Abaixo do ponto de manutenção"
      : "Acima do ponto de manutenção"
    : "Aguardando leitura"
  const toneClasses = {
    stable: "border bg-transparent dark:border dark:bg-transparent",
    attention: "border-[#5E17EB]/30 bg-[#5E17EB]/5 dark:border-[#5E17EB]/50 dark:bg-[#5E17EB]/10",
    warning: "border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/25",
    critical: "border-red-200 bg-red-50/80 dark:border-red-900/60 dark:bg-red-950/25",
    muted: "border-border bg-muted/30",
  }
  const badgeClasses = {
    stable: "border bg-white text-emerald-700 dark:border dark:bg-transparent dark:text-[#7c3aed]",
    attention: "border-[#5E17EB]/30 bg-white text-[#5E17EB] dark:border-[#5E17EB]/50 dark:bg-[#5E17EB]/10 dark:text-[#A780FF]",
    warning: "border-amber-200 bg-white text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
    critical: "border-red-200 bg-white text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
    muted: "border-border bg-background text-muted-foreground",
  }

  return (
    <div className={cn("rounded-lg border p-3", toneClasses[summary.tone])}>
      {showHeader ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ActivityIcon className="size-4 text-[#5E17EB]" />
              <Label>Predição de manutenção</Label>
            </div>
            <p className="mt-2 text-sm font-semibold leading-snug">{summary.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{summary.description}</p>
          </div>
          <Badge variant="outline" className={cn("shrink-0 px-2 text-xs", badgeClasses[summary.tone])}>
            {summary.badge}
          </Badge>
        </div>
      ) : (
        <div className="rounded-md border border-border/60 bg-background/65 p-3">
          <p className="text-sm font-semibold leading-snug">{summary.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{summary.description}</p>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <PredictionMetric
          label="Falha prevista"
          value={failurePrediction.value}
          sub={failurePrediction.sub}
        />
        <PredictionMetric
          label="Manutenção prevista"
          value={maintenanceStart.value}
          sub={maintenanceStart.sub}
        />
        <PredictionMetric
          label="Janela ideal"
          value={maintenanceWindow.value}
          sub={maintenanceWindow.sub}
        />
        <PredictionMetric
          label="Saúde dos sensores"
          value={Number.isFinite(sensorHealthScore) ? `${Math.round(sensorHealthScore)}%` : "Sem leitura"}
          sub="Temperatura 40% / vibração 60%"
        />
        <PredictionMetric
          label="Limiar atual"
          value={Number.isFinite(healthScore) ? `${Math.round(healthScore)}%` : "--"}
          sub={limiarSub}
        />
      </div>
    </div>
  )
}

function getPredictiveMaintenanceFromSources(maquina, manutencoes) {
  if (maquina?.manutencaoPreditiva) {
    return maquina.manutencaoPreditiva
  }

  const predictiveMaintenances = Array.isArray(manutencoes)
    ? manutencoes.filter((item) => item?.tipo === "PREVENTIVA" && item?.origem === "PREDICAO")
    : []

  return (
    predictiveMaintenances.find((item) => item.status === "EM_ANDAMENTO") ??
    predictiveMaintenances.find((item) => item.status === "AGENDADA") ??
    predictiveMaintenances[0] ??
    null
  )
}

function formatPredictiveConfidence(value) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return "N/A"
  }

  const normalized = parsed <= 1 ? parsed * 100 : parsed
  return `${Math.round(Math.max(0, Math.min(100, normalized)))}%`
}

function PredicaoAgendamentoSeguroCard({ maquina, manutencaoPreditiva }) {
  const estado = maquina?.estadoPredicaoManutencao
  const status = getPredictiveMaintenanceStatus({ estado, manutencaoPreditiva })
  const validas = estado?.validasConsecutivas ?? 0
  const invalidas = estado?.invalidasConsecutivas ?? 0
  const progress = Math.max(0, Math.min(PREDICTIVE_MAINTENANCE_REQUIRED_CONFIRMATIONS, validas))
  const dataCandidata =
    manutencaoPreditiva?.dataAgendada ??
    estado?.ultimaDataAgendada ??
    estado?.ultimaPrevisaoManutencao ??
    null
  const reprovados = estado?.criteriosReprovados ?? []
  const modelo = estado?.modeloIntegridade
  const toneClasses = {
    stable: "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/25",
    attention: "border-[#5E17EB]/30 bg-[#5E17EB]/5 dark:border-[#5E17EB]/50 dark:bg-[#5E17EB]/10",
    warning: "border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/25",
    muted: "border-border bg-muted/30",
  }
  const badgeClasses = {
    stable: "border-emerald-200 bg-white text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    attention: "border-[#5E17EB]/30 bg-white text-[#5E17EB] dark:border-[#5E17EB]/50 dark:bg-[#5E17EB]/10 dark:text-[#A780FF]",
    warning: "border-amber-200 bg-white text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
    muted: "border-border bg-background text-muted-foreground",
  }
  const description =
    status.type === "agendada" && dataCandidata
      ? `Preventiva preditiva agendada para ${formatMaintenanceDate(dataCandidata)}.`
      : status.description

  return (
    <div className={cn("rounded-lg border p-3", toneClasses[status.tone] ?? toneClasses.muted)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarCheckIcon className="size-4 text-[#5E17EB]" />
            <Label>Agendamento preditivo seguro</Label>
          </div>
          <p className="mt-2 text-sm font-semibold leading-snug">{status.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline" className={cn("shrink-0 px-2 text-xs", badgeClasses[status.tone] ?? badgeClasses.muted)}>
          {status.badge}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <PredictionMetric
          label="Confirmacoes"
          value={`${progress}/${PREDICTIVE_MAINTENANCE_REQUIRED_CONFIRMATIONS}`}
          sub={invalidas > 0 ? `${invalidas} invalida(s) consecutiva(s)` : "Leituras validas consecutivas"}
        />
        <PredictionMetric
          label="Score"
          value={formatPredictiveConfidence(estado?.scoreConfianca)}
          sub={estado?.ultimoMotivo ? formatPredictionReason(estado.ultimoMotivo) : "Confianca da candidatura"}
        />
        <PredictionMetric
          label="Data candidata"
          value={dataCandidata ? formatMaintenanceDate(dataCandidata) : "Sem data"}
          sub={dataCandidata ? formatDaysUntil(dataCandidata) : "Aguardando calculo"}
        />
        <PredictionMetric
          label="Modelo"
          value={modelo?.r2 !== null && modelo?.r2 !== undefined ? `R2 ${formatDecimal(modelo.r2, 2)}` : "N/A"}
          sub={modelo?.pontosUsados ? `${formatCount(modelo.pontosUsados)} pontos usados` : "Integridade estatistica"}
        />
      </div>

      {reprovados.length > 0 ? (
        <div className="mt-3 rounded-md border border-border/70 bg-background/70 p-2">
          <span className="text-[11px] font-medium uppercase text-muted-foreground">Criterios pendentes</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {reprovados.map((criteria) => (
              <Badge key={criteria} variant="outline" className="border-border/70 bg-background/80 px-2 text-[11px] text-muted-foreground">
                {formatPredictiveMaintenanceCriteria(criteria)}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function PredictionRemoteNotice({ loading, errors }) {
  const messages = Object.values(errors || {}).filter(Boolean)

  if (loading) {
    return null
  }

  if (messages.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-300">
      {messages.length === 1
        ? messages[0]
        : "Parte das predições não pôde ser carregada agora."}
    </div>
  )
}

function PredictionLoadingState() {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-[#5E17EB]/25 bg-[#5E17EB]/5 px-4 py-10 text-center dark:border-[#5E17EB]/45 dark:bg-[#5E17EB]/10">
      <Loader2Icon className="size-7 animate-spin text-[#7c3aed]" />
      <p className="mt-3 text-sm font-medium text-foreground">Carregando predições</p>
      <p className="mt-1 text-xs text-muted-foreground">Atualizando risco, histórico e resumo da máquina.</p>
    </div>
  )
}

function PredicaoAlertaItem({ title, prediction, absence, fallbackReason }) {
  if (!prediction) {
    return (
      <div className="rounded-md border border-border/70 bg-background/80 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{title}</span>
          <Badge variant="outline" className="border-border/70 px-2 text-xs text-muted-foreground">
            Sem previsão
          </Badge>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {formatPredictionReason(absence?.motivo) || formatPredictionReason(fallbackReason) || "O backend não retornou uma previsão para esta janela."}
        </p>
      </div>
    )
  }

  const tipo = ALERTA_TIPO_LABELS[prediction.tipo] ?? prediction.tipo ?? "Alerta"
  const fonte = FONTE_LIMIAR_LABELS[prediction.fonteLimiar] ?? prediction.fonteLimiar

  return (
    <div className="rounded-md border border-[#5E17EB]/25 bg-[#5E17EB]/5 p-3 dark:border-[#5E17EB]/45 dark:bg-[#5E17EB]/10">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="mt-1 block text-xs text-muted-foreground">{tipo}</span>
        </div>
        <Badge variant="outline" className="shrink-0 border-[#5E17EB]/35 bg-background/80 px-2 text-xs text-[#7c3aed] dark:text-[#A780FF]">
          {formatPercentProbability(prediction.confianca)} confiança
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <PredictionMetric
          label="Data prevista"
          value={formatPredictionDate(prediction.dataPrevista)}
          sub={formatDaysUntil(prediction.dataPrevista)}
        />
        <PredictionMetric
          label="Limiar"
          value={formatMetric(prediction.integridadeLimiar, "%", 1)}
          sub={fonte ? `${fonte}${prediction.amostrasLimiar ? ` - ${prediction.amostrasLimiar} amostras` : ""}` : ""}
        />
      </div>
    </div>
  )
}

function PredicaoAlertasCard({ predicao }) {
  if (!predicao) {
    return null
  }

  const modelo = getPredictionModel(predicao)
  const operationalStatus = getPredictionOperationalStatus(predicao)

  return (
    <div className="rounded-lg border border-border/70 bg-background/60 p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="size-4 text-[#5E17EB]" />
          <Label>Alertas preditivos</Label>
        </div>
        {operationalStatus ? (
          <Badge variant="outline" className="shrink-0 border-[#5E17EB]/35 bg-background/80 px-2 text-xs text-[#7c3aed] dark:text-[#A780FF]">
            {operationalStatus.badge}
          </Badge>
        ) : null}
      </div>
      <div className="grid gap-3">
        <PredicaoAlertaItem
          title="Próximo alerta"
          prediction={predicao.proximoAlerta}
          absence={predicao.ausenciaProximoAlerta}
          fallbackReason={predicao.motivo}
        />
        <PredicaoAlertaItem
          title="Instabilidade"
          prediction={predicao.instabilidade}
          absence={predicao.ausenciaInstabilidade}
          fallbackReason={predicao.motivo}
        />
      </div>
      {modelo ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <PredictionMetric label="R²" value={formatDecimal(modelo.r2, 2)} sub="Ajuste do modelo" />
          <PredictionMetric label="Inclinação" value={formatDecimal(modelo.slope, 2)} sub="Tendência" />
          <PredictionMetric label="Pontos" value={formatCount(modelo.pontosUsados)} sub="Histórico usado" />
          <PredictionMetric label="Janela" value={formatCoveredHours(modelo.janelaHorasCoberta)} sub="Cobertura temporal" />
          <PredictionMetric
            label="Último ponto"
            value={modelo.ultimoPontoEm ? formatPredictionDate(modelo.ultimoPontoEm) : "N/A"}
            sub="Base mais recente"
          />
        </div>
      ) : null}
    </div>
  )
}

function RiskProbabilityBar({ label, value }) {
  const parsed = Number(value)
  const width = Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed * 100))) : 0

  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{formatPercentProbability(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-[#5E17EB] transition-all" style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function RiskItem({ type, risk }) {
  const tone = getRiskTone(risk?.classificacao)
  const badgeClasses = {
    stable: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-300",
    warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-300",
    critical: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/25 dark:text-red-300",
    muted: "border-border bg-background text-muted-foreground",
  }

  return (
    <div className="rounded-md border border-border/70 bg-background/80 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{RISCO_LABELS[type] ?? type}</span>
        <Badge variant="outline" className={cn("px-2 text-xs", badgeClasses[tone])}>
          {getRiskBadgeLabel(risk?.classificacao)}
        </Badge>
      </div>
      {!risk ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          O backend não retornou este bloco de risco.
        </p>
      ) : risk.motivoAusencia ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {formatPredictionReason(risk.motivoAusencia)}
        </p>
      ) : (
        <div className="mt-3 grid gap-3">
          <RiskProbabilityBar label="24h" value={risk?.["24h"]} />
          <RiskProbabilityBar label="72h" value={risk?.["72h"]} />
        </div>
      )}
    </div>
  )
}

function PredicaoRiscoCard({ predicao }) {
  if (!predicao) {
    return null
  }

  const riscos = predicao.riscos && typeof predicao.riscos === "object" ? predicao.riscos : {}
  const fatores = Array.isArray(predicao.fatoresPrincipais) ? predicao.fatoresPrincipais : []
  const metadados = predicao.metadados && typeof predicao.metadados === "object" ? predicao.metadados : null

  return (
    <div className="rounded-lg border border-border/70 bg-background/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ActivityIcon className="size-4 text-[#5E17EB]" />
            <Label>Risco operacional</Label>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Probabilidade independente para 24h e 72h.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 border-[#5E17EB]/35 bg-background/80 px-2 text-xs text-[#7c3aed] dark:text-[#A780FF]">
          {formatPercentProbability(predicao.confiancaGeral)} confiança
        </Badge>
      </div>
      <div className="mt-3 grid gap-2">
        {["instabilidade", "alerta", "manutencao"].map((type) => (
          <RiskItem key={type} type={type} risk={riscos[type]} />
        ))}
      </div>
      {fatores.length > 0 ? (
        <div className="mt-3">
          <span className="text-[11px] font-medium uppercase text-muted-foreground">Fatores principais</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {fatores.map((factor) => (
              <Badge key={factor} variant="outline" className="border-border/70 bg-background/80 px-2 text-[11px] text-muted-foreground">
                {formatRiskFactor(factor)}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
      {metadados ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <PredictionMetric label="Histórico" value={formatCount(metadados.pontosHistoricoIntegridade)} sub="pontos" />
          <PredictionMetric label="Leituras" value={formatCount(metadados.leiturasConsideradas)} sub="7 dias" />
          <PredictionMetric label="Alertas" value={formatCount(metadados.alertasRecentesConsiderados)} sub="72h" />
        </div>
      ) : null}
      {predicao.modeloVersao ? (
        <p className="mt-2 text-[11px] text-muted-foreground">Modelo: {predicao.modeloVersao}</p>
      ) : null}
    </div>
  )
}

function getRegressionValue(modelo, hoursSinceBase) {
  if (!modelo || !Number.isFinite(hoursSinceBase)) {
    return null
  }

  const value = modelo.intercept + (modelo.slope * hoursSinceBase)
  return Number.isFinite(value) ? Number(value.toFixed(2)) : null
}

function clampRegressionChartValue(value) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return null
  }

  return Number(Math.max(0, Math.min(100, parsed)).toFixed(2))
}

function getChartDate(value) {
  if (typeof value === "number") {
    const date = new Date(value)
    return Number.isFinite(date.getTime()) ? date : null
  }

  return parseDateValue(value)
}

function formatChartDate(value) {
  const date = getChartDate(value)

  if (!date) {
    return ""
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatChartTickDate(value) {
  const date = getChartDate(value)

  if (!date) {
    return ""
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date)
}

function formatRegressionChartTickDate(value, period) {
  const date = getChartDate(value)

  if (!date) {
    return ""
  }

  if (period === "1d") {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return formatChartTickDate(value)
}

function getRegressionPeriodOption(period) {
  return REGRESSION_PERIOD_OPTIONS.find((option) => option.value === period) ?? REGRESSION_PERIOD_OPTIONS[0]
}

function getRegressionModelBaseTime(modelo, fallbackBaseTime) {
  const lastModelPoint = parseDateValue(modelo?.ultimoPontoEm)
  const coveredHours = Number(modelo?.janelaHorasCoberta)

  if (lastModelPoint && Number.isFinite(coveredHours) && coveredHours > 0) {
    return lastModelPoint.getTime() - (coveredHours * 60 * 60 * 1000)
  }

  return fallbackBaseTime
}

function getRegressionThresholdDate(modelo, historico, threshold) {
  if (!modelo) {
    return null
  }

  const slope = Number(modelo.slope)
  const intercept = Number(modelo.intercept)

  if (!Number.isFinite(slope) || !Number.isFinite(intercept) || slope >= 0) {
    return null
  }

  const points = normalizeRegressionHistoricoPoints(historico)
  const fallbackBaseTime = points[0]?.timestamp ?? parseDateValue(modelo.ultimoPontoEm)?.getTime()
  const modelBaseTime = getRegressionModelBaseTime(modelo, fallbackBaseTime)
  const hoursUntilThreshold = (threshold - intercept) / slope

  if (!Number.isFinite(modelBaseTime) || !Number.isFinite(hoursUntilThreshold)) {
    return null
  }

  const thresholdTimestamp = modelBaseTime + (hoursUntilThreshold * 60 * 60 * 1000)
  const thresholdDate = new Date(thresholdTimestamp)

  return Number.isFinite(thresholdDate.getTime()) ? thresholdDate.toISOString() : null
}

function getRegressionMaintenanceMetric(modelo, historico) {
  const regressionMaintenanceDate = getRegressionThresholdDate(modelo, historico, PREDICAO_LIMIAR_MANUTENCAO)

  if (!regressionMaintenanceDate) {
    return {
      date: null,
      value: "Sem previsão",
      sub: modelo ? "A regressão linear não cruza 70%." : "Sem regressão linear calculada.",
    }
  }

  return {
    date: regressionMaintenanceDate,
    value: formatPredictionDate(regressionMaintenanceDate),
    sub: formatDaysUntil(regressionMaintenanceDate) || "Cruzamento da regressão linear em 70%",
  }
}

function normalizeRegressionHistoricoPoints(historico) {
  const points = Array.isArray(historico) ? historico : []
  return points
    .map((point, index) => {
      const timestamp = Date.parse(point?.criadoEm)
      const integridade = getNumericValue(point?.integridade)

      if (!Number.isFinite(timestamp) || integridade === null) {
        return null
      }

      return { ...point, id: point.id ?? index, timestamp, integridade }
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp)
}

function buildRegressionChartData(historico, modelo, predictionDates = {}, period = DEFAULT_REGRESSION_PERIOD) {
  const points = Array.isArray(historico) ? historico : []
  const periodOption = getRegressionPeriodOption(period)

  if (points.length === 0) {
    return []
  }

  const periodPoints = normalizeRegressionHistoricoPoints(points)

  if (periodPoints.length === 0) {
    return []
  }

  const baseTime = periodPoints[0].timestamp
  const modelBaseTime = getRegressionModelBaseTime(modelo, baseTime)

  if (!Number.isFinite(baseTime) || !Number.isFinite(modelBaseTime)) {
    return []
  }

  const data = periodPoints
    .map((point, index) => {
      const hours = (point.timestamp - modelBaseTime) / (1000 * 60 * 60)

      return {
        id: point.id ?? index,
        timestamp: point.timestamp,
        integridade: point.integridade,
        regressao: null,
        projected: false,
      }
    })
    .filter(Boolean)

  const lastTimestamp = data[data.length - 1]?.timestamp
  const forecastLimit = Number.isFinite(lastTimestamp)
    ? lastTimestamp + (periodOption.hours * 60 * 60 * 1000)
    : null
  const forecastTimestamps = [
    parseDateValue(predictionDates.dataInicioManutencao)?.getTime(),
    parseDateValue(predictionDates.dataFalha)?.getTime(),
  ]
    .filter((timestamp) =>
      modelo &&
      Number.isFinite(timestamp) &&
      Number.isFinite(lastTimestamp) &&
      Number.isFinite(forecastLimit) &&
      timestamp > lastTimestamp &&
      timestamp <= forecastLimit
    )
    .filter((timestamp, index, timestamps) => timestamps.indexOf(timestamp) === index)
    .sort((a, b) => a - b)

  for (const timestamp of forecastTimestamps) {
    const hours = (timestamp - modelBaseTime) / (1000 * 60 * 60)

    data.push({
      id: `previsao-${timestamp}`,
      timestamp,
      integridade: null,
      regressao: null,
      projected: true,
    })
  }

  if (modelo && data.length > 0) {
    const regressionIndexes = Array.from(new Set([0, data.length - 1]))

    for (const index of regressionIndexes) {
      const point = data[index]
      const hours = (point.timestamp - modelBaseTime) / (1000 * 60 * 60)

      point.regressao = clampRegressionChartValue(getRegressionValue(modelo, hours))
    }
  }

  return data
}

function getRegressionNotice({ loading, errors, historico, modelo, predicaoAlertas }) {
  if (loading) {
    return {
      tone: "muted",
      title: "Atualizando regressao",
      description: "Buscando histórico de integridade e dados do modelo.",
    }
  }

  if (errors?.historico && historico.length === 0) {
    return {
      tone: "warning",
      title: "Histórico indisponível",
      description: errors.historico,
    }
  }

  if (historico.length === 0) {
    return {
      tone: "muted",
      title: "Sem histórico de integridade",
      description: "A API ainda não retornou pontos suficientes para desenhar a curva da máquina.",
    }
  }

  const absenceReason =
    predicaoAlertas?.motivo ||
    predicaoAlertas?.ausenciaProximoAlerta?.motivo ||
    predicaoAlertas?.ausenciaInstabilidade?.motivo

  if (!modelo) {
    return {
      tone: "warning",
      title: "Modelo indisponivel",
      description: formatPredictionReason(absenceReason) || "O backend ainda não retornou uma regressão para esta máquina.",
    }
  }

  if (modelo.slope >= 0) {
    return {
      tone: "warning",
      title: "Tendencia sem queda",
      description: "A reta calculada não aponta degradação suficiente para projetar falha.",
    }
  }

  if (modelo.r2 !== null && modelo.r2 < 0.6) {
    return {
      tone: "warning",
      title: "Ajuste ainda fraco",
      description: "O histórico existe, mas o ajuste do modelo ainda não atingiu confiança mínima.",
    }
  }

  return {
    tone: "stable",
    title: "Modelo calculado",
    description: "A linha tracejada mostra a tendencia linear usada pelo algoritmo preditivo.",
  }
}

function RegressionChartMessage({ message, tone = "muted" }) {
  return (
    <div
      className={cn(
        "flex h-[280px] items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm",
        tone === "warning"
          ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-300"
          : "border-border/70 bg-muted/20 text-muted-foreground"
      )}
    >
      {message}
    </div>
  )
}

function PredictionRegressionChart({ data, loading, errors, hasRegression, period, dataInicioManutencao, dataFalha }) {
  const showPointDots = data.length <= 160
  const maintenanceStartDate = parseDateValue(dataInicioManutencao)
  const failureDate = parseDateValue(dataFalha)
  const nowTimestamp = React.useMemo(() => Date.now(), [data])

  if (loading && data.length === 0) {
    return <RegressionChartMessage message="Carregando histórico da máquina..." />
  }

  if (data.length === 0) {
    return (
      <RegressionChartMessage
        message={errors?.historico || "Não há pontos de integridade suficientes para montar o gráfico."}
        tone={errors?.historico ? "warning" : "muted"}
      />
    )
  }

  return (
    <ChartContainer config={REGRESSION_CHART_CONFIG} className="aspect-auto h-[280px] w-full">
      <LineChart data={data} margin={{ left: 0, right: 12, top: 12, bottom: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={[
            (dataMin) => Math.min(Number(dataMin), nowTimestamp),
            (dataMax) => Math.max(Number(dataMax), nowTimestamp),
          ]}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
          tickFormatter={(value) => formatRegressionChartTickDate(value, period)}
        />
        <YAxis
          width={36}
          domain={[0, 100]}
          allowDataOverflow
          ticks={[0, 30, 70, 100]}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <ReferenceLine
          y={PREDICAO_LIMIAR_MANUTENCAO}
          stroke="#f59e0b"
          strokeDasharray="4 4"
          label={{ value: "70%", position: "insideTopRight", fill: "#d97706", fontSize: 11 }}
        />
        <ReferenceLine
          y={PREDICAO_LIMIAR_FALHA}
          stroke="#ef4444"
          strokeDasharray="4 4"
          label={{ value: "30%", position: "insideBottomRight", fill: "#dc2626", fontSize: 11 }}
        />
        <ReferenceLine
          x={nowTimestamp}
          stroke="#94a3b8"
          strokeDasharray="3 3"
        />
        {maintenanceStartDate ? (
          <ReferenceLine
            x={maintenanceStartDate.getTime()}
            stroke="#f59e0b"
            strokeDasharray="3 3"
          />
        ) : null}
        {failureDate ? (
          <ReferenceLine
            x={failureDate.getTime()}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label={{ value: "Falha 30%", position: "insideBottom", fill: "#dc2626", fontSize: 11 }}
          />
        ) : null}
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value, payload) => formatChartDate(payload?.[0]?.payload?.timestamp ?? value)}
              indicator="dot"
            />
          }
        />
        <Line
          dataKey="integridade"
          type="monotone"
          stroke="var(--color-integridade)"
          strokeWidth={2}
          dot={showPointDots ? { r: 3 } : false}
          activeDot={{ r: 5 }}
          connectNulls={false}
        />
        {hasRegression ? (
          <Line
            dataKey="regressao"
            type="linear"
            stroke="var(--color-regressao)"
            strokeWidth={2}
            strokeDasharray="6 5"
            dot={false}
            connectNulls
          />
        ) : null}
      </LineChart>
    </ChartContainer>
  )
}

function PredictionRegressionSheet({
  open,
  onOpenChange,
  maquina,
  predicaoAlertas,
  historico,
  loading,
  errors,
  regressionPeriod,
  onRegressionPeriodChange,
}) {
  const [technicalDetailsOpen, setTechnicalDetailsOpen] = React.useState(false)
  const modelo = React.useMemo(() => getPredictionModel(predicaoAlertas), [predicaoAlertas])
  const maintenancePrediction = React.useMemo(
    () => getRegressionMaintenanceMetric(modelo, historico),
    [historico, modelo]
  )
  const chartData = React.useMemo(
    () => buildRegressionChartData(
      historico,
      modelo,
      {
        dataInicioManutencao: maintenancePrediction.date,
        dataFalha: maquina?.dataFalha,
      },
      regressionPeriod
    ),
    [historico, maintenancePrediction.date, maquina?.dataFalha, modelo, regressionPeriod]
  )
  const chartPointCount = React.useMemo(
    () => chartData.filter((point) => !point.projected).length,
    [chartData]
  )
  const chartCoverageHours = React.useMemo(
    () => getRegressionChartCoverageHours(chartData),
    [chartData]
  )
  const latestIntegrity = React.useMemo(
    () => getLatestFiniteChartValue(chartData, "integridade", { realOnly: true }),
    [chartData]
  )
  const latestRegression = React.useMemo(
    () => getLatestFiniteChartValue(chartData, "regressao"),
    [chartData]
  )
  const notice = getRegressionNotice({
    loading,
    errors,
    historico,
    modelo,
    predicaoAlertas,
  })
  const failurePrediction = getFailurePredictionMetric(maquina)
  const maintenanceWindow = getMaintenanceWindowMetric(maquina)
  const noticeClasses = {
    stable: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-300",
    warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-300",
    muted: "border-border bg-muted/30 text-muted-foreground",
  }

  React.useEffect(() => {
    setTechnicalDetailsOpen(false)
  }, [maquina?.id])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" mobileSide="bottom" className="w-full max-w-none! gap-0 overflow-hidden sm:w-[680px]! sm:max-w-none!">
        <SheetHeader className="shrink-0 pr-12">
          <SheetTitle>Regressao de integridade</SheetTitle>
          <SheetDescription>{maquina?.nome ? `${maquina.nome} - histórico e tendência linear` : "Histórico e tendência linear"}</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          <div className={cn("rounded-lg border px-3 py-2 text-xs leading-relaxed", noticeClasses[notice.tone])}>
            <p className="font-semibold">{notice.title}</p>
            <p className="mt-1">{notice.description}</p>
          </div>

          <div className="mt-4 rounded-lg border border-border/70 bg-background/70 p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-medium uppercase text-muted-foreground">Periodo do grafico</span>
              <ToggleGroup
                type="single"
                value={regressionPeriod}
                onValueChange={(value) => {
                  if (value) {
                    onRegressionPeriodChange?.(value)
                  }
                }}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                {REGRESSION_PERIOD_OPTIONS.map((option) => (
                  <ToggleGroupItem key={option.value} value={option.value} className="px-3">
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <PredictionRegressionChart
              data={chartData}
              loading={loading}
              errors={errors}
              hasRegression={Boolean(modelo)}
              period={regressionPeriod}
              dataInicioManutencao={maintenancePrediction.date}
              dataFalha={maquina?.dataFalha}
            />
            {chartData.length > 0 ? (
              <RegressionChartLegend
                latestIntegrity={latestIntegrity}
                latestRegression={latestRegression}
                maintenancePrediction={maintenancePrediction}
                failurePrediction={failurePrediction}
              />
            ) : null}
          </div>

          <div className="mt-4">
            <PredictionPrimaryMetric
              label="Manutenção prevista"
              value={maintenancePrediction.value}
              sub={maintenancePrediction.sub}
            />
          </div>

          <div className="mt-4">
            <DetailsAccordionSection
              title="Detalhes técnicos"
              icon={GaugeIcon}
              open={technicalDetailsOpen}
              onToggle={() => setTechnicalDetailsOpen((open) => !open)}
              meta={
                <Badge variant="outline" className={accordionHeaderBadgeClass}>
                  Opcional
                </Badge>
              }
            >
              <div className="grid grid-cols-1 gap-2 border-t border-border/60 p-3 pt-3 sm:grid-cols-2">
                <PredictionMetric
                  label="Confianca do ajuste"
                  value={modelo ? formatR2Score(modelo.r2) : "N/A"}
                  sub="R2: quanto a linha explica os dados."
                />
                <PredictionMetric
                  label="Angulo da tendencia"
                  value={modelo ? formatSlopeAngle(modelo.slope) : "N/A"}
                  sub={modelo ? getSlopeAngleDescription(modelo.slope) : "Sem tendencia calculada."}
                />
                <PredictionMetric
                  label="Dados exibidos"
                  value={formatRegressionPointCount(chartPointCount)}
                  sub={`Periodo selecionado: ${getRegressionPeriodOption(regressionPeriod).label}.`}
                />
                <PredictionMetric
                  label="Cobertura temporal"
                  value={formatCoveredHours(chartCoverageHours)}
                  sub="Janela dos pontos exibidos."
                />
                <PredictionMetric
                  label="Ultimo ponto"
                  value={modelo?.ultimoPontoEm ? formatPredictionDate(modelo.ultimoPontoEm) : "N/A"}
                  sub="Base mais recente do modelo."
                />
                <PredictionMetric
                  label="Falha prevista"
                  value={failurePrediction.value}
                  sub={failurePrediction.sub}
                />
                <div className="sm:col-span-2">
                  <PredictionMetric
                    label="Janela ideal"
                    value={maintenanceWindow.value}
                    sub={maintenanceWindow.sub}
                  />
                </div>
              </div>
            </DetailsAccordionSection>
          </div>

          {errors?.alertas || errors?.risco ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-300">
              {errors.alertas || errors.risco}
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function CriticidadeBadge({ value }) {
  const styles = {
    ALTA: "bg-white text-gray-700 border-gray-200 dark:border-border dark:bg-muted/30 dark:text-muted-foreground",
    MEDIA: "bg-white text-gray-700 border-gray-200 dark:border-border dark:bg-muted/30 dark:text-muted-foreground",
    BAIXA: "bg-white text-gray-700 border-gray-200 dark:border-border dark:bg-muted/30 dark:text-muted-foreground",
  }
  return <Badge variant="outline" className={`px-1.5 ${styles[value]}`}>{value.charAt(0) + value.slice(1).toLowerCase()}</Badge>
}

function StatusBadge({ value }) {
  if (value === "SEM_SENSOR") {
    return (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        <CircleMinusIcon className="text-muted-foreground" />
        Sem sensor
      </Badge>
    )
  }

  if (value === "EM_ANDAMENTO") {
    return (
      <Badge variant="outline" className="px-1.5 border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300">
        <AlertTriangleIcon className="text-orange-500 dark:text-orange-300" />
        Em andamento
      </Badge>
    )
  }

  if (value === "COM_ALERTA") {
    return (
      <Badge variant="outline" className="px-1.5 border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
        <AlertTriangleIcon className="text-red-500 dark:text-red-300" />
        Com alerta
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      {value === "OK" ? <CircleCheckIcon className="fill-[#5E17EB]!" /> : <AlertTriangleIcon className="text-red-500" />}
      {value}
    </Badge>
  )
}

function SensorStatusBadge({ value }) {
  const isOnline = value === "ONLINE"

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2 text-xs",
        isOnline
          ? "border-[#5E17EB] bg-[#5E17EB] text-white dark:border-[#5E17EB] dark:bg-[#5E17EB] dark:text-white"
          : "border-gray-200 bg-white text-gray-700 dark:border-border dark:bg-muted/30 dark:text-muted-foreground"
      )}
    >
      {value}
    </Badge>
  )
}

function MetricSnapshot({ icon: Icon, label, current, ideal, limit, suffix, digits = 1 }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-[#5E17EB]" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Leitura</span>
          <span className="text-sm font-semibold">{formatMetric(current, suffix, digits)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Ideal</span>
          <span className="text-sm">{formatMetric(ideal, suffix, digits)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Limite</span>
          <span className="text-sm">{formatMetric(limit, suffix, digits)}</span>
        </div>
      </div>
    </div>
  )
}

function DetailsAccordionSection({ title, icon: Icon, meta, open, onToggle, children }) {
  const contentId = React.useId()

  return (
    <section
      className={cn(
        "group overflow-hidden rounded-lg border border-border/70 bg-card/35 transition-colors hover:border-[#5E17EB]/45",
        open && "border-[#5E17EB]/45"
      )}
      data-state={open ? "open" : "closed"}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={onToggle}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="size-4 shrink-0 text-foreground transition-colors group-hover:text-[#5E17EB] group-data-[state=open]:text-[#5E17EB]" />
          <span className="truncate text-sm font-semibold">{title}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {meta}
          <ChevronDownIcon className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </span>
      </button>
      <div
        id={contentId}
        hidden={!open}
      >
        {children}
      </div>
    </section>
  )
}

const accordionHeaderBadgeClass =
  "border-border/70 bg-background/80 px-2 text-xs text-muted-foreground transition-colors group-hover:border-[#5E17EB]/35 group-hover:text-[#A780FF] group-data-[state=open]:border-[#5E17EB]/35 group-data-[state=open]:text-[#A780FF]"

function MachineDetailItem({ label, value, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border bg-background px-3 py-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="min-w-0 text-sm font-medium text-foreground">
        {children ?? value ?? "-"}
      </div>
    </div>
  )
}

function MachineDetailSection({ title, icon: Icon, children, className = "" }) {
  return (
    <section className={cn("grid gap-3", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold text-[#3B2867] dark:text-white">
        <Icon className="size-4" />
        {title}
      </div>
      <div className="grid gap-3">
        {children}
      </div>
    </section>
  )
}

function IntegridadeBar({ value, inactive = false }) {
  const normalizedValue = Math.round(Number(value))

  if (inactive || !Number.isFinite(normalizedValue)) {
    return (
      <div className="flex flex-row-reverse items-center gap-2 min-w-[110px]">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-full rounded-full bg-muted-foreground/20" />
        </div>
        <span className="text-sm font-medium w-9 text-right tabular-nums text-muted-foreground">--</span>
      </div>
    )
  }

  const cor = normalizedValue < 50 ? "bg-red-500" : normalizedValue < 75 ? "bg-yellow-400" : "bg-green-500"
  const textCor = normalizedValue < 50 ? "text-red-500" : normalizedValue < 75 ? "text-yellow-500" : "text-green-600"

  return (
    <div className="flex flex-row-reverse items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${normalizedValue}%` }} />
      </div>
      <span className={`text-sm font-medium w-9 text-right tabular-nums ${textCor}`}>{normalizedValue}%</span>
    </div>
  )
}

export function MaquinaImagePreview({ maquina, className = "" }) {
  const [fullImageOpen, setFullImageOpen] = React.useState(false)
  const [imageTooltipOpen, setImageTooltipOpen] = React.useState(false)
  const imageSrc = maquina?.imagem
  const imageAlt = maquina?.nome ? `Foto da máquina ${maquina.nome}` : "Foto da máquina"

  return (
    <>
      {imageSrc ? (
        <div
          className={cn(
            "group relative aspect-video w-full overflow-hidden rounded-lg border bg-muted",
            className
          )}
        >
          <img src={imageSrc} alt={imageAlt} className="size-full object-contain transition-transform duration-200 group-hover:scale-[1.015]" />
          <Tooltip open={imageTooltipOpen}>
            <TooltipTrigger asChild>
              <button
                type="button"
                data-sheet-drag-ignore
                className="absolute left-2 top-2 flex size-8 items-center justify-center rounded-md bg-background/55 text-foreground/60 opacity-55 shadow-none backdrop-blur transition hover:bg-background/85 hover:text-foreground hover:opacity-90 focus-visible:bg-background/85 focus-visible:text-foreground focus-visible:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onPointerEnter={() => setImageTooltipOpen(true)}
                onPointerLeave={() => setImageTooltipOpen(false)}
                onFocus={() => setImageTooltipOpen(false)}
                onClick={() => {
                  setImageTooltipOpen(false)
                  setFullImageOpen(true)
                }}
              >
                <Maximize2Icon className="size-4" />
                <span className="sr-only">Ver foto inteira</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Ver foto inteira</TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <div className={cn("relative aspect-video w-full overflow-hidden rounded-lg border bg-muted", className)}>
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-8" />
          </div>
        </div>
      )}

      <Dialog open={fullImageOpen} onOpenChange={setFullImageOpen}>
        <DialogContent className="w-[min(960px,calc(100vw-2rem))]! max-w-none! overflow-hidden p-0">
          <DialogTitle className="sr-only">{imageAlt}</DialogTitle>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageAlt}
              className="block max-h-[calc(100vh-4rem)] w-full bg-muted object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

export function MaquinaUploadImagePreview({ src, alt = "Imagem da máquina", className = "" }) {
  return (
    <div className={cn("aspect-video w-full overflow-hidden rounded-lg border bg-muted", className)}>
      {src ? (
        <img src={src} alt={alt} className="size-full object-contain" />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <ImageIcon className="size-8" />
        </div>
      )}
    </div>
  )
}

function MaquinaSummaryCard({ maquina, statusExibicao, integridadeExibicao, totalSensores, pinned = false }) {
  const roundedIntegridade = Math.round(Number(integridadeExibicao))
  const integridadeLabel = Number.isFinite(roundedIntegridade)
    ? `${roundedIntegridade}%`
    : "--"
  const integridadeBadgeClass = !Number.isFinite(roundedIntegridade)
    ? "text-muted-foreground"
    : roundedIntegridade < 50
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
      : roundedIntegridade < 75
        ? "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300"
        : "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300"

  return (
    <div
      data-machine-summary-card
      className={cn(
        "overflow-hidden border bg-linear-to-br from-primary/10 via-card to-card shadow-sm transition-[border-radius,margin,padding,box-shadow] duration-300 dark:border-gray-700! dark:bg-[#0F172A]",
        pinned
          ? "rounded-xl p-2 md:p-4"
          : "rounded-none border-x-0 border-t-1 p-0"
      )}
    >
      <div
        className={cn(
          "grid transition-[grid-template-columns] duration-300",
          pinned
            ? "grid-cols-[6rem_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
            : "h-[7.25rem] grid-cols-[7.25rem_minmax(0,1fr)] items-stretch gap-0 sm:h-32 sm:grid-cols-[8rem_minmax(0,1fr)_auto]"
        )}
      >
        <MaquinaImagePreview
          maquina={maquina}
          className={cn(
            "!aspect-square shrink-0 !border-2 !border-border/80 shadow-sm transition-[width,height,border-radius] duration-300",
            pinned
              ? "!size-24 !rounded-xl sm:!size-28"
              : "!size-[7.25rem] !rounded-none !border-y-0 !border-l-0 sm:!size-32"
          )}
        />
        <div className={cn("min-w-0", pinned ? "" : "overflow-hidden px-4 py-3 md:px-5 md:py-4")}>
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className={cn("text-xl font-semibold leading-tight text-foreground", pinned ? "line-clamp-2" : "line-clamp-1")}>{maquina.nome}</h2>
            <p className={cn("text-sm text-muted-foreground", pinned ? "line-clamp-2" : "line-clamp-1")}>{maquina.setor} - {maquina.tipo}</p>
          </div>
          <div className={cn("flex flex-wrap gap-2", pinned ? "mt-4" : "mt-3")}>
            <CriticidadeBadge value={maquina.criticidade} />
            <Badge variant="outline" className="hidden md:flex px-3 text-muted-foreground">
              {totalSensores} {totalSensores === 1 ? "sensor" : "sensores"}
            </Badge>
            <Badge variant="outline" className={cn("px-3", integridadeBadgeClass)}>
              {integridadeLabel}
            </Badge>
            <StatusBadge value={statusExibicao} />
          </div>
        </div>
    
      </div>
    </div>
  )
}

function MaintenanceTypeBadge({ tipo }) {
  const isPreventiva = tipo === "PREVENTIVA"

  return (
    <Badge
      variant="outline"
      className={
        isPreventiva
          ? "border-[#5E17EB]/25 bg-[#5E17EB]/10 px-1.5 text-[#5E17EB] dark:border-[#5E17EB]/50 dark:bg-[#5E17EB]/15 dark:text-purple-200"
          : "border-orange-200 bg-orange-50 px-1.5 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300"
      }
    >
      {isPreventiva ? "Preventiva" : "Corretiva"}
    </Badge>
  )
}

function MaintenanceStatusBadge({ status }) {
  if (status === "AGENDADA") {
    return (
      <Badge variant="outline" className="border-blue-200 bg-blue-50 px-1.5 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
        Agendada
      </Badge>
    )
  }

  if (status === "RESOLVIDO") {
    return (
      <Badge variant="outline" className="border-green-200 bg-green-50 px-1.5 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300">
        Resolvida
      </Badge>
    )
  }

  if (status === "CANCELADA" || status === "CANCELADO") {
    return <Badge variant="outline" className="px-1.5 text-muted-foreground">Cancelada</Badge>
  }

  if (status === "ENCERRADO_SEM_SOLUCAO") {
    return <Badge variant="outline" className="px-1.5 text-muted-foreground">Encerrada</Badge>
  }

  return (
    <Badge variant="outline" className="border-yellow-200 bg-yellow-50 px-1.5 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300">
      Em andamento
    </Badge>
  )
}

function MaintenancePriorityBadge({ prioridade }) {
  if (!prioridade) {
    return null
  }

  const critical = prioridade === "URGENTE" || prioridade === "ALTA"

  return (
    <Badge
      variant="outline"
      className={
        critical
          ? "border-red-200 bg-red-50 px-1.5 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
          : "border-border/70 bg-background/80 px-1.5 text-muted-foreground"
      }
    >
      {MAINTENANCE_PRIORITY_LABEL[prioridade] ?? prioridade}
    </Badge>
  )
}

function MaintenanceOriginBadge({ origem }) {
  const predictive = origem === "PREDICAO"

  return (
    <Badge
      variant="outline"
      className={
        predictive
          ? "border-[#5E17EB]/25 bg-[#5E17EB]/10 px-1.5 text-[#5E17EB] dark:border-[#5E17EB]/50 dark:bg-[#5E17EB]/15 dark:text-purple-200"
          : "border-border/70 bg-background/80 px-1.5 text-muted-foreground"
      }
    >
      {MAINTENANCE_ORIGIN_LABEL[origem] ?? origem ?? "Manual"}
    </Badge>
  )
}

function PreventiveMaintenanceCard({ manutencao, canManage, pending, onStart, onComplete }) {
  const tecnicoNome = manutencao.usuario?.nome || "Sem tecnico responsavel"
  const canStart = canManage && manutencao.status === "AGENDADA"
  const canComplete = canManage && manutencao.status === "EM_ANDAMENTO"
  const scheduledLabel = manutencao.dataAgendada ? formatMaintenanceDate(manutencao.dataAgendada) : ""
  const windowLabel = formatMaintenanceWindow(manutencao.janelaAgendadaInicio, manutencao.janelaAgendadaFim)
  const predictionMaintenance = manutencao.metadataPredicao?.previsaoManutencao
    ? formatMaintenanceDate(manutencao.metadataPredicao.previsaoManutencao)
    : ""
  const complianceLabel = MAINTENANCE_COMPLIANCE_LABEL[manutencao.cumprimentoAgendamento] ?? manutencao.cumprimentoAgendamento
  const deviationLabel = formatScheduleDeviation(manutencao.diasDesvioAgendamento)

  return (
    <div className="rounded-lg border border-border/70 bg-background/80 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <MaintenanceTypeBadge tipo={manutencao.tipo} />
            <MaintenanceStatusBadge status={manutencao.status} />
            <MaintenanceOriginBadge origem={manutencao.origem} />
            <MaintenancePriorityBadge prioridade={manutencao.prioridade} />
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">{manutencao.titulo || "Manutencao preventiva"}</p>
          <p className="text-xs text-muted-foreground">{tecnicoNome}</p>
          <p className="text-xs text-muted-foreground">
            {scheduledLabel ? `Agendada para ${scheduledLabel}` : `Criada em ${formatMaintenanceDate(manutencao.criadoEm)}`}
          </p>
        </div>
        {canStart ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="cursor-pointer"
            onClick={() => onStart?.(manutencao)}
            disabled={pending}
          >
            {pending ? <Loader2Icon className="mr-1 size-4 animate-spin" /> : <WrenchIcon className="mr-1 size-4" />}
            Iniciar
          </Button>
        ) : canComplete ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="cursor-pointer"
            onClick={() => onComplete?.(manutencao)}
            disabled={pending}
          >
            {pending ? <Loader2Icon className="mr-1 size-4 animate-spin" /> : <CircleCheckIcon className="mr-1 size-4" />}
            Concluir
          </Button>
        ) : null}
      </div>
      {windowLabel || predictionMaintenance ? (
        <div className="mt-3 grid gap-2 rounded-md border border-border/70 bg-muted/20 p-2 text-xs text-muted-foreground">
          {windowLabel ? <span>Janela sugerida: {windowLabel}</span> : null}
          {predictionMaintenance ? <span>Manutenção prevista: {predictionMaintenance}</span> : null}
        </div>
      ) : null}
      {manutencao.observacao ? (
        <p className="mt-3 text-sm leading-relaxed text-foreground">{manutencao.observacao}</p>
      ) : null}
      {manutencao.status === "RESOLVIDO" ? (
        <div className="mt-3 grid gap-1 rounded-md border border-green-200 bg-green-50 p-2 text-xs text-green-700 dark:border-green-900/60 dark:bg-green-950/25 dark:text-green-300">
          <span>Concluida em {formatMaintenanceDate(manutencao.concluidaEm)}</span>
          <span>{complianceLabel}{deviationLabel ? ` - ${deviationLabel}` : ""}</span>
        </div>
      ) : null}
    </div>
  )
}

function PreventiveMaintenanceSection({
  manutencoes,
  status,
  mensagem,
  canManage,
  saving,
  actionId,
  onCreate,
  onStart,
  onComplete,
  open,
  onToggle,
}) {
  const [titulo, setTitulo] = React.useState("")
  const [prioridade, setPrioridade] = React.useState("")
  const [dataAgendada, setDataAgendada] = React.useState("")
  const [observacao, setObservacao] = React.useState("")
  const observacaoTexto = observacao.trim()
  const preventivas = React.useMemo(
    () => manutencoes
      .filter((item) => item.tipo === "PREVENTIVA")
      .sort((a, b) => (Date.parse(a.dataAgendada || a.criadoEm) || 0) - (Date.parse(b.dataAgendada || b.criadoEm) || 0)),
    [manutencoes]
  )
  const agendadas = preventivas.filter((item) => item.status === "AGENDADA").length
  const emAndamento = preventivas.filter((item) => item.status === "EM_ANDAMENTO").length

  async function handleSubmit(event) {
    event.preventDefault()

    if (!onCreate || observacaoTexto.length < 3) {
      return
    }

    const created = await onCreate({
      titulo,
      prioridade,
      dataAgendada: dataAgendada ? new Date(dataAgendada).toISOString() : "",
      observacao: observacaoTexto,
    })

    if (created !== false) {
      setTitulo("")
      setPrioridade("")
      setDataAgendada("")
      setObservacao("")
    }
  }

  return (
    <DetailsAccordionSection
      title="Manutenções preventivas"
      icon={WrenchIcon}
      open={open}
      onToggle={onToggle}
      meta={
        <Badge variant="outline" className={accordionHeaderBadgeClass}>
          {agendadas > 0 ? `${agendadas} agendada(s)` : emAndamento > 0 ? `${emAndamento} em andamento` : `${preventivas.length} registro(s)`}
        </Badge>
      }
    >
      <div className="grid gap-3 border-t border-border/60 p-3">
        {canManage ? (
          <form onSubmit={handleSubmit} className="rounded-lg border border-border/70 bg-background/80 p-3">
            <Label htmlFor="preventiva-titulo" className="text-xs text-muted-foreground">Nova preventiva</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input
                id="preventiva-titulo"
                value={titulo}
                maxLength={80}
                onChange={(event) => setTitulo(event.target.value)}
                disabled={saving}
                placeholder="Titulo opcional"
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
              />
              <select
                value={prioridade}
                onChange={(event) => setPrioridade(event.target.value)}
                disabled={saving}
                aria-label="Prioridade da preventiva"
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value="">Prioridade padrao</option>
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
              <input
                type="datetime-local"
                value={dataAgendada}
                onChange={(event) => setDataAgendada(event.target.value)}
                disabled={saving}
                aria-label="Data agendada"
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30 sm:col-span-2"
              />
            </div>
            <textarea
              id="preventiva-observacao"
              value={observacao}
              rows={4}
              maxLength={500}
              onChange={(event) => setObservacao(event.target.value)}
              disabled={saving}
              placeholder="Descreva a inspeção preventiva, periodicidade ou motivo técnico."
              className="mt-2 min-h-[104px] w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30 dark:disabled:bg-input/80"
            />
            <div className="mt-3 flex justify-end">
              <Button type="submit" size="sm" className="cursor-pointer" disabled={saving || observacaoTexto.length < 3}>
                {saving && actionId === "create" ? <Loader2Icon className="mr-1 size-4 animate-spin" /> : <CalendarCheckIcon className="mr-1 size-4" />}
                {dataAgendada ? "Agendar preventiva" : "Iniciar preventiva"}
              </Button>
            </div>
          </form>
        ) : null}

        {status === "loading" ? (
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/80 px-3 py-3 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Carregando manutenções...
          </div>
        ) : status === "error" ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-300">
            {mensagem || "Não foi possível carregar as manutenções preventivas."}
          </div>
        ) : preventivas.length > 0 ? (
          preventivas.slice(0, 5).map((manutencao) => (
            <PreventiveMaintenanceCard
              key={manutencao.id}
              manutencao={manutencao}
              canManage={canManage}
              pending={saving && actionId === manutencao.id}
              onStart={onStart}
              onComplete={onComplete}
            />
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-border/70 bg-background/80 p-3 text-xs text-muted-foreground">
            Nenhuma manutenção preventiva registrada para esta máquina.
          </p>
        )}
      </div>
    </DetailsAccordionSection>
  )
}

export function MaquinaDetailsPanel({
  maquina,
  sensores = [],
  sensorError = "",
  manutencoes = [],
  manutencoesStatus = "success",
  manutencoesMensagem = "",
  canManagePreventiveMaintenances = false,
  preventiveActionId = null,
  preventiveSaving = false,
  onCreatePreventiveMaintenance,
  onStartPreventiveMaintenance,
  onCompletePreventiveMaintenance,
  className = "",
}) {
  const [summaryPinned, setSummaryPinned] = React.useState(false)
  const [maquinaAtualizada, setMaquinaAtualizada] = React.useState(null)
  const summarySentinelRef = React.useRef(null)
  const realtimeHistoricoRef = React.useRef([])
  const maquinaExibida = maquinaAtualizada ?? maquina
  const sensoresDaMaquina = React.useMemo(
    () => getMachineSensors(maquinaExibida, sensores),
    [maquinaExibida, sensores]
  )
  const totalSensores = sensoresDaMaquina.length > 0 ? sensoresDaMaquina.length : maquinaExibida.sensores
  const maquinaComTotalSensores = React.useMemo(
    () => ({ ...maquinaExibida, sensores: totalSensores }),
    [maquinaExibida, totalSensores]
  )
  const statusExibicao = getMaquinaStatusExibicao(maquinaComTotalSensores)
  const integridadeExibicao = getMaquinaIntegridadeExibicao(maquinaComTotalSensores)
  const predictionSummary = React.useMemo(
    () => getPredictionSummary({ maquina: maquinaExibida, statusExibicao, integridadeExibicao }),
    [maquinaExibida, statusExibicao, integridadeExibicao]
  )
  const manutencaoPreditiva = React.useMemo(
    () => getPredictiveMaintenanceFromSources(maquinaExibida, manutencoes),
    [maquinaExibida, manutencoes]
  )
  const [openSections, setOpenSections] = React.useState({
    preventivas: false,
    predicao: false,
    detalhesTecnicos: false,
    sensores: false,
  })
  const [regressionSheetOpen, setRegressionSheetOpen] = React.useState(false)
  const [regressionPeriod, setRegressionPeriod] = React.useState(DEFAULT_REGRESSION_PERIOD)
  const [predictionInsights, setPredictionInsights] = React.useState({
    status: "idle",
    alertas: null,
    risco: null,
    historico: [],
    errors: {
      alertas: "",
      risco: "",
      historico: "",
    },
  })

  React.useEffect(() => {
    setMaquinaAtualizada(null)
    realtimeHistoricoRef.current = []
    setOpenSections({
      preventivas: false,
      predicao: false,
      detalhesTecnicos: false,
      sensores: false,
    })
    setRegressionSheetOpen(false)
    setRegressionPeriod(DEFAULT_REGRESSION_PERIOD)
    setSummaryPinned(false)
  }, [maquina?.id])

  React.useEffect(() => {
    const sentinel = summarySentinelRef.current

    if (!sentinel) {
      return undefined
    }

    let scrollContainer = sentinel.parentElement

    while (scrollContainer && scrollContainer !== document.body) {
      const styles = window.getComputedStyle(scrollContainer)

      if (/(auto|scroll)/.test(styles.overflowY)) {
        break
      }

      scrollContainer = scrollContainer.parentElement
    }

    if (!scrollContainer || scrollContainer === document.body) {
      scrollContainer = window
    }

    function updatePinnedState() {
      const scrollTop = scrollContainer === window
        ? window.scrollY
        : scrollContainer.scrollTop

      setSummaryPinned(scrollTop > 8)
    }

    updatePinnedState()
    scrollContainer.addEventListener("scroll", updatePinnedState, { passive: true })
    window.addEventListener("resize", updatePinnedState)

    return () => {
      scrollContainer.removeEventListener("scroll", updatePinnedState)
      window.removeEventListener("resize", updatePinnedState)
    }
  }, [maquina?.id])

  React.useEffect(() => {
    const maquinaId = maquina?.id

    if (!maquinaId) {
      setPredictionInsights({
        status: "idle",
        alertas: null,
        risco: null,
        historico: [],
        errors: {
          alertas: "",
          risco: "",
          historico: "",
        },
      })
      return
    }

    const session = getAuthSession()

    if (!session?.accessToken) {
      setPredictionInsights({
        status: "error",
        alertas: null,
        risco: null,
        historico: [],
        errors: {
          alertas: "Faça login para carregar as predições da máquina.",
          risco: "",
          historico: "",
        },
      })
      return
    }

    const controller = new AbortController()
    let ignore = false

    setPredictionInsights({
      status: "loading",
      alertas: null,
      risco: null,
      historico: [],
      errors: {
        alertas: "",
        risco: "",
        historico: "",
      },
    })

    fetchMachinePredictions(maquinaId, session.accessToken, controller.signal, regressionPeriod)
      .then(({ alertas, risco, historico, errors, unauthorized }) => {
        if (ignore) {
          return
        }

        const historicoAtualizado = mergeHistoricoIntegridade(historico, realtimeHistoricoRef.current)

        setPredictionInsights({
          status: alertas || risco || historicoAtualizado.length > 0 ? "success" : "error",
          alertas,
          risco,
          historico: historicoAtualizado,
          errors: unauthorized
            ? {
                alertas: "Sua sessão expirou. Faça login novamente.",
                risco: "",
                historico: "",
              }
            : errors,
        })
      })
      .catch((error) => {
        if (ignore || error?.name === "AbortError") {
          return
        }

        setPredictionInsights({
          status: "error",
          alertas: null,
          risco: null,
          historico: [],
          errors: {
            alertas: error instanceof Error ? error.message : "Não foi possível carregar as predições da máquina.",
            risco: "",
            historico: "",
          },
        })
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [maquina?.id, regressionPeriod])

  React.useEffect(() => {
    const maquinaId = maquina?.id

    if (!maquinaId) {
      return undefined
    }

    function applyMachinePayload(payload) {
      const eventMaquinaId = getRealtimeMaquinaId(payload)

      if (eventMaquinaId === null || String(eventMaquinaId) !== String(maquinaId)) {
        return
      }

      if (payload?.maquina && typeof payload.maquina === "object") {
        setMaquinaAtualizada((current) => {
          const fallback = current ?? maquina
          const raw = payload.maquina
          const maquinaPayload = {
            ...raw,
            id: raw.id ?? raw.maquinaId ?? eventMaquinaId ?? fallback.id,
            nome: raw.nome ?? raw.nomeMaquina ?? raw.name ?? fallback.nome,
            setor: raw.setor ?? raw.area ?? raw.linha ?? raw.localizacao ?? fallback.setor,
            tipo: raw.tipo ?? raw.tipoMaquina ?? raw.categoria ?? raw.modelo ?? fallback.tipo,
            criticidade: raw.criticidade ?? raw.nivelCriticidade ?? raw.prioridade ?? fallback.criticidade,
            integridade: raw.integridade ?? raw.saude ?? raw.healthScore ?? raw.integridadeMedia ?? fallback.integridade,
            scoreEstabilidade:
              raw.scoreEstabilidade ?? raw.estabilidade ?? raw.stabilityScore ?? raw.score ?? fallback.scoreEstabilidade,
            status: raw.status ?? raw.estado ?? raw.situacao ?? fallback.status,
            ultimaLeituraEm:
              raw.ultimaLeituraEm ?? raw.ultimaAtualizacao ?? raw.updatedAt ?? raw.dataUltimaLeitura ?? fallback.ultimaLeituraEm,
            sensores: raw.sensores ?? raw.totalSensores ?? raw.quantidadeSensores ?? raw.sensoresOnline ?? fallback.sensores,
            dataInicioManutencao:
              raw.dataInicioManutencao ??
              raw.data_inicio_manutencao ??
              raw.maintenanceStartDate ??
              fallback.dataInicioManutencao,
            previsaoManutencao:
              raw.previsaoManutencao ??
              raw.previsao_manutencao ??
              raw.predictedMaintenanceAt ??
              fallback.previsaoManutencao,
            dataFalha:
              raw.dataFalha ??
              raw.data_falha ??
              raw.previsaoFalha ??
              raw.dataFalhaPrevista ??
              raw.predictedFailureAt ??
              fallback.dataFalha,
            janelaManuInicio:
              raw.janelaManuInicio ?? raw.janelaManutencaoInicio ?? raw.maintenanceWindowStart ?? fallback.janelaManuInicio,
            janelaManuFim:
              raw.janelaManuFim ?? raw.janelaManutencaoFim ?? raw.maintenanceWindowEnd ?? fallback.janelaManuFim,
            imagem: raw.imagem ?? raw.imagemUrl ?? raw.foto ?? raw.fotoUrl ?? fallback.imagem,
            caminhoImagem: raw.caminhoImagem ?? raw.imagePath ?? raw.caminhoFoto ?? fallback.caminhoImagem,
            estadoPredicaoManutencao:
              raw.estadoPredicaoManutencao ??
              raw.estado_predicao_manutencao ??
              raw.predictionMaintenanceState ??
              raw.predictiveMaintenanceState ??
              fallback.estadoPredicaoManutencao,
            manutencaoPreditiva:
              raw.manutencaoPreditiva ??
              raw.preventivaPreditiva ??
              raw.predictiveMaintenance ??
              raw.predictedMaintenance ??
              fallback.manutencaoPreditiva,
          }
          const [maquinaNormalizada] = normalizeMaquinaCollection([maquinaPayload])

          return maquinaNormalizada ? { ...fallback, ...maquinaNormalizada } : current
        })
      }

      const historico = normalizeRealtimeHistoricoIntegridade(payload)

      if (historico.length === 0) {
        return
      }

      realtimeHistoricoRef.current = mergeHistoricoIntegridade(realtimeHistoricoRef.current, historico)

      setPredictionInsights((current) => ({
        ...current,
        status: current.alertas || current.risco || current.historico.length > 0 || historico.length > 0
          ? "success"
          : current.status,
        historico: mergeHistoricoIntegridade(current.historico, historico),
        errors: {
          ...current.errors,
          historico: "",
        },
      }))
    }

    function handleMachineDashboardUpdate(event) {
      applyMachinePayload(event.detail)
    }

    function handleMachineIntegrityHistoryUpdate(event) {
      applyMachinePayload(event.detail)
    }

    window.addEventListener(REALTIME_MACHINE_DASHBOARD_UPDATE_EVENT, handleMachineDashboardUpdate)
    window.addEventListener(REALTIME_MACHINE_INTEGRITY_HISTORY_UPDATE_EVENT, handleMachineIntegrityHistoryUpdate)

    return () => {
      window.removeEventListener(REALTIME_MACHINE_DASHBOARD_UPDATE_EVENT, handleMachineDashboardUpdate)
      window.removeEventListener(REALTIME_MACHINE_INTEGRITY_HISTORY_UPDATE_EVENT, handleMachineIntegrityHistoryUpdate)
    }
  }, [maquina?.id, maquina])

  function toggleSection(section) {
    setOpenSections((currentSections) => ({
      ...currentSections,
      [section]: !currentSections[section],
    }))
  }

  return (
    <div className={cn("flex flex-col text-sm", className)}>
      {sensorError ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {sensorError}
        </div>
      ) : null}

      <div
        ref={summarySentinelRef}
        data-machine-summary-sticky
        className={cn(
          "sticky top-0 z-20 bg-background/95 transition-[margin,padding] duration-300",
          summaryPinned ? "mx-0 mb-0 px-0 pt-2 backdrop-blur" : "-mx-4 mb-5 px-0 pt-0"
        )}
      >
        <MaquinaSummaryCard
          maquina={maquinaExibida}
          statusExibicao={statusExibicao}
          integridadeExibicao={integridadeExibicao}
          totalSensores={totalSensores}
          pinned={summaryPinned}
        />
      </div>

      <MachineDetailSection title="Resumo operacional" icon={GaugeIcon}>
        <div className="grid gap-3 sm:grid-cols-2">
          <MachineDetailItem label="Importância">
            <CriticidadeBadge value={maquinaExibida.criticidade} />
          </MachineDetailItem>
          <MachineDetailItem label="Status">
            <StatusBadge value={statusExibicao} />
          </MachineDetailItem>
          <MachineDetailItem label="Integridade">
            <IntegridadeBar value={integridadeExibicao} inactive={statusExibicao === "SEM_SENSOR"} />
          </MachineDetailItem>
          <MachineDetailItem label="Estabilidade">
            <span className="flex items-center gap-1.5">
              <span>{formatMetric(maquinaExibida.scoreEstabilidade, "%", 0)}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Como a estabilidade da máquina é calculada"
                    className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <CircleHelpIcon className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6} className="max-w-64 text-left leading-relaxed">
                  O score de estabilidade da máquina considera a condição operacional consolidada, incluindo integridade e comportamento das leituras dos sensores. Quanto mais perto de 100%, mais estável ela está.
                </TooltipContent>
              </Tooltip>
            </span>
          </MachineDetailItem>
        </div>
      </MachineDetailSection>

      <div className="mt-5 flex flex-col gap-3">
        <PreventiveMaintenanceSection
          manutencoes={manutencoes}
          status={manutencoesStatus}
          mensagem={manutencoesMensagem}
          canManage={canManagePreventiveMaintenances}
          saving={preventiveSaving}
          actionId={preventiveActionId}
          onCreate={onCreatePreventiveMaintenance}
          onStart={onStartPreventiveMaintenance}
          onComplete={onCompletePreventiveMaintenance}
          open={openSections.preventivas}
          onToggle={() => toggleSection("preventivas")}
        />

        <DetailsAccordionSection
          title="Predições da máquina"
          icon={ActivityIcon}
          open={openSections.predicao}
          onToggle={() => toggleSection("predicao")}
          meta={
            <Badge variant="outline" className={accordionHeaderBadgeClass}>
              {predictionSummary.badge}
            </Badge>
          }
        >
          {predictionInsights.status === "loading" ? (
            <PredictionLoadingState />
          ) : (
            <div className="grid gap-3">
              <PredictionRemoteNotice
                loading={false}
                errors={predictionInsights.errors}
              />
              <PredicaoAgendamentoSeguroCard
                maquina={maquinaExibida}
                manutencaoPreditiva={manutencaoPreditiva}
              />
              <PredicaoResumoCard
                maquina={maquinaExibida}
                summary={predictionSummary}
                predicaoAlertas={predictionInsights.alertas}
                predicaoRisco={predictionInsights.risco}
                onOpenRegression={() => setRegressionSheetOpen(true)}
              />
              <DetailsAccordionSection
                title="Detalhes técnicos"
                icon={CircleHelpIcon}
                open={openSections.detalhesTecnicos}
                onToggle={() => toggleSection("detalhesTecnicos")}
                meta={
                  <Badge variant="outline" className={accordionHeaderBadgeClass}>
                    Predição
                  </Badge>
                }
              >
                <div className="grid gap-3 border-t border-border/60 p-3">
                  <PredicaoAlertasCard predicao={predictionInsights.alertas} />
                  <PredicaoRiscoCard predicao={predictionInsights.risco} />
                </div>
              </DetailsAccordionSection>
            </div>
          )}
        </DetailsAccordionSection>

        <DetailsAccordionSection
          title="Sensores sincronizados"
          icon={ThermometerIcon}
          open={openSections.sensores}
          onToggle={() => toggleSection("sensores")}
          meta={
            <Badge variant="outline" className={accordionHeaderBadgeClass}>
              {sensoresDaMaquina.length} {sensoresDaMaquina.length === 1 ? "sensor" : "sensores"}
            </Badge>
          }
        >
          <div className="grid gap-3">
            {sensoresDaMaquina.length === 0 ? (
              <p className="rounded-lg border border-border/70 bg-background/80 p-3 text-xs text-muted-foreground">
                Nenhum sensor vinculado foi retornado pela API para esta máquina.
              </p>
            ) : (
              sensoresDaMaquina.map((sensor, index) => (
                <div key={sensor.id ?? `${sensor.nome}-${index}`} className="rounded-lg border border-border/70 bg-background/80 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{sensor.nome}</p>
                      <p className="text-xs text-muted-foreground">{tempoRelativo(sensor.ultimaLeituraEm)}</p>
                    </div>
                    <SensorStatusBadge value={sensor.status} />
                  </div>
                  <div className="mt-3 grid gap-3">
                    <MetricSnapshot
                      icon={ThermometerIcon}
                      label="Temperatura"
                      current={sensor.temperatura?.valorAtual}
                      ideal={sensor.idealTemperatura}
                      limit={sensor.limiteTemperatura ?? sensor.temperatura?.limiteMax}
                      suffix=" °C"
                    />
                    <MetricSnapshot
                      icon={ActivityIcon}
                      label="Vibração"
                      current={sensor.vibracao?.valorAtual}
                      ideal={sensor.idealVibracao}
                      limit={sensor.limiteVibracao ?? sensor.vibracao?.limiteMax}
                      suffix=" mm/s"
                      digits={2}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </DetailsAccordionSection>
      </div>

      <PredictionRegressionSheet
        open={regressionSheetOpen}
        onOpenChange={setRegressionSheetOpen}
        maquina={maquinaExibida}
        predicaoAlertas={predictionInsights.alertas}
        historico={predictionInsights.historico}
        loading={predictionInsights.status === "loading"}
        errors={predictionInsights.errors}
        regressionPeriod={regressionPeriod}
        onRegressionPeriodChange={setRegressionPeriod}
      />
    </div>
  )
}
