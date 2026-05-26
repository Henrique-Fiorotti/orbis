"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"

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
    label: "Integridade média",
    color: "var(--chart-5)",
  },
}

function getRangeDays(timeRange) {
  if (timeRange === "30d") {
    return 30
  }

  if (timeRange === "7d") {
    return 7
  }

  return 90
}

function getRangeLabel(timeRange) {
  if (timeRange === "30d") {
    return "Últimos 30 dias"
  }

  if (timeRange === "7d") {
    return "Últimos 7 dias"
  }

  return "Últimos 3 meses"
}

function parseChartDate(value) {
  return new Date(`${value}T00:00:00Z`)
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

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const { status, mensagem, integrityTrendData, errors, notices } = useDashboardCharts()
  const [timeRange, setTimeRange] = React.useState("7d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = React.useMemo(() => {
    if (integrityTrendData.length === 0) {
      return []
    }

    const referenceDate = parseChartDate(integrityTrendData[integrityTrendData.length - 1].date)
    const startDate = new Date(referenceDate)
    startDate.setUTCDate(referenceDate.getUTCDate() - getRangeDays(timeRange) + 1)

    return integrityTrendData.filter((item) => parseChartDate(item.date) >= startDate)
  }, [integrityTrendData, timeRange])

  const hasVisibleData = filteredData.some((item) => Number.isFinite(Number(item.integridade)))
  const loading = status === "loading" && integrityTrendData.length === 0
  const chartError = errors.integrityTrend || (status === "error" && integrityTrendData.length === 0 ? mensagem : "")

  if (loading) {
    return <DashboardChartSkeleton />
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Gráfico de integridade</CardTitle>
        <CardDescription>{loading ? "Carregando série temporal..." : getRangeLabel(timeRange)}</CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => {
              if (value) {
                setTimeRange(value)
              }
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Últimos 30 dias</ToggleGroupItem>
            <ToggleGroupItem value="7d">Últimos 7 dias</ToggleGroupItem>
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
              className="flex w-40 rounded-xl! **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
          aria-label="Selecionar período"
            >
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">Últimos 3 meses</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Últimos 30 dias</SelectItem>
              <SelectItem value="7d" className="rounded-lg">Últimos 7 dias</SelectItem>
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
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="fillIntegridade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-integridade)" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="var(--color-integridade)" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) =>
                    parseChartDate(value).toLocaleDateString("pt-BR", {
                      month: "short",
                      day: "numeric",
                    })
                  }
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
                      labelFormatter={(value) =>
                        parseChartDate(String(value)).toLocaleDateString("pt-BR", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                      indicator="dot"
                      formatter={(value, name, item) => (
                        <div className="flex min-w-36 items-center justify-between gap-3">
                          <span className="text-muted-foreground">Integridade média</span>
                          <span className="font-mono font-medium text-foreground tabular-nums">
                            {Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%
                          </span>
                          {item?.payload?.maquinas ? (
                            <span className="text-muted-foreground">{item.payload.maquinas} máquinas</span>
                          ) : null}
                        </div>
                      )}
                    />
                  }
                />
                <Area
                  dataKey="integridade"
                  type="natural"
                  fill="url(#fillIntegridade)"
                  stroke="var(--color-integridade)"
                  strokeWidth={2}
                  connectNulls
                />
              </AreaChart>
            </ChartContainer>

          </>
        )}
      </CardContent>
      <CardFooter className="justify-end border-t-0 bg-transparent px-4 pt-0 sm:px-6">
        <ChartHelp>
          <span>A curva mostra a integridade média da frota a partir do histórico das máquinas. Linhas tracejadas marcam atenção em 70% e falha em 30%.</span>
          {notices.integrityTrend ? <span className="mt-2 block text-muted-foreground">{notices.integrityTrend}</span> : null}
        </ChartHelp>
      </CardFooter>
    </Card>
  )
}
