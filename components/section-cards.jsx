"use client"

// =============================================================
// INTEGRAÇÃO COM A API — quando a API estiver pronta:
//
// import { useEffect, useState } from "react"
//
// const [resumo, setResumo] = useState(mockResumo)
//
// useEffect(() => {
//   fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/resumo`, {
//     headers: { Authorization: `Bearer ${token}` }
//   })
//     .then(res => res.json())
//     .then(data => setResumo(data))
// }, [])
//
// Resposta esperada da API — GET /dashboard/resumo:
// {
//   totalMaquinas: number,
//   maquinasEmAlerta: number,
//   alertasAtivos: number,
//   alertasHoje: number,
//   tecnicosAtivos: number,
//   integridadeMedia: number
// }
// =============================================================

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"

// Mock — substituir pelo fetch acima quando a API estiver pronta
const mockResumo = {
  totalMaquinas: 8,
  maquinasEmAlerta: 2,
  alertasAtivos: 3,
  alertasHoje: 5,
  tecnicosAtivos: 2,
  integridadeMedia: 77.5,
}

export function SectionCards() {
  const resumo = mockResumo

  const maquinasOk = resumo.totalMaquinas - resumo.maquinasEmAlerta
  const integridadeFormatada = resumo.integridadeMedia.toFixed(1)

  return (
    <div
      className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">

      {/* Card 1 — Total de máquinas e quantas estão em alerta */}
      <Card className="@container/card hover:border-purple-600! hover:ring-purple-600/50 focus-within:border-purple-600! focus-within:ring-purple-600/10">
        <CardHeader>
          <CardDescription>Máquinas ativas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {resumo.totalMaquinas}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {resumo.maquinasEmAlerta > 0 ? <TrendingDownIcon /> : <TrendingUpIcon />}
              {resumo.maquinasEmAlerta} em alerta
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {maquinasOk} operando normalmente
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {resumo.maquinasEmAlerta} requerem atenção imediata
          </div>
        </CardFooter>
      </Card>

      {/* Card 2 — Alertas gerados hoje e quantos ainda estão ativos */}
      <Card className="@container/card hover:border-purple-600! hover:ring-purple-600/50 focus-within:border-purple-600! focus-within:ring-purple-600/10">
        <CardHeader>
          <CardDescription>Alertas hoje</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {resumo.alertasHoje}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingDownIcon />
              {resumo.alertasAtivos} ativos
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {resumo.alertasAtivos} sem atendimento
            <TrendingDownIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {resumo.alertasHoje - resumo.alertasAtivos} já atendidos hoje
          </div>
        </CardFooter>
      </Card>

      {/* Card 3 — Sensores online (totalMaquinas × média de sensores por máquina) */}
      <Card className="@container/card hover:border-purple-600! hover:ring-purple-600/50 focus-within:border-purple-600! focus-within:ring-purple-600/10">
        <CardHeader>
          <CardDescription>Sensores online</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {/* TODO: buscar de GET /sensores e contar status ONLINE */}
            12
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              100%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Todos operacionais
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Nenhum sensor offline no momento
          </div>
        </CardFooter>
      </Card>

      {/* Card 4 — Integridade média das máquinas */}
      <Card className="@container/card hover:border-purple-600! hover:ring-purple-600/50 focus-within:border-purple-600! focus-within:ring-purple-600/10">
        <CardHeader>
          <CardDescription>Integridade média</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {integridadeFormatada}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {resumo.integridadeMedia >= 70 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              {resumo.integridadeMedia >= 70 ? "Estável" : "Atenção"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {resumo.tecnicosAtivos} técnicos ativos
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Média de integridade da frota
          </div>
        </CardFooter>
      </Card>

    </div>
  )
}