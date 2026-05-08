"use client"

import { useEffect, useState } from "react"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import { DashboardMetricCardsSkeleton } from "@/components/dashboard-skeletons"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://orbis-5hnm.onrender.com"

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

function getErrorMessage(statusCode, payload) {
  if (statusCode === 401) {
    return "Sua sessão expirou. Faça login novamente."
  }

  if (statusCode === 403) {
    return "Seu usuário não tem permissão para visualizar o resumo do dashboard."
  }

  return payload?.mensagem || payload?.message || `Erro ${statusCode} ao carregar o dashboard.`
}

function formatMetric(value, loading) {
  return loading ? "--" : value
}

function useAnimatedNumber(target, { duration = 1400, decimals = 0 } = {}) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const numericTarget = toNumber(target)

    if (typeof window === "undefined") {
      setValue(numericTarget)
      return
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (prefersReducedMotion || numericTarget === 0) {
      setValue(numericTarget)
      return
    }

    let frameId = 0
    let startTime = 0

    function animate(timestamp) {
      if (!startTime) {
        startTime = timestamp
      }

      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      const nextValue = numericTarget * easedProgress

      setValue(decimals > 0 ? Number(nextValue.toFixed(decimals)) : Math.round(nextValue))

      if (progress < 1) {
        frameId = requestAnimationFrame(animate)
      } else {
        setValue(numericTarget)
      }
    }

    setValue(0)
    frameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frameId)
  }, [target, duration, decimals])

  return value
}

function AnimatedMetric({ value, suffix = "", decimals = 0 }) {
  const animatedValue = useAnimatedNumber(value, { decimals })
  const formattedValue = decimals > 0 ? animatedValue.toFixed(decimals) : animatedValue

  return `${formattedValue}${suffix}`
}

export function SectionCards() {
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
        const response = await fetch(`${API_URL}/dashboard/resumo`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
          cache: "no-store",
        })

        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          if (response.status === 401) {
            clearAuthSession()
          }

          throw new Error(getErrorMessage(response.status, payload))
        }

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
              <AnimatedMetric value={resumo.totalMaquinas} />
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
              <AnimatedMetric value={resumo.alertasHoje} />
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {loading ? null : resumo.alertasAtivos > 0 ? <TrendingDownIcon /> : <TrendingUpIcon />}
                {loading ? "Atualizando" : `${resumo.alertasAtivos} ativos`}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {loading ? "Conferindo alertas em aberto" : `${resumo.alertaSemAtendimento} sem atendimento`}
              {loading || resumo.alertaSemAtendimento > 0 ? <TrendingDownIcon className="size-4" /> : <TrendingUpIcon className="size-4" />}
            </div>
            <div className="text-muted-foreground">
              {loading ? "Resumo diário em sincronização" : `${resumo.alertasAtendidosHoje} já atendidos hoje`}
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card hover:border-[#5E17EB]! hover:ring-[#5E17EB]/50 focus-within:border-[#5E17EB]! focus-within:ring-[#5E17EB]/10">
          <CardHeader>
            <CardDescription className="text-black! dark:text-white!">Sensores online</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              <AnimatedMetric value={resumo.sensoresOnline} />
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {loading ? null : resumo.sensoresOnline > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                {loading ? "Atualizando" : resumo.sensoresOnline > 0 ? "Monitorando" : "Sem sinal"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {loading ? "Sincronizando status dos sensores" : `${resumo.sensoresOnline} sensores transmitindo agora`}
              {loading || resumo.sensoresOnline === 0 ? <TrendingDownIcon className="size-4" /> : <TrendingUpIcon className="size-4" />}
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
              <AnimatedMetric value={resumo.integridadeMedia} suffix="%" decimals={1} />
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
