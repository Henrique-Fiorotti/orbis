"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useDashboardCharts } from "@/components/context/dashboard-charts-context"
import {
  Card,
  CardContent,
  CardDescription,
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
import { getMaquinasPorCriticidade } from "@/lib/orbis-dashboard"

/** @typedef {import("@/lib/orbis-types").ChartConfig} ChartConfig */

export const description = "Distribuicao de maquinas por criticidade e status"

/** @type {ChartConfig} */
const chartConfig = {
  operando: {
    label: "Operando",
    color: "var(--chart-1)",
  },
  emAlerta: {
    label: "Em alerta",
    color: "var(--chart-2)",
  },
}

function EmptyState({ message, tone = "muted" }) {
  return (
    <div
      className={`flex h-[280px] items-center justify-center rounded-xl border border-dashed px-4 text-center text-sm ${
        tone === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-border/60 bg-muted/20 text-muted-foreground"
      }`}
    >
      {message}
    </div>
  )
}

export function ChartBarStacked() {
  const { status, mensagem, maquinas, errors } = useDashboardCharts()
  const chartData = React.useMemo(() => getMaquinasPorCriticidade(maquinas), [maquinas])
  const totalEmAlerta = React.useMemo(
    () => chartData.reduce((total, item) => total + item.emAlerta, 0),
    [chartData]
  )

  const loading = status === "loading" && maquinas.length === 0
  const errorMessage = errors.maquinas || (status === "error" && maquinas.length === 0 ? mensagem : "")

  return (
    <Card className="flex w-full xl:w-1/2">
      <CardHeader>
        <CardTitle>Maquinas por criticidade</CardTitle>
        <CardDescription>
          {loading
            ? "Carregando distribuicao por criticidade..."
            : maquinas.length === 0
              ? "Nenhuma maquina sincronizada no momento"
              : totalEmAlerta > 0
                ? `${totalEmAlerta} ativos exigem atencao imediata`
                : "Nenhum ativo em alerta no momento"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <EmptyState message="Sincronizando criticidade das maquinas com a API..." />
        ) : errorMessage ? (
          <EmptyState message={errorMessage} tone="error" />
        ) : maquinas.length === 0 ? (
          <EmptyState message="Nao ha maquinas disponiveis para compor o grafico." />
        ) : (
          <ChartContainer config={chartConfig}>
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="operando"
                stackId="criticidade"
                fill="var(--color-operando)"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="emAlerta"
                stackId="criticidade"
                fill="var(--color-emAlerta)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
