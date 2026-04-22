"use client"

import * as React from "react"
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts"

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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { getIntegridadePorSetor } from "@/lib/orbis-dashboard"

/** @typedef {import("@/lib/orbis-types").ChartConfig} ChartConfig */

export const description = "Radar de integridade media por setor monitorado"

/** @type {ChartConfig} */
const chartConfig = {
  integridade: {
    label: "Integridade media",
    color: "var(--chart-1)",
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

export function ChartRadarDots() {
  const { status, mensagem, maquinas, errors } = useDashboardCharts()
  const chartData = React.useMemo(() => getIntegridadePorSetor(maquinas), [maquinas])
  const loading = status === "loading" && maquinas.length === 0
  const errorMessage = errors.maquinas || (status === "error" && maquinas.length === 0 ? mensagem : "")

  return (
    <Card className="w-full xl:w-1/2">
      <CardHeader className="items-center">
        <CardTitle>Integridade por setor</CardTitle>
        <CardDescription>
          {loading
            ? "Carregando radar operacional..."
            : chartData.length > 0
              ? `${chartData.length} setores monitorados pela Orbis`
              : "Sem setores sincronizados no momento"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        {loading ? (
          <EmptyState message="Sincronizando setores e niveis de integridade..." />
        ) : errorMessage ? (
          <EmptyState message={errorMessage} tone="error" />
        ) : chartData.length === 0 ? (
          <EmptyState message="Nenhuma maquina sincronizada para compor o radar." />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[280px] w-full"
          >
            <RadarChart data={chartData}>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.setor ?? ""}
                  />
                }
              />
              <PolarAngleAxis dataKey="setorLabel" />
              <PolarRadiusAxis axisLine={false} tick={false} domain={[0, 100]} />
              <PolarGrid />
              <Radar
                dataKey="integridade"
                fill="var(--color-integridade)"
                fillOpacity={0.35}
                stroke="var(--color-integridade)"
                dot={{
                  r: 4,
                  fillOpacity: 1,
                }}
              />
            </RadarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
