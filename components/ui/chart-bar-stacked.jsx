"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { DashboardChartSkeleton } from "@/components/dashboard-skeletons"
import { useAlertas } from "@/components/context/alertas-context"
import { useDashboardCharts } from "@/components/context/dashboard-charts-context"
import { useMaquinas } from "@/components/context/maquinas-context"
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
import { getMaquinasPorCriticidade } from "@/lib/orbis-dashboard"
import { withMaquinaAlertasStatus } from "@/lib/maquinas-table"

/** @typedef {import("@/lib/orbis-types").ChartConfig} ChartConfig */

export const description = "Distribuição de máquinas por importância e status"

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
  semSensor: {
    label: "Sem sensor",
    color: "var(--muted-foreground)",
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
  const { status, mensagem, maquinas: dashboardMaquinas, errors } = useDashboardCharts()
  const { maquinas: maquinasCadastradas, status: maquinasStatus, mensagem: maquinasMensagem } = useMaquinas()
  const { alertas } = useAlertas()
  const maquinasBase = maquinasCadastradas.length > 0 ? maquinasCadastradas : dashboardMaquinas
  const maquinas = React.useMemo(() => withMaquinaAlertasStatus(maquinasBase, alertas), [alertas, maquinasBase])
  const chartData = React.useMemo(() => getMaquinasPorCriticidade(maquinas), [maquinas])
  const totalEmAlerta = React.useMemo(
    () => chartData.reduce((total, item) => total + item.emAlerta, 0),
    [chartData]
  )
  const totalSemSensor = React.useMemo(
    () => chartData.reduce((total, item) => total + item.semSensor, 0),
    [chartData]
  )

  const loading = status === "loading" && maquinasStatus === "loading" && maquinas.length === 0
  const errorMessage = errors.maquinas || (maquinasStatus === "error" ? maquinasMensagem : "") || (status === "error" && maquinas.length === 0 ? mensagem : "")

  if (loading) {
    return <DashboardChartSkeleton variant="bar" className="w-full xl:w-1/2" height="h-[280px]" />
  }

  return (
    <Card className="flex w-full xl:w-1/2">
      <CardHeader>
        <CardTitle>Máquinas por Importância</CardTitle>
        <CardDescription>
          {loading
            ? "Carregando distribuição por importância..."
            : maquinas.length === 0
              ? "Nenhuma máquina sincronizada no momento"
              : totalEmAlerta > 0
                ? `${totalEmAlerta} ativos exigem atenção imediata`
                : totalSemSensor > 0
                  ? `${totalSemSensor} ativos aguardam sensores vinculados`
                  : "Nenhum ativo em alerta no momento"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <EmptyState message="Sincronizando importância das máquinas com a API..." />
        ) : errorMessage ? (
          <EmptyState message={errorMessage} tone="error" />
        ) : maquinas.length === 0 ? (
          <EmptyState message="Não há máquinas disponíveis para compor o gráfico." />
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
                radius={totalSemSensor > 0 ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              />
              <Bar
                dataKey="semSensor"
                stackId="criticidade"
                fill="var(--color-semSensor)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="justify-end border-t-0 bg-transparent pt-0">
        <ChartHelp>
          Mostra onde há mais máquinas em alerta por importância.
        </ChartHelp>
      </CardFooter>
    </Card>
  )
}
