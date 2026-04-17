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
import { getDistribuicaoStatusMaquinas } from "@/lib/orbis-dashboard"

export const description = "Distribuicao operacional das maquinas"

const chartConfig = {
  Estavel: {
    label: "Estavel",
    color: "var(--chart-1)",
  },
  Alerta: {
    label: "Alerta",
    color: "var(--chart-2)",
  },
  Critico: {
    label: "Critico",
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
    <Card className="mr-6 flex w-2/6 flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Status das maquinas</CardTitle>
        <CardDescription>{loading ? "Carregando distribuicao..." : `Atualizado em ${hoje}`}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {loading ? (
          <EmptyState message="Sincronizando distribuicao operacional com a API..." />
        ) : errorMessage ? (
          <EmptyState message={errorMessage} tone="error" />
        ) : total === 0 ? (
          <EmptyState message="Nenhuma maquina sincronizada para compor a distribuicao." />
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
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="font-medium">
          {loading ? "Lendo status operacionais..." : `${total} maquinas consideradas na visao atual`}
        </div>
        <div className="text-muted-foreground">
          {loading
            ? "A distribuicao sera atualizada assim que a API responder."
            : "Critico considera maquinas em alerta com alta criticidade ou baixa integridade."}
        </div>
      </CardFooter>
    </Card>
  )
}
