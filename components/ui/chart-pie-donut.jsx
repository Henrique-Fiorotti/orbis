"use client"

import { TrendingUp } from "lucide-react"
import { Pie, PieChart } from "recharts"

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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A donut chart"

const chartData = [
  { Alerta: "Estavel", quantidade: 275, fill: "var(--chart-1)" },
  { Alerta: "Alerta", quantidade: 200, fill: "var(--chart-2)" },
  { Alerta: "Critico", quantidade: 187, fill: "var(--chart-3)" },
  { Alerta: "Inativo", quantidade: 173, fill: "lightgray" },
]

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
    color: "var(--chart-3)",
  },
  Inativo: {
    label: "Inativo",
    color: "lightgray",
  },
}

export function ChartPieDonut() {
  return (
    <div className="px-6">
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Alertas - Dia</CardTitle>
        <CardDescription>Diário</CardDescription> {/* Fazer ele pegar Dia atual */}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="quantidade"
              nameKey="Alerta"
              innerRadius={60}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
    </div>
  )
}
