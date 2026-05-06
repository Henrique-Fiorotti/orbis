"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"

import { useDashboardCharts } from "@/components/context/dashboard-charts-context"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { ChartHelp } from "@/components/ui/chart-help"
import { getDistribuicaoStatusMaquinas } from "@/lib/orbis-dashboard"

export const description = "Distribuição operacional das máquinas"

const chartConfig = {
  Estavel: {
    label: "Estável",
    color: "var(--chart-1)",
  },
  Alerta: {
    label: "Alerta",
    color: "var(--chart-2)",
  },
  Critico: {
    label: "Crítico",
    color: "#ef4444",
  },
}

function EmptyState({ message, tone = "muted" }) {
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

export function ChartPieDonut() {
  const { status, mensagem, maquinas, errors } = useDashboardCharts()
  const chartData = React.useMemo(() => getDistribuicaoStatusMaquinas(maquinas), [maquinas])
  const total = React.useMemo(
    () => chartData.reduce((acc, item) => acc + item.quantidade, 0),
    [chartData]
  )

  const loading = status === "loading" && maquinas.length === 0
  const errorMessage = errors.maquinas || (status === "error" && maquinas.length === 0 ? mensagem : "")
  const hoje = React.useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
      }).format(new Date()),
    []
  )

  return (
    <Card className="mx-4 flex w-auto flex-col lg:mx-6 xl:mx-0 xl:mr-6 xl:w-2/6">
      <CardHeader className="items-center pb-0">
        <CardTitle>Status das máquinas</CardTitle>
        <CardDescription>{loading ? "Carregando distribuição..." : `Atualizado em ${hoje}`}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {loading ? (
          <EmptyState message="Sincronizando distribuição operacional com a API..." />
        ) : errorMessage ? (
          <EmptyState message={errorMessage} tone="error" />
        ) : total === 0 ? (
          <EmptyState message="Nenhuma máquina sincronizada para compor a distribuição." />
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="status" />}
              />
              <Pie
                data={chartData}
                dataKey="quantidade"
                nameKey="status"
                innerRadius={60}
                outerRadius={92}
                paddingAngle={3}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="status" />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="justify-end border-t-0 bg-transparent pt-0">
        <ChartHelp>
          {loading
            ? "A distribuição será atualizada assim que a API responder."
            : "Mostra quantas máquinas estão estáveis, em alerta ou críticas."}
        </ChartHelp>
      </CardFooter>
    </Card>
  )
}
