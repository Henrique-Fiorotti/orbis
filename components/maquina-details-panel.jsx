"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { AlertTriangleIcon, CircleCheckIcon, ImageIcon, TrendingUpIcon } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn, tempoRelativo } from "@/lib/utils"

const chartConfig = {
  temperatura: { label: "Temperatura (C)", color: "var(--primary)" },
  vibracao: { label: "Vibracao", color: "var(--chart-3)" },
}

function getMachineSensors(maquina, sensores) {
  return sensores.filter((sensor) => sensor.maquinaId === maquina.id || sensor.maquinaNome === maquina.nome)
}

function formatSensorLabel(nome, index) {
  if (typeof nome !== "string" || !nome.trim()) {
    return `Sensor ${index + 1}`
  }

  return nome.replace(/^Orbis\s+/i, "")
}

function formatMetric(value, suffix = "", digits = 1) {
  if (!Number.isFinite(value)) {
    return "N/A"
  }

  return `${Number(value).toFixed(digits)}${suffix}`
}

function CriticidadeBadge({ value }) {
  const styles = {
    ALTA: "w-[55px] bg-red-100 text-red-700 dark:bg-transparent! dark:text-white",
    MEDIA: "w-[55px] bg-yellow-100 text-yellow-700 dark:bg-transparent! dark:text-white",
    BAIXA: "w-[55px] bg-green-100 text-green-700 dark:bg-transparent! dark:text-white",
  }
  const labels = {
    ALTA: "Alta",
    MEDIA: "Media",
    BAIXA: "Baixa",
  }

  return (
    <Badge variant="outline" className={`px-1.5 ${styles[value]}`}>
      {labels[value] ?? value}
    </Badge>
  )
}

function StatusBadge({ value }) {
  return (
    <Badge variant="outline" className="w-[55px] px-1.5 text-muted-foreground">
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
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-red-200 bg-red-50 text-red-700"
      )}
    >
      {value}
    </Badge>
  )
}

function IntegridadeBar({ value }) {
  const cor = value < 50 ? "bg-red-500" : value < 75 ? "bg-yellow-400" : "bg-green-500"
  const textCor = value < 50 ? "text-red-500" : value < 75 ? "text-yellow-500" : "text-green-600"

  return (
    <div className="flex flex-row-reverse items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-sm font-medium w-9 text-right tabular-nums ${textCor}`}>{value}%</span>
    </div>
  )
}

export function MaquinaImagePreview({ maquina, className = "" }) {
  return (
    <div className={cn("aspect-video w-full overflow-hidden rounded-lg border bg-muted", className)}>
      {maquina?.imagem ? (
        <img src={maquina.imagem} alt="" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <ImageIcon className="size-8" />
        </div>
      )}
    </div>
  )
}

export function MaquinaDetailsPanel({ maquina, sensores = [], sensorError = "", className = "" }) {
  const isMobile = useIsMobile()
  const sensoresDaMaquina = React.useMemo(
    () => getMachineSensors(maquina, sensores),
    [maquina, sensores]
  )
  const leiturasAtuais = React.useMemo(
    () =>
      sensoresDaMaquina.map((sensor, index) => ({
        sensor: formatSensorLabel(sensor.nome, index),
        temperatura: sensor.temperatura?.valorAtual ?? null,
        vibracao: sensor.vibracao?.valorAtual ?? null,
      })),
    [sensoresDaMaquina]
  )
  const possuiLeituras = React.useMemo(
    () => leiturasAtuais.some((itemLeitura) => itemLeitura.temperatura !== null || itemLeitura.vibracao !== null),
    [leiturasAtuais]
  )
  const totalSensores = sensoresDaMaquina.length > 0 ? sensoresDaMaquina.length : maquina.sensores

  return (
    <div className={cn("flex flex-col gap-4 text-sm", className)}>
      {!isMobile && !sensorError && sensoresDaMaquina.length > 0 && possuiLeituras ? (
        <>
          <ChartContainer config={chartConfig} className="h-[340px]">
            <AreaChart accessibilityLayer data={leiturasAtuais} margin={{ left: 0, right: 10 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="sensor" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Area dataKey="vibracao" type="natural" fill="var(--color-vibracao)" fillOpacity={0.35} stroke="var(--color-vibracao)" />
              <Area dataKey="temperatura" type="natural" fill="var(--color-temperatura)" fillOpacity={0.5} stroke="var(--color-temperatura)" />
            </AreaChart>
          </ChartContainer>
          <Separator />
          <div className="flex gap-2 leading-none font-medium">
            Integridade: {maquina.integridade}% - Estabilidade: {maquina.scoreEstabilidade}%
            <TrendingUpIcon className="size-4" />
          </div>
          <Separator />
        </>
      ) : null}

      {sensorError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {sensorError}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label>Criticidade</Label>
          <CriticidadeBadge value={maquina.criticidade} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Status</Label>
          <StatusBadge value={maquina.status} />
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          <Label>Integridade</Label>
          <IntegridadeBar value={maquina.integridade} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Sensores vinculados</Label>
          <span className="font-medium">{totalSensores}</span>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Ultimo sinal</Label>
          <span className="font-medium">{tempoRelativo(maquina.ultimaLeituraEm)}</span>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <Label>Sensores sincronizados</Label>
        {sensoresDaMaquina.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum sensor vinculado foi retornado pela API para esta maquina.</p>
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
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="rounded-md bg-muted/40 p-2">
                  <span className="block text-[11px] uppercase tracking-wide">Temperatura</span>
                  <span className="mt-1 block text-sm font-medium text-foreground">
                    {formatMetric(sensor.temperatura?.valorAtual, " C")}
                  </span>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <span className="block text-[11px] uppercase tracking-wide">Vibracao</span>
                  <span className="mt-1 block text-sm font-medium text-foreground">
                    {formatMetric(sensor.vibracao?.valorAtual, "", 2)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
