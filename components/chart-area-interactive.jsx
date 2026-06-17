"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"

import { useDashboardCharts } from "@/components/context/dashboard-charts-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { DashboardChartSkeleton } from "@/components/dashboard-skeletons"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { ChartHelp } from "@/components/ui/chart-help"

const chartConfig = {
  integridade: {
    label: "Integridade geral",
    color: "#38bdf8",
  },
  maquinaIntegridade: {
    label: "Máquina selecionada",
    color: "#a78bfa",
  },
}

const RANGE_OPTIONS = [
  { value: "30d", label: "Últimos 30 dias" },
  { value: "15d", label: "Últimos 15 dias" },
  { value: "7d", label: "Últimos 7 dias" },
]

function getRangeDays(timeRange) {
  if (timeRange === "30d") {
    return 30
  }

  if (timeRange === "15d") {
    return 15
  }

  return 7
}

function getRangeLabel(timeRange) {
  return RANGE_OPTIONS.find((option) => option.value === timeRange)?.label ?? "Últimos 7 dias"
}

function getMaxVisiblePoints(timeRange) {
  if (timeRange === "30d") {
    return 54
  }

  if (timeRange === "15d") {
    return 48
  }

  return 42
}

function average(values) {
  const validValues = values.filter((value) => Number.isFinite(value))

  if (validValues.length === 0) {
    return null
  }

  return validValues.reduce((total, value) => total + value, 0) / validValues.length
}

function compactChartData(data, timeRange) {
  const maxPoints = getMaxVisiblePoints(timeRange)

  if (data.length <= maxPoints) {
    return data
  }

  const firstTimestamp = data[0]?.timestamp
  const lastTimestamp = data.at(-1)?.timestamp

  if (!Number.isFinite(firstTimestamp) || !Number.isFinite(lastTimestamp) || lastTimestamp <= firstTimestamp) {
    return data.slice(-maxPoints)
  }

  const bucketSize = Math.max(1, (lastTimestamp - firstTimestamp) / (maxPoints - 1))
  const buckets = new Map()

  for (const point of data) {
    const bucketIndex = Math.min(maxPoints - 1, Math.floor((point.timestamp - firstTimestamp) / bucketSize))
    const bucket = buckets.get(bucketIndex) ?? {
      timestamps: [],
      integridades: [],
      maquinaIntegridades: [],
      maquinas: 0,
      estimado: false,
    }

    bucket.timestamps.push(point.timestamp)

    if (Number.isFinite(Number(point.integridade))) {
      bucket.integridades.push(Number(point.integridade))
    }

    if (Number.isFinite(Number(point.maquinaIntegridade))) {
      bucket.maquinaIntegridades.push(Number(point.maquinaIntegridade))
    }

    bucket.maquinas = Math.max(bucket.maquinas, Number(point.maquinas) || 0)
    bucket.estimado = bucket.estimado || Boolean(point.estimado)
    buckets.set(bucketIndex, bucket)
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([index, bucket]) => {
      const timestamp = Math.round(average(bucket.timestamps) ?? firstTimestamp + index * bucketSize)

      return {
        date: new Date(timestamp).toISOString().slice(0, 10),
        timestamp,
        integridade: average(bucket.integridades),
        maquinaIntegridade: average(bucket.maquinaIntegridades),
        maquinas: bucket.maquinas,
        estimado: bucket.estimado,
        compactado: bucket.timestamps.length > 1,
      }
    })
}

function parseChartDate(value) {
  return new Date(`${value}T00:00:00Z`)
}

function getChartTimestamp(item) {
  const timestamp = Number(item?.timestamp)

  if (Number.isFinite(timestamp)) {
    return timestamp
  }

  return parseChartDate(item?.date).getTime()
}

function formatChartDate(value) {
  const timestamp = Number(value)
  const date = Number.isFinite(timestamp) ? new Date(timestamp) : parseChartDate(value)

  if (!Number.isFinite(date.getTime())) {
    return ""
  }

  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatChartTick(value) {
  const timestamp = Number(value)
  const date = Number.isFinite(timestamp) ? new Date(timestamp) : parseChartDate(value)

  if (!Number.isFinite(date.getTime())) {
    return ""
  }

  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  })
}

function getDefaultMachineId(options) {
  const alta = options.filter((item) => String(item.criticidade).toUpperCase() === "ALTA")
  const candidates = alta.length > 0 ? alta : options
  const selected = [...candidates].sort((a, b) => {
    const integridadeDiff = a.integridade - b.integridade
    return integridadeDiff || a.nome.localeCompare(b.nome)
  })[0]

  return selected ? String(selected.id) : ""
}

function ChartMessage({ message, tone = "muted" }) {
  return (
    <div
      className={`flex h-[250px] items-center justify-center rounded-xl border border-dashed px-4 text-center text-sm ${
        tone === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-border/60 bg-muted/20 text-muted-foreground"
      }`}
    >
      {message}
    </div>
  )
}

function getLatestFiniteValue(data, key) {
  for (let index = data.length - 1; index >= 0; index -= 1) {
    const value = Number(data[index]?.[key])

    if (Number.isFinite(value)) {
      return value
    }
  }

  return null
}

function formatPercentValue(value) {
  return Number.isFinite(Number(value))
    ? `${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`
    : "--"
}

function ChartLineLegend({
  selectedMachine,
  hasSelectedMachineData,
  maquinasCount,
  latestGeneralValue,
  latestMachineValue,
}) {
  const generalDetail = maquinasCount > 0
    ? `Frota monitorada (${maquinasCount} ${maquinasCount === 1 ? "maquina" : "maquinas"})`
    : "Frota monitorada"

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-black/10 bg-slate-950/2 px-4 py-3 text-xs shadow-inner dark:bg-slate-950/45">
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative h-3 w-8 shrink-0" aria-hidden="true">
          <span className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 rounded-full bg-[#38bdf8]" />
          <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-[#38bdf8]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-foreground">Frota monitorada - Integridade geral</span>
          <span className="block truncate text-muted-foreground">{generalDetail}</span>
        </span>
        <span className="shrink-0 rounded-md bg-background/30 px-2 py-1 font-mono font-semibold text-foreground tabular-nums">
          {formatPercentValue(latestGeneralValue)}
        </span>
      </div>

      {selectedMachine && hasSelectedMachineData ? (
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative h-3 w-8 shrink-0" aria-hidden="true">
            <span className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 rounded-full bg-[#a78bfa]" />
            <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-[#a78bfa]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-foreground">{selectedMachine.nome} - Maquina selecionada</span>
            <span className="block truncate text-muted-foreground">Ultimo ponto da serie</span>
          </span>
          <span className="shrink-0 rounded-md bg-background/30 px-2 py-1 font-mono font-semibold text-foreground tabular-nums">
            {formatPercentValue(latestMachineValue)}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const { status, mensagem, integrityTrendData, machineIntegrityOptions, errors, notices } = useDashboardCharts()
  const [timeRange, setTimeRange] = React.useState("7d")
  const [selectedMachineId, setSelectedMachineId] = React.useState("")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  React.useEffect(() => {
    setSelectedMachineId((currentId) => {
      if (currentId && machineIntegrityOptions.some((item) => String(item.id) === currentId)) {
        return currentId
      }

      return getDefaultMachineId(machineIntegrityOptions)
    })
  }, [machineIntegrityOptions])

  const selectedMachine = React.useMemo(
    () => machineIntegrityOptions.find((item) => String(item.id) === selectedMachineId) ?? null,
    [machineIntegrityOptions, selectedMachineId]
  )

  const filteredData = React.useMemo(() => {
    if (integrityTrendData.length === 0 && !selectedMachine?.data?.length) {
      return []
    }

    const selectedDataByTimestamp = new Map(
      (selectedMachine?.data ?? []).map((item) => [getChartTimestamp(item), item])
    )
    const allTimestamps = [
      ...integrityTrendData.map(getChartTimestamp),
      ...(selectedMachine?.data ?? []).map(getChartTimestamp),
    ].filter((timestamp) => Number.isFinite(timestamp))

    if (allTimestamps.length === 0) {
      return []
    }

    const referenceTimestamp = Math.max(...allTimestamps)
    const startDate = new Date(referenceTimestamp)
    startDate.setUTCDate(startDate.getUTCDate() - getRangeDays(timeRange) + 1)
    const startTimestamp = startDate.getTime()
    const generalDataByTimestamp = new Map(integrityTrendData.map((item) => [getChartTimestamp(item), item]))

    const data = Array.from(new Set(allTimestamps))
      .filter((timestamp) => timestamp >= startTimestamp)
      .sort((a, b) => a - b)
      .map((timestamp) => {
        const generalItem = generalDataByTimestamp.get(timestamp)
        const selectedItem = selectedDataByTimestamp.get(timestamp)

        return {
          date: generalItem?.date ?? selectedItem?.date ?? "",
          timestamp,
          integridade: generalItem?.integridade ?? null,
          maquinas: generalItem?.maquinas ?? 0,
          estimado: generalItem?.estimado ?? false,
          maquinaIntegridade: selectedItem?.integridade ?? null,
        }
      })

    return compactChartData(data, timeRange)
  }, [integrityTrendData, selectedMachine, timeRange])

  const hasVisibleData = filteredData.some((item) => Number.isFinite(Number(item.integridade)))
  const hasSelectedMachineData = filteredData.some((item) => Number.isFinite(Number(item.maquinaIntegridade)))
  const maquinasCount = filteredData.reduce((total, item) => Math.max(total, Number(item.maquinas) || 0), 0)
  const latestGeneralValue = getLatestFiniteValue(filteredData, "integridade")
  const latestMachineValue = getLatestFiniteValue(filteredData, "maquinaIntegridade")
  const loading = status === "loading" && integrityTrendData.length === 0
  const chartError = errors.integrityTrend || (status === "error" && integrityTrendData.length === 0 ? mensagem : "")

  if (loading) {
    return <DashboardChartSkeleton />
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Gráfico de integridade</CardTitle>
        <CardDescription>
          {loading ? "Carregando série temporal..." : selectedMachine ? `${getRangeLabel(timeRange)} - ${selectedMachine.nome}` : getRangeLabel(timeRange)}
        </CardDescription>
        <CardAction className="flex flex-wrap items-center justify-end gap-2 rounded-none!">
          {machineIntegrityOptions.length > 0 ? (
            <Select value={selectedMachineId} onValueChange={setSelectedMachineId}>
              <SelectTrigger
                className="w-44 rounded-xl! **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
                size="sm"
                aria-label="Selecionar máquina"
              >
                <SelectValue placeholder="Selecionar máquina" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {machineIntegrityOptions.map((machine) => (
                  <SelectItem key={machine.id} value={String(machine.id)} className="rounded-lg">
                    {machine.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => {
              if (value) {
                setTimeRange(value)
              }
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[940px]/card:flex"
          >
            {RANGE_OPTIONS.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}>{option.label}</ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(value) => {
              if (value) {
                setTimeRange(value)
              }
            }}
          >
            <SelectTrigger
              className="flex w-40 rounded-xl! **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[940px]/card:hidden"
              size="sm"
              aria-label="Selecionar período"
            >
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="rounded-lg">{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <ChartMessage message="Sincronizando histórico de integridade com a API..." />
        ) : chartError && filteredData.length === 0 ? (
          <ChartMessage message={chartError} tone="error" />
        ) : !hasVisibleData ? (
          <ChartMessage message="Não há dados suficientes para montar o gráfico de integridade." />
        ) : (
          <>
            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
              <LineChart data={filteredData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={formatChartTick}
                />
                <YAxis
                  width={34}
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <ReferenceLine
                  y={70}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                />
                <ReferenceLine
                  y={30}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value, payload) => formatChartDate(payload?.[0]?.payload?.timestamp ?? value)}
                      indicator="dot"
                      formatter={(value, name, item) => (
                        <div className="flex min-w-36 items-center justify-between gap-3">
                          <span className="text-muted-foreground">
                            {item?.dataKey === "maquinaIntegridade" ? selectedMachine?.nome ?? "Máquina selecionada" : "Integridade geral"}
                          </span>
                          <span className="font-mono font-medium text-foreground tabular-nums">
                            {Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%
                          </span>
                          {item?.dataKey !== "maquinaIntegridade" && item?.payload?.maquinas ? (
                            <span className="text-muted-foreground">{item.payload.maquinas} máquinas</span>
                          ) : null}
                        </div>
                      )}
                    />
                  }
                />
                <Line
                  dataKey="integridade"
                  type="monotone"
                  stroke="var(--color-integridade)"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
                {selectedMachine && hasSelectedMachineData ? (
                  <Line
                    dataKey="maquinaIntegridade"
                    type="monotone"
                    stroke="var(--color-maquinaIntegridade)"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ) : null}
              </LineChart>
            </ChartContainer>
            <ChartLineLegend
              selectedMachine={selectedMachine}
              hasSelectedMachineData={hasSelectedMachineData}
              maquinasCount={maquinasCount}
              latestGeneralValue={latestGeneralValue}
              latestMachineValue={latestMachineValue}
            />
          </>
        )}
      </CardContent>
      <CardFooter className="justify-end border-t-0 bg-transparent px-4 pt-0 sm:px-6">
        <ChartHelp>
          <span>A linha azul mostra a integridade geral calculada pelo histórico da API. A linha lilás mostra a máquina selecionada; por padrão, a máquina de importância alta com menor integridade atual.</span>
          {notices.integrityTrend ? <span className="mt-2 block text-muted-foreground">{notices.integrityTrend}</span> : null}
        </ChartHelp>
      </CardFooter>
    </Card>
  )
}
