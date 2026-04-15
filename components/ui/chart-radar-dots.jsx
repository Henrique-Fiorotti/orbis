// @ts-check

"use client"

import * as React from "react"
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts"

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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { getIntegridadePorSetor } from "@/lib/orbis-dashboard"

/** @typedef {import("@/lib/orbis-types").ChartConfig} ChartConfig */

export const description = "Radar de integridade media por setor monitorado"

/** @type {ChartConfig} */
const chartConfig = {
  integridade: {
    label: "Integridade média",
    color: "var(--chart-1)",
  },
}

export function ChartRadarDots() {
  const { maquinas } = useMaquinas()
  const chartData = React.useMemo(() => getIntegridadePorSetor(maquinas), [maquinas])

  return (
    <Card className="w-full xl:w-1/2">
      <CardHeader className="items-center">
        <CardTitle>Integridade por setor</CardTitle>
        <CardDescription>{chartData.length} setores monitorados pela Orbis</CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
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
      </CardContent>
    </Card>
  )
}
