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
import { withMaquinaAlertasStatus } from "@/lib/maquinas-table"
import { getHistoricoStatusMaquinas } from "@/lib/orbis-dashboard"

/** @typedef {import("@/lib/orbis-types").ChartConfig} ChartConfig */

export const description = "Historico de maquinas por status"

/** @type {ChartConfig} */
const chartConfig = {
  ok: {
    label: "OK",
    color: "#8A00FF",
  },
  semSensor: {
    label: "Sem sensor",
    color: "#39297c",
  },
  emAndamento: {
    label: "Em andamento",
    color: "#FF914D",
  },
  emAlerta: {
    label: "Em alerta",
    color: "#FF3B3B",
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
  const { alertas, status: alertasStatus } = useAlertas()
  const maquinasBase = maquinasCadastradas.length > 0 ? maquinasCadastradas : dashboardMaquinas
  const maquinas = React.useMemo(() => withMaquinaAlertasStatus(maquinasBase, alertas), [alertas, maquinasBase])
  const chartData = React.useMemo(() => getHistoricoStatusMaquinas(maquinas, alertas), [alertas, maquinas])
  const totalEmAlerta = React.useMemo(
    () => chartData.reduce((total, item) => total + item.emAlerta, 0),
    [chartData]
  )
  const totalEmAndamento = React.useMemo(
    () => chartData.reduce((total, item) => total + item.emAndamento, 0),
    [chartData]
  )
  const totalSemSensor = React.useMemo(
    () => chartData[chartData.length - 1]?.semSensor ?? 0,
    [chartData]
  )

  const loading = status === "loading" || maquinasStatus === "loading" || alertasStatus === "loading"
  const errorMessage = errors.maquinas || (maquinasStatus === "error" ? maquinasMensagem : "") || (status === "error" && maquinas.length === 0 ? mensagem : "")

  if (loading) {
    return <DashboardChartSkeleton variant="bar" className="w-full xl:w-2/3" height="h-[280px]" />
  }

  return (
    <Card className="flex w-full xl:w-2/3">
      <CardHeader>
        <CardTitle>Historico por Status</CardTitle>
        <CardDescription>
          {loading
            ? "Carregando historico por status..."
            : maquinas.length === 0
              ? "Nenhuma maquina sincronizada no momento"
              : totalEmAlerta > 0
                ? `${totalEmAlerta} ocorrencia(s) em alerta na semana atual`
                : totalEmAndamento > 0
                  ? `${totalEmAndamento} ocorrencia(s) em atendimento na semana atual`
                  : totalSemSensor > 0
                    ? `${totalSemSensor} ativo(s) sem sensor hoje`
                    : "Nenhum ativo em alerta no periodo"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <EmptyState message="Sincronizando historico de status com a API..." />
        ) : errorMessage ? (
          <EmptyState message={errorMessage} tone="error" />
        ) : maquinas.length === 0 ? (
          <EmptyState message="Nao ha maquinas disponiveis para compor o grafico." />
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px]">
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
                dataKey="ok"
                stackId="status"
                fill="var(--color-ok)"
                radius={[0, 0, 4, 4]}
                isAnimationActive
                animationBegin={120}
                animationDuration={900}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="semSensor"
                stackId="status"
                fill="var(--color-semSensor)"
                radius={[0, 0, 0, 0]}
                isAnimationActive
                animationBegin={180}
                animationDuration={900}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="emAndamento"
                stackId="status"
                fill="var(--color-emAndamento)"
                radius={[0, 0, 0, 0]}
                isAnimationActive
                animationBegin={240}
                animationDuration={900}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="emAlerta"
                stackId="status"
                fill="var(--color-emAlerta)"
                radius={[4, 4, 0, 0]}
                isAnimationActive
                animationBegin={300}
                animationDuration={900}
                animationEasing="ease-out"
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="justify-end border-t-0 bg-transparent pt-0">
        <ChartHelp>
          Mostra o historico diario de status das maquinas. Cada barra soma o total de maquinas cadastradas.
        </ChartHelp>
      </CardFooter>
    </Card>
  )
}
