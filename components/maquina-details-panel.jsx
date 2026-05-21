"use client"

import * as React from "react"
import {
  ActivityIcon,
  AlertTriangleIcon,
  CircleCheckIcon,
  CircleHelpIcon,
  CircleMinusIcon,
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
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  getMaquinaIntegridadeExibicao,
  getMaquinaStatusExibicao,
  getMaquinaUltimaLeituraExibicao,
} from "@/lib/maquinas-table"
import { cn, tempoRelativo } from "@/lib/utils"

const PREDICAO_LIMIAR_MANUTENCAO = 70
const PREDICAO_LIMIAR_FALHA = 30
const PREDICAO_ANTECEDENCIA_FIM_JANELA_DIAS = 2

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
    <div className="min-w-0 rounded-md border border-border/70 bg-background/70 p-2.5">
      <span className="block text-[11px] font-medium uppercase text-muted-foreground">{label}</span>
      <span className="mt-1 block break-words text-sm font-semibold leading-snug">{value}</span>
      {sub ? <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{sub}</span> : null}
    </div>
  )
}

function PredicaoManutencaoCard({ maquina, sensoresDaMaquina, integridadeExibicao, statusExibicao }) {
  const summary = getPredictionSummary({ maquina, statusExibicao, integridadeExibicao })
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
    stable: "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/20",
    attention: "border-[#5E17EB]/30 bg-[#5E17EB]/5 dark:border-[#5E17EB]/50 dark:bg-[#5E17EB]/10",
    warning: "border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/25",
    critical: "border-red-200 bg-red-50/80 dark:border-red-900/60 dark:bg-red-950/25",
    muted: "border-border bg-muted/30",
  }
  const badgeClasses = {
    stable: "border-emerald-200 bg-white text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    attention: "border-[#5E17EB]/30 bg-white text-[#5E17EB] dark:border-[#5E17EB]/50 dark:bg-[#5E17EB]/10 dark:text-[#A780FF]",
    warning: "border-amber-200 bg-white text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
    critical: "border-red-200 bg-white text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
    muted: "border-border bg-background text-muted-foreground",
  }

  return (
    <div className={cn("rounded-lg border p-3", toneClasses[summary.tone])}>
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
    <div className="rounded-lg border border-[#5E17EB]/25 bg-[#5E17EB]/5 p-3 dark:border-[#5E17EB]/40 dark:bg-[#5E17EB]/10">
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
      <div className={cn("relative aspect-video w-full overflow-hidden rounded-lg border bg-muted", className)}>
        {imageSrc ? (
          <>
            <img src={imageSrc} alt={imageAlt} className="size-full object-contain" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  className="absolute left-2 top-2 shadow-sm"
                  onClick={() => setFullImageOpen(true)}
                >
                  <Maximize2Icon className="size-4" />
                  <span className="sr-only">Ver foto inteira</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Ver foto inteira</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-8" />
          </div>
        )}
      </div>

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
  const ultimaLeituraExibicao = getMaquinaUltimaLeituraExibicao(maquinaComTotalSensores)

  return (
    <div className={cn("flex flex-col gap-4 text-sm", className)}>
      {sensorError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {sensorError}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label>Importância</Label>
          <CriticidadeBadge value={maquina.criticidade} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Status</Label>
          <StatusBadge value={statusExibicao} />
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          <Label>Integridade</Label>
          <IntegridadeBar value={integridadeExibicao} inactive={statusExibicao === "SEM_SENSOR"} />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Label>Estabilidade</Label>
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
          </div>
          <span className="font-medium">{formatMetric(maquina.scoreEstabilidade, "%", 0)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Sensores vinculados</Label>
          <span className="font-medium">{totalSensores}</span>
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <Label>Último sinal</Label>
          <span className="font-medium">
            {ultimaLeituraExibicao ? tempoRelativo(ultimaLeituraExibicao) : "Sem leitura"}
          </span>
        </div>
      </div>

      <PredicaoManutencaoCard
        maquina={maquina}
        sensoresDaMaquina={sensoresDaMaquina}
        integridadeExibicao={integridadeExibicao}
        statusExibicao={statusExibicao}
      />

      <Separator />

      <div className="flex flex-col gap-3">
        <Label>Sensores sincronizados</Label>
        {sensoresDaMaquina.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum sensor vinculado foi retornado pela API para esta máquina.</p>
        ) : (
          sensoresDaMaquina.map((sensor, index) => (
            <div key={sensor.id ?? `${sensor.nome}-${index}`} className="rounded-lg border p-3">
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
    </div>
  )
}
