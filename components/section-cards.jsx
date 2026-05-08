"use client"

import { useEffect, useState } from "react"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import { getHttpErrorStatus, requestDashboardJson } from "@/lib/dashboard-api"
import { DashboardMetricCardsSkeleton } from "@/components/dashboard-skeletons"
import { useAlertas } from "@/components/context/alertas-context"
import { useSensores } from "@/components/context/sensores-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const EMPTY_RESUMO = {
  totalMaquinas: 0,
  maquinasEmAlerta: 0,
  maquinasFuncionando: 0,
  alertasAtivos: 0,
  alertasHoje: 0,
  tecnicosAtivos: 0,
  integridadeMedia: 0,
  sensoresOnline: 0,
  alertaSemAtendimento: 0,
  alertasAtendidosHoje: 0,
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeResumo(data) {
  const totalMaquinas = toNumber(data?.totalMaquinas)
  const maquinasEmAlerta = toNumber(data?.maquinasEmAlerta)
  const maquinasFuncionando = Number(data?.maquinasFuncionando)

  return {
    totalMaquinas,
    maquinasEmAlerta,
    maquinasFuncionando: Number.isFinite(maquinasFuncionando)
      ? maquinasFuncionando
      : Math.max(totalMaquinas - maquinasEmAlerta, 0),
    alertasAtivos: toNumber(data?.alertasAtivos),
    alertasHoje: toNumber(data?.alertasHoje),
    tecnicosAtivos: toNumber(data?.tecnicosAtivos),
    integridadeMedia: toNumber(data?.integridadeMedia),
    sensoresOnline: toNumber(data?.sensoresOnline),
    alertaSemAtendimento: toNumber(data?.alertaSemAtendimento),
    alertasAtendidosHoje: toNumber(data?.alertasAtendidosHoje),
  }
}

function formatMetric(value, loading) {
  return loading ? "--" : value
}

function isToday(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export function SectionCards() {
  const { alertas, status: alertasStatus } = useAlertas()
  const { sensores } = useSensores()
  const [resumo, setResumo] = useState(EMPTY_RESUMO)
  const [status, setStatus] = useState("loading")
  const [mensagem, setMensagem] = useState("Carregando indicadores do dashboard...")

  useEffect(() => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      setStatus("error")
      setMensagem("Faça login para carregar os indicadores do dashboard.")
      return
    }

    let isActive = true

    async function carregarResumo() {
      setStatus("loading")
      setMensagem("Carregando indicadores do dashboard...")

      try {
        const payload = await requestDashboardJson("/dashboard/resumo", session.accessToken, "o resumo do dashboard")

        if (!isActive) {
          return
        }

        setResumo(normalizeResumo(payload))
        setStatus("success")
        setMensagem("")
      } catch (error) {
        if (!isActive) {
          return
        }

        setResumo(EMPTY_RESUMO)
        setStatus("error")
        if (getHttpErrorStatus(error) === 401) {
          clearAuthSession()
        }
        setMensagem(error instanceof Error ? error.message : "Não foi possível carregar o resumo do dashboard.")
      }
    }

    carregarResumo()

    return () => {
      isActive = false
    }
  }, [])

  const loading = status === "loading"
  const maquinasOk = formatMetric(resumo.maquinasFuncionando, loading)
  const integridadeFormatada = loading ? "--" : `${resumo.integridadeMedia.toFixed(1)}%`
  const sensoresOnline = sensores.length > 0
    ? sensores.filter((sensor) => sensor.status === "ONLINE").length
    : resumo.sensoresOnline
  const alertasSincronizados = alertasStatus !== "loading" ? alertas : null
  const alertasAtivos = alertasSincronizados
    ? alertasSincronizados.filter((alerta) => alerta.status === "ATIVO").length
    : resumo.alertasAtivos
  const alertasHoje = alertasSincronizados
    ? alertasSincronizados.filter((alerta) => isToday(alerta.criadoEm)).length
    : resumo.alertasHoje
  const alertaSemAtendimento = alertasSincronizados
    ? alertasSincronizados.filter((alerta) => alerta.status === "ATIVO" && !alerta.tecnicoId).length
    : resumo.alertaSemAtendimento
  const alertasAtendidosHoje = alertasSincronizados
    ? alertasSincronizados.filter((alerta) => alerta.status === "EM_ANDAMENTO" && isToday(alerta.criadoEm)).length
    : resumo.alertasAtendidosHoje

  if (loading) {
    return <DashboardMetricCardsSkeleton />
  }

  return (
    <>
      {mensagem ? (
        <div className="px-4 lg:px-6">
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              status === "error"
                ? "border-destructive/25 bg-destructive/5 text-destructive"
                : "border-border/60 bg-muted/30 text-muted-foreground"
            }`}
          >
            {mensagem}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        <Card className="@container/card border-[#5E17EB]! border-2 focus-within:border-[#5E17EB]! focus-within:ring-[#5E17EB]/10">
          <CardHeader>
            <CardDescription>Máquinas ativas</CardDescription>
            <CardTitle className="text-[#5E17EB]! text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatMetric(resumo.totalMaquinas, loading)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {loading ? null : resumo.maquinasEmAlerta > 0 ? <TrendingDownIcon /> : <TrendingUpIcon />}
                {loading ? "Atualizando" : `${resumo.maquinasEmAlerta} em alerta`}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {loading ? "Atualizando operação das máquinas" : `${maquinasOk} operando normalmente`}
              {loading || resumo.maquinasEmAlerta > 0 ? <TrendingDownIcon className="size-4" /> : <TrendingUpIcon className="size-4" />}
            </div>
            <div className="text-muted-foreground">
              {loading ? "Sincronizando resumo com a API" : `${resumo.maquinasEmAlerta} requerem atenção imediata`}
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card hover:border-[#5E17EB]! hover:ring-[#5E17EB]/50 focus-within:border-[#5E17EB]! focus-within:ring-[#5E17EB]/10">
          <CardHeader>
            <CardDescription className="text-black! dark:text-white!">Alertas hoje</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatMetric(alertasHoje, loading)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {loading ? null : alertasAtivos > 0 ? <TrendingDownIcon /> : <TrendingUpIcon />}
                {loading ? "Atualizando" : `${alertasAtivos} ativos`}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {loading ? "Conferindo alertas em aberto" : `${alertaSemAtendimento} sem atendimento`}
              {loading || alertaSemAtendimento > 0 ? <TrendingDownIcon className="size-4" /> : <TrendingUpIcon className="size-4" />}
            </div>
            <div className="text-muted-foreground">
              {loading ? "Resumo diário em sincronização" : `${alertasAtendidosHoje} já atendidos hoje`}
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card hover:border-[#5E17EB]! hover:ring-[#5E17EB]/50 focus-within:border-[#5E17EB]! focus-within:ring-[#5E17EB]/10">
          <CardHeader>
            <CardDescription className="text-black! dark:text-white!">Sensores online</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatMetric(sensoresOnline, loading)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {loading ? null : sensoresOnline > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                {loading ? "Atualizando" : sensoresOnline > 0 ? "Monitorando" : "Sem sinal"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {loading ? "Sincronizando status dos sensores" : `${sensoresOnline} sensores transmitindo agora`}
              {loading || sensoresOnline === 0 ? <TrendingDownIcon className="size-4" /> : <TrendingUpIcon className="size-4" />}
            </div>
            <div className="text-muted-foreground">
              {loading ? "Lendo dados mais recentes da API" : "Total considera apenas sensores com status ONLINE"}
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card hover:border-[#5E17EB]! hover:ring-[#5E17EB]/50 focus-within:border-[#5E17EB]! focus-within:ring-[#5E17EB]/10">
          <CardHeader>
            <CardDescription className="text-black! dark:text-white!">Integridade média</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {integridadeFormatada}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {loading ? null : resumo.integridadeMedia >= 70 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                {loading ? "Atualizando" : resumo.integridadeMedia >= 70 ? "Estável" : "Atenção"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {loading ? "Conferindo equipe ativa" : `${resumo.tecnicosAtivos} técnicos ativos`}
              {loading || resumo.tecnicosAtivos === 0 ? <TrendingDownIcon className="size-4" /> : <TrendingUpIcon className="size-4" />}
            </div>
            <div className="text-muted-foreground">
              {loading ? "Calculando média de integridade" : "Média de integridade da frota"}
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
