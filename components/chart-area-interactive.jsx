"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useDashboardCharts } from "@/components/context/dashboard-charts-context"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
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

const chartConfig = {
  limite: {
    label: "Limite ultrapassado",
    color: "var(--primary)",
  },
  tendencia: {
    label: "Tendencia / degradacao",
    color: "var(--chart-3)",
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
    return "Ultimos 30 dias"
  }

  if (timeRange === "7d") {
    return "Ultimos 7 dias"
  }

  return "Ultimos 3 meses"
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
  const { status, mensagem, alertTrendData, errors, notices } = useDashboardCharts()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = React.useMemo(() => {
    if (alertTrendData.length === 0) {
      return []
    }

    const referenceDate = parseChartDate(alertTrendData[alertTrendData.length - 1].date)
    const startDate = new Date(referenceDate)
    startDate.setUTCDate(referenceDate.getUTCDate() - getRangeDays(timeRange) + 1)

    return alertTrendData.filter((item) => parseChartDate(item.date) >= startDate)
  }, [alertTrendData, timeRange])

  const loading = status === "loading" && alertTrendData.length === 0
  const chartError = errors.alertTrend || (status === "error" && alertTrendData.length === 0 ? mensagem : "")

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Tendencia de alertas</CardTitle>
        <CardDescription>{loading ? "Carregando serie temporal..." : getRangeLabel(timeRange)}</CardDescription>
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
            <ToggleGroupItem value="90d">Ultimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Ultimos 30 dias</ToggleGroupItem>
            <ToggleGroupItem value="7d">Ultimos 7 dias</ToggleGroupItem>
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
              aria-label="Selecionar periodo"
            >
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">Ultimos 3 meses</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Ultimos 30 dias</SelectItem>
              <SelectItem value="7d" className="rounded-lg">Ultimos 7 dias</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <ChartMessage message="Sincronizando alertas do dashboard com a API..." />
        ) : chartError && filteredData.length === 0 ? (
          <ChartMessage message={chartError} tone="error" />
        ) : filteredData.length === 0 ? (
          <ChartMessage message="Nao ha dados suficientes para montar a tendencia de alertas." />
        ) : (
          <>
            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="fillLimite" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-limite)" stopOpacity={1} />
                    <stop offset="95%" stopColor="var(--color-limite)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillTendencia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-tendencia)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-tendencia)" stopOpacity={0.1} />
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
                    />
                  }
                />
                <Area
                  dataKey="tendencia"
                  type="natural"
                  fill="url(#fillTendencia)"
                  stroke="var(--color-tendencia)"
                  stackId="a"
                />
                <Area
                  dataKey="limite"
                  type="natural"
                  fill="url(#fillLimite)"
                  stroke="var(--color-limite)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>

            {notices.alertTrend ? (
              <p className="mt-3 text-xs text-muted-foreground">{notices.alertTrend}</p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}
