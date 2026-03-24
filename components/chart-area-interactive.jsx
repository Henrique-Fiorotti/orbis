"use client"

// =============================================================
// INTEGRAÇÃO COM A API — quando a API estiver pronta:
//
// Buscar de: GET /alertas?period=90d agrupado por data
// ou criar um endpoint dedicado GET /dashboard/alertas-por-dia
//
// Formato esperado após processar a resposta:
// [
//   { date: "2026-01-01", limite: 3, tendencia: 1 },
//   ...
// ]
//
// "limite"   → alertas do tipo LIMITE_ULTRAPASSADO no dia
// "tendencia"→ alertas dos tipos TENDENCIA_CURTA, TENDENCIA_LONGA,
//              DEGRADACAO_ACELERADA e INSTABILIDADE no dia
// =============================================================

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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

// Mock — substituir por fetch da API quando estiver pronta
// "limite" = alertas por ultrapassagem de limite
// "tendencia" = alertas por tendência / degradação / instabilidade
const chartData = [
  { date: "2025-12-25", limite: 1, tendencia: 0 },
  { date: "2025-12-26", limite: 2, tendencia: 1 },
  { date: "2025-12-27", limite: 0, tendencia: 0 },
  { date: "2025-12-28", limite: 3, tendencia: 1 },
  { date: "2025-12-29", limite: 1, tendencia: 2 },
  { date: "2025-12-30", limite: 4, tendencia: 1 },
  { date: "2025-12-31", limite: 2, tendencia: 0 },
  { date: "2026-01-01", limite: 0, tendencia: 1 },
  { date: "2026-01-02", limite: 1, tendencia: 0 },
  { date: "2026-01-03", limite: 5, tendencia: 2 },
  { date: "2026-01-04", limite: 3, tendencia: 1 },
  { date: "2026-01-05", limite: 2, tendencia: 0 },
  { date: "2026-01-06", limite: 1, tendencia: 1 },
  { date: "2026-01-07", limite: 0, tendencia: 0 },
  { date: "2026-01-10", limite: 2, tendencia: 1 },
  { date: "2026-01-15", limite: 4, tendencia: 2 },
  { date: "2026-01-20", limite: 1, tendencia: 0 },
  { date: "2026-01-25", limite: 3, tendencia: 1 },
  { date: "2026-01-30", limite: 2, tendencia: 3 },
  { date: "2026-02-05", limite: 5, tendencia: 1 },
  { date: "2026-02-10", limite: 3, tendencia: 2 },
  { date: "2026-02-15", limite: 1, tendencia: 0 },
  { date: "2026-02-20", limite: 4, tendencia: 1 },
  { date: "2026-02-25", limite: 2, tendencia: 2 },
  { date: "2026-03-01", limite: 6, tendencia: 3 },
  { date: "2026-03-05", limite: 4, tendencia: 1 },
  { date: "2026-03-10", limite: 3, tendencia: 2 },
  { date: "2026-03-15", limite: 5, tendencia: 1 },
  { date: "2026-03-18", limite: 2, tendencia: 0 },
  { date: "2026-03-20", limite: 4, tendencia: 2 },
  { date: "2026-03-22", limite: 3, tendencia: 1 },
  { date: "2026-03-24", limite: 5, tendencia: 3 },
]

const chartConfig = {
  limite: {
    label: "Limite ultrapassado",
    color: "var(--primary)",
  },
  tendencia: {
    label: "Tendência / Degradação",
    color: "var(--chart-3)",
  },
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2026-03-24")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Tendência de Alertas</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">Últimos 3 meses</span>
          <span className="@[540px]/card:hidden">Últimos 3 meses</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex">
            <ToggleGroupItem value="90d">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Últimos 30 dias</ToggleGroupItem>
            <ToggleGroupItem value="7d">Últimos 7 dias</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Selecionar período">
              <SelectValue placeholder="Últimos 3 meses" />
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
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillLimite" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-limite)" stopOpacity={1.0} />
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
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("pt-BR", {
                  month: "short",
                  day: "numeric",
                })
              }} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("pt-BR", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot" />
              } />
            <Area
              dataKey="tendencia"
              type="natural"
              fill="url(#fillTendencia)"
              stroke="var(--color-tendencia)"
              stackId="a" />
            <Area
              dataKey="limite"
              type="natural"
              fill="url(#fillLimite)"
              stroke="var(--color-limite)"
              stackId="a" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}