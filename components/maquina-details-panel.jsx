"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"
import {
  ActivityIcon,
  AlertTriangleIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  CircleHelpIcon,
  CircleMinusIcon,
  GaugeIcon,
  ImageIcon,
  Maximize2Icon,
  ThermometerIcon,
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
import {
  getMaquinaIntegridadeExibicao,
  getMaquinaStatusExibicao,
} from "@/lib/maquinas-table"
import { getAuthSession } from "@/lib/auth-session"
import { extractCollection, getHttpErrorStatus, requestDashboardJson } from "@/lib/dashboard-api"
import { cn, tempoRelativo } from "@/lib/utils"

const PREDICAO_LIMIAR_MANUTENCAO = 70
const PREDICAO_LIMIAR_FALHA = 30
const PREDICAO_ANTECEDENCIA_FIM_JANELA_DIAS = 2

const PREDICAO_MOTIVOS_AUSENCIA = {
  historico_insuficiente: "Histórico insuficiente para sustentar o cálculo.",
  modelo_nao_pode_ser_calculado: "O modelo não pôde ser calculado com a base atual.",
  tendencia_nao_confiavel: "A tendência atual não atingiu confiança mínima.",
  sem_historico_de_alertas_do_tipo: "Não há histórico suficiente desse tipo de alerta.",
  evento_ja_ocorrido: "O evento previsto já ocorreu.",
  previsao_fora_da_janela: "A previsão ficou fora da janela monitorada.",
  sem_alerta_previsivel: "Nenhum alerta previsível foi encontrado.",
  leituras_insuficientes: "Leituras insuficientes nas janelas recentes.",
  sem_leitura_recente: "Não há leitura recente para calcular o risco.",
  historico_de_alertas_insuficiente: "Histórico de alertas insuficiente.",
}

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

function formatCount(value) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return "0"
  }

  return new Intl.NumberFormat("pt-BR").format(parsed)
}

function formatPredictionReason(reason) {
  if (!reason) {
    return ""
  }

  return PREDICAO_MOTIVOS_AUSENCIA[reason] ?? reason.replace(/_/g, " ")
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

async function fetchMachinePredictions(maquinaId, accessToken, signal) {
  const [alertasResult, riscoResult, historicoResult] = await Promise.allSettled([
    requestDashboardJson(`/maquinas/${maquinaId}/predicao-alertas`, accessToken, "a predição de alertas", { signal }),
    requestDashboardJson(`/maquinas/${maquinaId}/predicao-risco`, accessToken, "a predição de risco", { signal }),
    requestDashboardJson(`/maquinas/${maquinaId}/historico-integridade?limite=30`, accessToken, "o historico de integridade", { signal }),
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
  const falhaPrevista = parseDateValue(maquina.previsaoManutencao)
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
  const modelo = predicao?.modeloIntegridade

  if (!modelo || typeof modelo !== "object") {
    return null
  }

  const slope = getNumericValue(modelo.slope)
  const intercept = getNumericValue(modelo.intercept)

  if (slope === null || intercept === null) {
    return null
  }

  return {
    ...modelo,
    r2: getNumericValue(modelo.r2),
    slope,
    intercept,
    pontosUsados: getNumericValue(modelo.pontosUsados),
  }
}

function getNextAlertSummary(predicao) {
  const prediction = predicao?.proximoAlerta

  if (!prediction) {
    return {
      value: "Sem previsao",
      sub: formatPredictionReason(predicao?.ausenciaProximoAlerta?.motivo) || "Ainda sem evento previsivel.",
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

  return (
    <div className="rounded-lg border border-[#5E17EB]/25 bg-[#5E17EB]/5 p-3 dark:border-[#5E17EB]/45 dark:bg-[#5E17EB]/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ActivityIcon className="size-4 shrink-0 text-[#5E17EB]" />
            <Label>Resumo preditivo</Label>
          </div>
          <p className="mt-2 text-sm font-semibold leading-snug">{summary.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{summary.description}</p>
        </div>
        <Badge variant="outline" className="shrink-0 border-[#5E17EB]/35 bg-background/80 px-2 text-xs text-[#7c3aed] dark:text-[#A780FF]">
          {summary.badge}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <PredictionMetric label="Status" value={summary.badge} sub={summary.title} />
        <PredictionMetric
          label="Falha prevista"
          value={formatPredictionDate(maquina.previsaoManutencao)}
          sub={formatDaysUntil(maquina.previsaoManutencao) || "Sem data confiavel"}
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
  const falhaSub = formatDaysUntil(maquina.previsaoManutencao)
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
          value={formatPredictionDate(maquina.previsaoManutencao)}
          sub={falhaSub}
        />
        <PredictionMetric
          label="Janela ideal"
          value={formatPredictionRange(maquina.janelaManuInicio, maquina.janelaManuFim)}
          sub={maquina.janelaManuFim ? `${PREDICAO_ANTECEDENCIA_FIM_JANELA_DIAS} dias antes da falha` : "Sem janela calculada"}
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

function PredictionRemoteNotice({ loading, errors }) {
  const messages = Object.values(errors || {}).filter(Boolean)

  if (loading) {
    return (
      <div className="rounded-lg border border-border/70 bg-background/80 p-3 text-xs text-muted-foreground">
        Atualizando predicoes, risco e historico...
      </div>
    )
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

function PredicaoAlertaItem({ title, prediction, absence }) {
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
          {formatPredictionReason(absence?.motivo) || "O backend não retornou uma previsão para esta janela."}
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

  const modelo = predicao.modeloIntegridade

  return (
    <div className="rounded-lg border border-border/70 bg-background/60 p-3">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangleIcon className="size-4 text-[#5E17EB]" />
        <Label>Alertas preditivos</Label>
      </div>
      <div className="grid gap-3">
        <PredicaoAlertaItem
          title="Próximo alerta"
          prediction={predicao.proximoAlerta}
          absence={predicao.ausenciaProximoAlerta}
        />
        <PredicaoAlertaItem
          title="Instabilidade"
          prediction={predicao.instabilidade}
          absence={predicao.ausenciaInstabilidade}
        />
      </div>
      {modelo ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <PredictionMetric label="R²" value={formatDecimal(modelo.r2, 2)} sub="Ajuste do modelo" />
          <PredictionMetric label="Inclinação" value={formatDecimal(modelo.slope, 2)} sub="Tendência" />
          <PredictionMetric label="Pontos" value={formatCount(modelo.pontosUsados)} sub="Histórico usado" />
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

function buildRegressionChartData(historico, modelo, previsaoManutencao) {
  const points = Array.isArray(historico) ? historico : []

  if (points.length === 0) {
    return []
  }

  const baseTime = Date.parse(points[0].criadoEm)

  if (!Number.isFinite(baseTime)) {
    return []
  }

  const data = points
    .map((point, index) => {
      const timestamp = Date.parse(point.criadoEm)
      const integridade = getNumericValue(point.integridade)

      if (!Number.isFinite(timestamp) || integridade === null) {
        return null
      }

      const hours = (timestamp - baseTime) / (1000 * 60 * 60)

      return {
        id: point.id ?? index,
        timestamp,
        integridade,
        regressao: getRegressionValue(modelo, hours),
        projected: false,
      }
    })
    .filter(Boolean)

  const forecastDate = parseDateValue(previsaoManutencao)
  const lastTimestamp = data[data.length - 1]?.timestamp

  if (modelo && forecastDate && Number.isFinite(lastTimestamp) && forecastDate.getTime() > lastTimestamp) {
    const hours = (forecastDate.getTime() - baseTime) / (1000 * 60 * 60)

    data.push({
      id: "previsao-falha",
      timestamp: forecastDate.getTime(),
      integridade: null,
      regressao: getRegressionValue(modelo, hours),
      projected: true,
    })
  }

  return data
}

function getRegressionNotice({ loading, errors, historico, modelo, predicaoAlertas }) {
  if (loading) {
    return {
      tone: "muted",
      title: "Atualizando regressao",
      description: "Buscando historico de integridade e dados do modelo.",
    }
  }

  if (errors?.historico && historico.length === 0) {
    return {
      tone: "warning",
      title: "Historico indisponivel",
      description: errors.historico,
    }
  }

  if (historico.length === 0) {
    return {
      tone: "muted",
      title: "Sem historico de integridade",
      description: "A API ainda nao retornou pontos suficientes para desenhar a curva da maquina.",
    }
  }

  const absenceReason =
    predicaoAlertas?.ausenciaProximoAlerta?.motivo ||
    predicaoAlertas?.ausenciaInstabilidade?.motivo

  if (!modelo) {
    return {
      tone: "warning",
      title: "Modelo indisponivel",
      description: formatPredictionReason(absenceReason) || "O backend ainda nao retornou uma regressao para esta maquina.",
    }
  }

  if (modelo.slope >= 0) {
    return {
      tone: "warning",
      title: "Tendencia sem queda",
      description: "A reta calculada nao aponta degradacao suficiente para projetar falha.",
    }
  }

  if (modelo.r2 !== null && modelo.r2 < 0.6) {
    return {
      tone: "warning",
      title: "Ajuste ainda fraco",
      description: "O historico existe, mas o ajuste do modelo ainda nao atingiu confianca minima.",
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

function PredictionRegressionChart({ data, loading, errors, hasRegression }) {
  if (loading && data.length === 0) {
    return <RegressionChartMessage message="Carregando historico da maquina..." />
  }

  if (data.length === 0) {
    return (
      <RegressionChartMessage
        message={errors?.historico || "Nao ha pontos de integridade suficientes para montar o grafico."}
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
          domain={["dataMin", "dataMax"]}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
          tickFormatter={formatChartTickDate}
        />
        <YAxis
          width={36}
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <ReferenceLine
          y={PREDICAO_LIMIAR_MANUTENCAO}
          stroke="#f59e0b"
          strokeDasharray="4 4"
          label={{ value: "Manutencao 70%", position: "insideTopRight", fill: "#d97706", fontSize: 11 }}
        />
        <ReferenceLine
          y={PREDICAO_LIMIAR_FALHA}
          stroke="#ef4444"
          strokeDasharray="4 4"
          label={{ value: "Falha 30%", position: "insideBottomRight", fill: "#dc2626", fontSize: 11 }}
        />
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
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          connectNulls={false}
        />
        {hasRegression ? (
          <Line
            dataKey="regressao"
            type="monotone"
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
}) {
  const modelo = React.useMemo(() => getPredictionModel(predicaoAlertas), [predicaoAlertas])
  const chartData = React.useMemo(
    () => buildRegressionChartData(historico, modelo, maquina?.previsaoManutencao),
    [historico, maquina?.previsaoManutencao, modelo]
  )
  const notice = getRegressionNotice({
    loading,
    errors,
    historico,
    modelo,
    predicaoAlertas,
  })
  const noticeClasses = {
    stable: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-300",
    warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-300",
    muted: "border-border bg-muted/30 text-muted-foreground",
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" mobileSide="bottom" className="w-full max-w-none! gap-0 overflow-hidden sm:w-[680px]! sm:max-w-none!">
        <SheetHeader className="shrink-0 pr-12">
          <SheetTitle>Regressao de integridade</SheetTitle>
          <SheetDescription>{maquina?.nome ? `${maquina.nome} - historico e tendencia linear` : "Historico e tendencia linear"}</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          <div className={cn("rounded-lg border px-3 py-2 text-xs leading-relaxed", noticeClasses[notice.tone])}>
            <p className="font-semibold">{notice.title}</p>
            <p className="mt-1">{notice.description}</p>
          </div>

          <div className="mt-4 rounded-lg border border-border/70 bg-background/70 p-3">
            <PredictionRegressionChart
              data={chartData}
              loading={loading}
              errors={errors}
              hasRegression={Boolean(modelo)}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <PredictionMetric label="R2" value={modelo ? formatDecimal(modelo.r2, 2) : "N/A"} sub="Ajuste do modelo" />
            <PredictionMetric label="Inclinacao" value={modelo ? formatDecimal(modelo.slope, 4) : "N/A"} sub="Pontos percentuais por hora" />
            <PredictionMetric label="Pontos usados" value={formatCount(modelo?.pontosUsados ?? historico.length)} sub="Ate 30 pontos recentes" />
            <PredictionMetric
              label="Falha prevista"
              value={formatPredictionDate(maquina?.previsaoManutencao)}
              sub={formatDaysUntil(maquina?.previsaoManutencao) || "Sem data confiavel"}
            />
            <div className="sm:col-span-2">
              <PredictionMetric
                label="Janela ideal"
                value={formatPredictionRange(maquina?.janelaManuInicio, maquina?.janelaManuFim)}
                sub={maquina?.janelaManuFim ? `${PREDICAO_ANTECEDENCIA_FIM_JANELA_DIAS} dias antes da falha` : "Sem janela calculada"}
              />
            </div>
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
        "overflow-hidden rounded-lg border border-border/70 bg-card/35 transition-colors",
        open && "border-[#5E17EB]/45 bg-[#5E17EB]/5"
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={onToggle}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="size-4 shrink-0 text-[#5E17EB]" />
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

function MachineDetailSection({ title, icon: Icon, children }) {
  return (
    <section className="grid gap-3">
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
  const imageSrc = maquina?.imagem
  const imageAlt = maquina?.nome ? `Foto da máquina ${maquina.nome}` : "Foto da máquina"

  return (
    <>
      {imageSrc ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              data-sheet-drag-ignore
              className={cn(
                "group relative aspect-video w-full overflow-hidden rounded-lg border bg-muted text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
              )}
              onClick={() => setFullImageOpen(true)}
            >
              <img src={imageSrc} alt={imageAlt} className="size-full object-contain transition-transform duration-200 group-hover:scale-[1.015]" />
              <span className="absolute left-2 top-2 flex size-8 items-center justify-center rounded-md bg-background/90 text-foreground shadow-sm backdrop-blur">
                <Maximize2Icon className="size-4" />
                <span className="sr-only">Ver foto inteira</span>
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Ver foto inteira</TooltipContent>
        </Tooltip>
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

function MaquinaSummaryCard({ maquina, statusExibicao, integridadeExibicao, totalSensores }) {
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
    <div className="rounded-xl border bg-linear-to-br from-primary/10 via-card to-card p-2 md:p-4 shadow-sm dark:border-gray-700! dark:bg-[#0F172A]">
      <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[7rem_minmax(0,1fr)_auto]">
        <MaquinaImagePreview maquina={maquina} className="!size-24 !aspect-square shrink-0 !rounded-xl !border-2 !border-border/80 shadow-sm sm:!size-28" />
        <div className="min-w-0">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="line-clamp-2 text-xl font-semibold leading-tight text-foreground">{maquina.nome}</h2>
            <p className="line-clamp-2 text-sm text-muted-foreground">{maquina.setor} - {maquina.tipo}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
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

export function MaquinaDetailsPanel({ maquina, sensores = [], sensorError = "", className = "" }) {
  const sensoresDaMaquina = React.useMemo(
    () => getMachineSensors(maquina, sensores),
    [maquina, sensores]
  )
  const totalSensores = sensoresDaMaquina.length > 0 ? sensoresDaMaquina.length : maquina.sensores
  const maquinaComTotalSensores = React.useMemo(
    () => ({ ...maquina, sensores: totalSensores }),
    [maquina, totalSensores]
  )
  const statusExibicao = getMaquinaStatusExibicao(maquinaComTotalSensores)
  const integridadeExibicao = getMaquinaIntegridadeExibicao(maquinaComTotalSensores)
  const predictionSummary = React.useMemo(
    () => getPredictionSummary({ maquina, statusExibicao, integridadeExibicao }),
    [maquina, statusExibicao, integridadeExibicao]
  )
  const [openSections, setOpenSections] = React.useState({
    predicao: false,
    sensores: false,
  })
  const [regressionSheetOpen, setRegressionSheetOpen] = React.useState(false)
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
    setOpenSections({
      predicao: false,
      sensores: false,
    })
    setRegressionSheetOpen(false)
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

    fetchMachinePredictions(maquinaId, session.accessToken, controller.signal)
      .then(({ alertas, risco, historico, errors, unauthorized }) => {
        if (ignore) {
          return
        }

        setPredictionInsights({
          status: alertas || risco || historico.length > 0 ? "success" : "error",
          alertas,
          risco,
          historico,
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
  }, [maquina?.id])

  function toggleSection(section) {
    setOpenSections((currentSections) => ({
      ...currentSections,
      [section]: !currentSections[section],
    }))
  }

  return (
    <div className={cn("flex flex-col gap-5 text-sm", className)}>
      {sensorError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {sensorError}
        </div>
      ) : null}

      <MaquinaSummaryCard
        maquina={maquina}
        statusExibicao={statusExibicao}
        integridadeExibicao={integridadeExibicao}
        totalSensores={totalSensores}
      />

      <MachineDetailSection title="Resumo operacional" icon={GaugeIcon}>
        <div className="grid gap-3 sm:grid-cols-2">
          <MachineDetailItem label="Importância">
            <CriticidadeBadge value={maquina.criticidade} />
          </MachineDetailItem>
          <MachineDetailItem label="Status">
            <StatusBadge value={statusExibicao} />
          </MachineDetailItem>
          <MachineDetailItem label="Integridade">
            <IntegridadeBar value={integridadeExibicao} inactive={statusExibicao === "SEM_SENSOR"} />
          </MachineDetailItem>
          <MachineDetailItem label="Estabilidade">
            <span className="flex items-center gap-1.5">
              <span>{formatMetric(maquina.scoreEstabilidade, "%", 0)}</span>
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

      <div className="flex flex-col gap-2">
        <DetailsAccordionSection
          title="Predições da máquina"
          icon={ActivityIcon}
          open={openSections.predicao}
          onToggle={() => toggleSection("predicao")}
          meta={
            <Badge variant="outline" className="border-[#5E17EB]/35 bg-background/80 px-2 text-xs text-[#7c3aed] dark:text-[#A780FF]">
              {predictionSummary.badge}
            </Badge>
          }
        >
          <div className="grid gap-3">
            <PredictionRemoteNotice
              loading={predictionInsights.status === "loading"}
              errors={predictionInsights.errors}
            />
            <PredicaoResumoCard
              maquina={maquina}
              summary={predictionSummary}
              predicaoAlertas={predictionInsights.alertas}
              predicaoRisco={predictionInsights.risco}
              onOpenRegression={() => setRegressionSheetOpen(true)}
            />
          </div>
        </DetailsAccordionSection>

        <DetailsAccordionSection
          title="Sensores sincronizados"
          icon={ThermometerIcon}
          open={openSections.sensores}
          onToggle={() => toggleSection("sensores")}
          meta={
            <Badge variant="outline" className="border-border/70 bg-background/80 px-2 text-xs text-muted-foreground">
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
        maquina={maquina}
        predicaoAlertas={predictionInsights.alertas}
        historico={predictionInsights.historico}
        loading={predictionInsights.status === "loading"}
        errors={predictionInsights.errors}
      />
    </div>
  )
}
