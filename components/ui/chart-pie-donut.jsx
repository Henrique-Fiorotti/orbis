"use client"

import { TrendingUp } from "lucide-react"
import { Pie, PieChart, Bar, BarChart, } from "recharts"

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

export const description = "A donut chart"

const chartData = [
  { Alerta: "Estavel", quantidade: 7, fill: "var(--chart-1)" },
  { Alerta: "Alerta", quantidade: 2, fill: "yellow" },
  { Alerta: "Critico", quantidade: 0, fill: "red" },
]

const chartConfig = {
  Estavel: {
    label: "Estavel",
    color: "var(--chart-1)",
  },
  Alerta: {
    label: "Alerta",
    color: "yellow",
  },
  Critico: {
    label: "Critico",
    color: "red",
  },
}

export function ChartPieDonut() {
  return (
    
    <Card className="flex w-2/6 flex-col mr-6">
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
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="desktop"
              stackId="a"
              fill="var(--color-desktop)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="mobile"
              stackId="a"
              fill="var(--color-mobile)"
              radius={[4, 4, 0, 0]}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
    
  )
}
