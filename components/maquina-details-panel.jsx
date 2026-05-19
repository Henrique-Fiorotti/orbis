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

function getMachineSensors(maquina, sensores) {
  return sensores.filter((sensor) => sensor.maquinaId === maquina.id || sensor.maquinaNome === maquina.nome)
}

function formatMetric(value, suffix = "", digits = 1) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return "N/A"
  }

  return `${parsed.toFixed(digits)}${suffix}`
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
