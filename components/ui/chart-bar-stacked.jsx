// @ts-check

"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useMaquinas } from "@/components/context/maquinas-context"
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

export function ChartBarStacked() {
  const { maquinas } = useMaquinas()

  const chartData = React.useMemo(() => getMaquinasPorCriticidade(maquinas), [maquinas])
  const totalEmAlerta = React.useMemo(
    () => chartData.reduce((total, item) => total + item.emAlerta, 0),
    [chartData]
  )

  return (
    <Card className="flex w-full xl:w-1/2">
      <CardHeader>
        <CardTitle>Máquinas por criticidade</CardTitle>
        <CardDescription>
          {totalEmAlerta > 0
            ? `${totalEmAlerta} ativos exigem atenção imediata`
            : "Nenhum ativo em alerta no momento"}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
