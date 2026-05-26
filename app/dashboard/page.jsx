"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  ClipboardListIcon,
  GaugeIcon,
  Loader2Icon,
  ShieldAlertIcon,
  WrenchIcon,
  WashingMachineIcon,
  NfcIcon,
} from "lucide-react"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DashboardChartsProvider } from "@/components/context/dashboard-charts-context"
import { useAlertas } from "@/components/context/alertas-context"
import { useMaquinas } from "@/components/context/maquinas-context"
import { useSensores } from "@/components/context/sensores-context"
import { RefreshTooltipButton } from "@/components/refresh-tooltip-button"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ChartPieDonut } from "@/components/ui/chart-pie-donut"
import { ChartBarStacked } from "@/components/ui/chart-bar-stacked"
import { ChartRadarDots } from "@/components/ui/chart-radar-dots"
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions"
import { getAuthSessionUser } from "@/lib/auth-session"
import { tempoRelativo } from "@/lib/utils"
import { DashboardTour } from "./dashboard-tour"

const SEVERIDADE_ORDEM = {
  ALTA: 3,
  MEDIA: 2,
  BAIXA: 1,
}

const SEVERIDADE_BADGE_CLASS = {
  ALTA: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
  MEDIA: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300",
  BAIXA: "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300",
}

const STATUS_BADGE_CLASS = {
  ATIVO: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
  EM_ANDAMENTO: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300",
  RESOLVIDO: "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300",
  CANCELADO: "border-gray-200 bg-gray-50 text-gray-600 dark:border-border dark:bg-muted/30 dark:text-muted-foreground",
}

const STATUS_LABEL = {
  ATIVO: "Em aberto",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDO: "Resolvido",
  CANCELADO: "Cancelado",
}

const MACHINE_ALERT_STATUS_BADGE_CLASS = {
  COM_ALERTA: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
  EM_ANDAMENTO: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300",
}

const MACHINE_ALERT_STATUS_LABEL = {
  COM_ALERTA: "Com alerta",
  EM_ANDAMENTO: "Em andamento",
}

const technicianCardClass =
  "@container/card shadow-xs transition-colors hover:border-[#5E17EB]! hover:ring-[#5E17EB]/50 dark:bg-card"

const technicianPanelClass =
  "rounded-xl border bg-card p-4 shadow-sm dark:border-gray-700! dark:bg-[#0F172A]"

const technicianPriorityPanelClass =
  "rounded-xl border bg-linear-to-br from-primary/10 via-card to-card p-4 shadow-sm dark:border-gray-700! dark:bg-[#0F172A]"

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function getAlertDate(alerta) {
  return alerta?.ultimaOcorrenciaEm || alerta?.atualizadoEm || alerta?.criadoEm || ""
}

function getAlertTimestamp(alerta) {
  const timestamp = Date.parse(getAlertDate(alerta))
  return Number.isFinite(timestamp) ? timestamp : 0
}

function sortByPriority(a, b) {
  const severityDiff = (SEVERIDADE_ORDEM[b.severidade] ?? 0) - (SEVERIDADE_ORDEM[a.severidade] ?? 0)
  return severityDiff || getAlertTimestamp(b) - getAlertTimestamp(a)
}

function isToday(value) {
  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) {
    return false
  }

  return date.toLocaleDateString("pt-BR") === new Date().toLocaleDateString("pt-BR")
}

function isAlertAssignedToUser(alerta, usuario) {
  if (!alerta || !usuario) {
    return false
  }

  if (alerta.tecnicoId !== null && alerta.tecnicoId !== undefined && usuario.id !== null && usuario.id !== undefined) {
    return String(alerta.tecnicoId) === String(usuario.id)
  }

  if (alerta.tecnicoNome && usuario.nome) {
    return normalizeText(alerta.tecnicoNome) === normalizeText(usuario.nome)
  }

  return false
}

function MetricCard({ icon: Icon, label, value, sub, badge, tone = "purple", featured = false }) {
  const toneConfig = {
    purple: {
      icon: "border-[#5E17EB]/20 bg-[#5E17EB]/10 text-[#5E17EB] dark:border-[#5E17EB]/40 dark:bg-[#5E17EB]/20 dark:text-purple-200",
      badge: "border-[#5E17EB]/20 bg-[#5E17EB]/10 text-[#5E17EB] dark:border-[#5E17EB]/40 dark:bg-[#5E17EB]/20 dark:text-purple-200",
    },
    red: {
      icon: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
      badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
    },
    yellow: {
      icon: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300",
      badge: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300",
    },
    green: {
      icon: "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300",
      badge: "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300",
    },
  }[tone]

  return (
    <Card className={`${technicianCardClass} ${featured ? "border-[#5E17EB]! border-2" : ""}`}>
      <CardHeader className="min-h-[88px]">
        <CardDescription className={featured ? "" : "text-black! dark:text-white!"}>{label}</CardDescription>
        <CardTitle className={`text-2xl font-semibold tabular-nums @[250px]/card:text-3xl ${featured ? "text-[#5E17EB]!" : ""}`}>
          {value}
        </CardTitle>
        <CardAction>
          <span className={`inline-flex size-9 items-center justify-center rounded-lg border ${toneConfig.icon}`}>
            <Icon className="size-4" />
          </span>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex items-center gap-2 font-medium">
          {sub}
          <Icon className="size-4" />
        </div>
        <Badge variant="outline" className={toneConfig.badge}>
          {badge}
        </Badge>
      </CardFooter>
    </Card>
  )
}

function StatusBadge({ status }) {
  return (
    <Badge variant="outline" className={`px-1.5 ${STATUS_BADGE_CLASS[status] ?? STATUS_BADGE_CLASS.ATIVO}`}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  )
}

function SeveridadeBadge({ value }) {
  return (
    <Badge variant="outline" className={`px-1.5 ${SEVERIDADE_BADGE_CLASS[value] ?? SEVERIDADE_BADGE_CLASS.MEDIA}`}>
      {value ? value.charAt(0) + value.slice(1).toLowerCase() : "Média"}
    </Badge>
  )
}

function EmptyPanel({ title, description }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 text-center">
      <ClipboardListIcon className="mb-3 size-8 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function AlertListItem({ alerta, onOpen, onStart, starting }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card/80 p-3 shadow-xs ring-1 ring-foreground/5 transition-colors hover:border-[#5E17EB]/70 dark:border-gray-700! dark:bg-[#0F172A]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[#3B2867] dark:text-white">{alerta.maquinaNome}</span>
            <SeveridadeBadge value={alerta.severidade} />
            <StatusBadge status={alerta.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{alerta.sensorNome}</p>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ClockIcon className="size-3.5" />
          {tempoRelativo(getAlertDate(alerta))}
        </span>
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-foreground">{alerta.mensagem}</p>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {alerta.status === "ATIVO" ? (
          <Button size="sm" className="cursor-pointer" onClick={() => onStart(alerta)} disabled={starting}>
            {starting ? <Loader2Icon className="mr-1 size-4 animate-spin" /> : <WrenchIcon className="mr-1 size-4" />}
            Iniciar atendimento
          </Button>
        ) : null}
        <Button variant="outline" size="sm" className="cursor-pointer hover:border-[#5E17EB] hover:text-[#5E17EB]" onClick={() => onOpen(alerta)}>
          Ver detalhes
          <ArrowRightIcon className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  )
}

function MachineAttentionItem({ item, onOpen }) {
  return (
    <button
      type="button"
      className="flex min-h-[118px] cursor-pointer flex-col justify-between gap-3 rounded-xl border bg-card/80 p-3 text-left shadow-xs ring-1 ring-foreground/5 transition-colors hover:border-[#5E17EB] hover:ring-[#5E17EB]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E17EB]/30 dark:border-gray-700! dark:bg-[#0F172A]"
      onClick={() => onOpen(item)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#3B2867] dark:text-white">{item.maquinaNome}</p>
          <p className="text-xs text-muted-foreground">{item.sensores.size} sensor(es) em atenção</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant="outline" className={`px-1.5 ${MACHINE_ALERT_STATUS_BADGE_CLASS[item.statusMaquina] ?? MACHINE_ALERT_STATUS_BADGE_CLASS.COM_ALERTA}`}>
            {MACHINE_ALERT_STATUS_LABEL[item.statusMaquina] ?? "Com alerta"}
          </Badge>
          <SeveridadeBadge value={item.severidade} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{item.total} alerta(s)</span>
        <span>{tempoRelativo(item.ultimaOcorrenciaEm)}</span>
      </div>
    </button>
  )
}

function TechnicianDashboard() {
  const router = useRouter()
  const usuario = getAuthSessionUser()
  const {
    alertas,
    status: alertasStatus,
    salvando,
    atualizarStatus,
    recarregarAlertas,
  } = useAlertas()
  const { maquinas, status: maquinasStatus, recarregarMaquinas } = useMaquinas()
  const { sensores, status: sensoresStatus, recarregarSensores } = useSensores()
  const [startingAlertId, setStartingAlertId] = React.useState(null)
  const [alertaConfirmacao, setAlertaConfirmacao] = React.useState(null)
  const [atendimentosIniciados, setAtendimentosIniciados] = React.useState(() => new Set())

  const loading = alertasStatus === "loading" || maquinasStatus === "loading" || sensoresStatus === "loading"
  const alertasAtivos = React.useMemo(() => alertas.filter((alerta) => alerta.status === "ATIVO"), [alertas])
  const alertasEmAndamento = React.useMemo(() => alertas.filter((alerta) => alerta.status === "EM_ANDAMENTO"), [alertas])
  const meusAtendimentos = React.useMemo(
    () => alertasEmAndamento
      .filter((alerta) => isAlertAssignedToUser(alerta, usuario) || atendimentosIniciados.has(alerta.id))
      .sort(sortByPriority),
    [alertasEmAndamento, atendimentosIniciados, usuario]
  )
  const alertasPrioritarios = React.useMemo(
    () => [...alertasAtivos].sort(sortByPriority).slice(0, 5),
    [alertasAtivos]
  )
  const criticos = React.useMemo(
    () => alertas.filter((alerta) => ["ATIVO", "EM_ANDAMENTO"].includes(alerta.status) && alerta.severidade === "ALTA"),
    [alertas]
  )
  const atendimentosConcluidos = React.useMemo(
    () => alertas
      .filter((alerta) => alerta.status === "RESOLVIDO" && (isAlertAssignedToUser(alerta, usuario) || atendimentosIniciados.has(alerta.id)))
      .sort((a, b) => getAlertTimestamp(b) - getAlertTimestamp(a)),
    [alertas, atendimentosIniciados, usuario]
  )
  const resolvidosHoje = React.useMemo(
    () => atendimentosConcluidos.filter((alerta) => isToday(alerta.atualizadoEm || alerta.ultimaOcorrenciaEm || alerta.criadoEm)).length,
    [atendimentosConcluidos]
  )
  const maquinasSobAtencao = React.useMemo(() => {
    const grouped = new Map()

    for (const alerta of alertas.filter((item) => ["ATIVO", "EM_ANDAMENTO"].includes(item.status))) {
      const key = String(alerta.maquinaId ?? alerta.maquinaNome)
      const existing = grouped.get(key) ?? {
        maquinaId: alerta.maquinaId,
        maquinaNome: alerta.maquinaNome,
        sensores: new Set(),
        total: 0,
        statusMaquina: "EM_ANDAMENTO",
        severidade: alerta.severidade,
        ultimaOcorrenciaEm: getAlertDate(alerta),
      }

      existing.total += 1
      existing.sensores.add(alerta.sensorNome)

      if (alerta.status === "ATIVO") {
        existing.statusMaquina = "COM_ALERTA"
      }

      if ((SEVERIDADE_ORDEM[alerta.severidade] ?? 0) > (SEVERIDADE_ORDEM[existing.severidade] ?? 0)) {
        existing.severidade = alerta.severidade
      }

      if (getAlertTimestamp(alerta) > Date.parse(existing.ultimaOcorrenciaEm || "")) {
        existing.ultimaOcorrenciaEm = getAlertDate(alerta)
      }

      grouped.set(key, existing)
    }

    return Array.from(grouped.values()).sort((a, b) => {
      const severityDiff = (SEVERIDADE_ORDEM[b.severidade] ?? 0) - (SEVERIDADE_ORDEM[a.severidade] ?? 0)
      return severityDiff || Date.parse(b.ultimaOcorrenciaEm || "") - Date.parse(a.ultimaOcorrenciaEm || "")
    }).slice(0, 6)
  }, [alertas])
  const sensoresOffline = React.useMemo(() => sensores.filter((sensor) => sensor.status === "OFFLINE").length, [sensores])

  async function refreshAll() {
    await Promise.allSettled([recarregarAlertas(), recarregarMaquinas(), recarregarSensores()])
  }

  function abrirAlerta(alerta) {
    router.push(`/dashboard/alertas?alertaId=${encodeURIComponent(alerta.id)}`)
  }

  function abrirMaquina(item) {
    router.push(`/dashboard/alertas?maquina=${encodeURIComponent(item.maquinaNome)}`)
  }

  function solicitarInicioAtendimento(alerta) {
    setAlertaConfirmacao(alerta)
  }

  function alternarConfirmacaoAtendimento(open) {
    if (!open && !startingAlertId) {
      setAlertaConfirmacao(null)
    }
  }

  function abrirDetalhesConfirmacao() {
    if (!alertaConfirmacao) {
      return
    }

    const alerta = alertaConfirmacao
    setAlertaConfirmacao(null)
    abrirAlerta(alerta)
  }

  async function iniciarAtendimento(alerta) {
    try {
      setStartingAlertId(alerta.id)
      await atualizarStatus(alerta.id, "EM_ANDAMENTO")
      setAtendimentosIniciados((current) => new Set(current).add(alerta.id))
      setAlertaConfirmacao(null)
      toast.success("Atendimento iniciado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar o atendimento.")
    } finally {
      setStartingAlertId(null)
    }
  }

  return (
    <>
      <SiteHeader tourId="tour-header" />
      <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
        <div id="tour-technician-overview" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GaugeIcon className="size-5 text-[#3B2867] dark:text-white" />
              <h1 className="text-lg font-semibold text-[#3B2867] dark:text-white">Painel técnico</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Prioridades de atendimento, máquinas com alertas e seus alertas em andamento.
            </p>
          </div>
          <RefreshTooltipButton
            onClick={refreshAll}
            disabled={loading || salvando}
            successMessage="Atualização do painel técnico concluída."
          />
        </div>

        <div id="tour-technician-metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={WrenchIcon} label="Meus atendimentos" value={meusAtendimentos.length} sub="Alertas assumidos por você" badge="Sua fila" tone="purple" featured />
          <MetricCard icon={ClipboardListIcon} label="Pendentes" value={alertasAtivos.length} sub="Disponíveis para iniciar" badge="Aguardando" tone="red" />
          <MetricCard icon={CheckCircle2Icon} label="Resolvidos hoje" value={resolvidosHoje} sub="Finalizados no dia" badge="Hoje" tone="green" />
          <MetricCard icon={ShieldAlertIcon} label="Críticos" value={criticos.length} sub="Severidade alta em aberto" badge="Alta prioridade" tone="yellow" />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
          <section id="tour-technician-priority" className={technicianPriorityPanelClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#3B2867] dark:text-white">Prioridade agora</h2>
                <p className="text-sm text-muted-foreground">Alertas abertos ordenados por severidade e recência.</p>
              </div>
              <Button variant="ghost" size="sm" className="cursor-pointer text-[#5E17EB] hover:text-[#5E17EB]" onClick={() => router.push("/dashboard/alertas")}>
                Ver todos
                <ArrowRightIcon className="ml-1 size-4" />
              </Button>
            </div>
            <Separator className="my-4" />
            <div className="flex flex-col gap-3">
              {alertasPrioritarios.length > 0 ? (
                alertasPrioritarios.map((alerta) => (
                  <AlertListItem
                    key={alerta.id}
                    alerta={alerta}
                    onOpen={abrirAlerta}
                    onStart={solicitarInicioAtendimento}
                    starting={startingAlertId === alerta.id}
                  />
                ))
              ) : (
                <EmptyPanel title="Sem alertas pendentes" description="Quando novos alertas forem gerados, eles aparecem aqui para triagem." />
              )}
            </div>
          </section>

          <div className="flex flex-col gap-4">
            <section id="tour-technician-active" className={technicianPanelClass}>
              <h2 className="text-base font-semibold text-[#3B2867] dark:text-white">Meus alertas em andamento</h2>
              <p className="text-sm text-muted-foreground">Atendimentos vinculados ao seu usuário.</p>
              <Separator className="my-4" />
              <div className="flex flex-col gap-3">
                {meusAtendimentos.length > 0 ? (
                  meusAtendimentos.slice(0, 3).map((alerta) => (
                    <AlertListItem
                      key={alerta.id}
                      alerta={alerta}
                      onOpen={abrirAlerta}
                      onStart={solicitarInicioAtendimento}
                      starting={startingAlertId === alerta.id}
                    />
                  ))
                ) : (
                  <EmptyPanel title="Nenhum atendimento em andamento" description="Ao iniciar um alerta, ele passa a aparecer nesta lista." />
                )}
              </div>
            </section>

            <section id="tour-technician-completed" className={technicianPanelClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[#3B2867] dark:text-white">Atendimentos concluídos</h2>
                  <p className="text-sm text-muted-foreground">Histórico de alertas resolvidos por você.</p>
                </div>
                <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300">
                  {atendimentosConcluidos.length} concluído(s)
                </Badge>
              </div>
              <Separator className="my-4" />
              <div className="flex max-h-[360px] flex-col gap-3 overflow-y-auto pr-1">
                {atendimentosConcluidos.length > 0 ? (
                  atendimentosConcluidos.map((alerta) => (
                    <AlertListItem
                      key={alerta.id}
                      alerta={alerta}
                      onOpen={abrirAlerta}
                      onStart={solicitarInicioAtendimento}
                      starting={startingAlertId === alerta.id}
                    />
                  ))
                ) : (
                  <EmptyPanel title="Nenhum atendimento concluído" description="Quando você resolver alertas, o histórico aparece aqui." />
                )}
              </div>
            </section>

            {/* <section id="tour-technician-operation" className={technicianPanelClass}>
              <h2 className="text-base font-semibold text-[#3B2867] dark:text-white">Sinais da operação</h2>
              <p className="text-sm text-muted-foreground">Resumo rápido para orientar sua ronda.</p>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border bg-card/70 p-3 shadow-xs ring-1 ring-foreground/5">
                  <span className="text-xs text-muted-foreground">Máquinas cadastradas</span>
                  <p className="mt-1 text-2xl font-semibold text-[#3B2867] dark:text-white">{maquinas.length}</p>
                </div>
                <div className="rounded-xl border bg-card/70 p-3 shadow-xs ring-1 ring-foreground/5">
                  <span className="text-xs text-muted-foreground">Sensores offline</span>
                  <p className="mt-1 text-2xl font-semibold text-[#3B2867] dark:text-white">{sensoresOffline}</p>
                </div>
              </div>
            </section> */}
          </div>
        </div>

        <section id="tour-technician-machines" className={technicianPanelClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#3B2867] dark:text-white">Máquinas sob atenção</h2>
              <p className="text-sm text-muted-foreground">Equipamentos com alertas ativos ou em atendimento.</p>
            </div>
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => router.push("/dashboard/maquinas")}>
              Ver máquinas
            </Button>
          </div>
          <Separator className="my-4" />
          {maquinasSobAtencao.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {maquinasSobAtencao.map((item) => (
                <MachineAttentionItem key={`${item.maquinaId ?? item.maquinaNome}`} item={item} onOpen={abrirMaquina} />
              ))}
            </div>
          ) : (
            <EmptyPanel title="Nenhuma máquina sob atenção" description="Não há alertas ativos ou em andamento vinculados a máquinas agora." />
          )}
        </section>

        <section id="tour-technician-shortcuts" className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Button variant="outline" className="h-auto cursor-pointer justify-between rounded-xl bg-card p-4 shadow-xs transition-colors hover:border-[#5E17EB] hover:text-[#5E17EB]" onClick={() => router.push("/dashboard/alertas")}>
            <span className="flex items-center gap-2">
              <AlertTriangleIcon className="size-4 text-[#5E17EB]" />
              Alertas em aberto
            </span>
            <ArrowRightIcon className="size-4" />
          </Button>
          <Button variant="outline" className="h-auto cursor-pointer justify-between rounded-xl bg-card p-4 shadow-xs transition-colors hover:border-[#5E17EB] hover:text-[#5E17EB]" onClick={() => router.push("/dashboard/maquinas")}>
            <span className="flex items-center gap-2">
              <WashingMachineIcon className="size-4 text-[#5E17EB]" />
              Máquinas
            </span>
            <ArrowRightIcon className="size-4" />
          </Button>
          <Button variant="outline" className="h-auto cursor-pointer justify-between rounded-xl bg-card p-4 shadow-xs transition-colors hover:border-[#5E17EB] hover:text-[#5E17EB]" onClick={() => router.push("/dashboard/sensores")}>
            <span className="flex items-center gap-2">
              <NfcIcon className="size-4 text-[#5E17EB]" />
              Sensores
            </span>
            <ArrowRightIcon className="size-4" />
          </Button>
        </section>
      </div>

      <Dialog open={Boolean(alertaConfirmacao)} onOpenChange={alternarConfirmacaoAtendimento}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md gap-0 overflow-hidden p-0 sm:max-w-lg" showCloseButton={!startingAlertId}>
          <DialogHeader className="border-b bg-card px-5 py-5 pr-12">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#5E17EB]/20 bg-[#5E17EB]/10 text-[#5E17EB] dark:border-[#5E17EB]/40 dark:bg-[#5E17EB]/20 dark:text-purple-200">
                <WrenchIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-semibold leading-snug text-[#3B2867] dark:text-white">
                  Deseja iniciar esse atendimento?
                </DialogTitle>
                <DialogDescription className="mt-1 leading-relaxed">
                  Confirme para assumir o alerta e movê-lo para seus atendimentos em andamento.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {alertaConfirmacao ? (
            <div className="flex flex-col gap-3 px-5 py-4">
              <div className="overflow-hidden rounded-xl border bg-card shadow-xs ring-1 ring-foreground/5">
                <div className="border-l-4 border-[#5E17EB] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#3B2867] dark:text-white">
                        {alertaConfirmacao.maquinaNome}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{alertaConfirmacao.sensorNome}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                      <ClockIcon className="size-3.5" />
                      {tempoRelativo(getAlertDate(alertaConfirmacao))}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <SeveridadeBadge value={alertaConfirmacao.severidade} />
                    <StatusBadge status={alertaConfirmacao.status} />
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground">
                    {alertaConfirmacao.mensagem}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-between rounded-xl border bg-card px-4 py-3 text-left text-sm font-medium text-[#3B2867] shadow-xs transition-colors hover:border-[#5E17EB] hover:text-[#5E17EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E17EB]/30 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white dark:hover:text-purple-200"
                onClick={abrirDetalhesConfirmacao}
                disabled={Boolean(startingAlertId)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <AlertTriangleIcon className="size-4 shrink-0 text-[#5E17EB]" />
                  Ver detalhes antes de assumir
                </span>
                <ArrowRightIcon className="size-4 shrink-0" />
              </button>
            </div>
          ) : null}

          <DialogFooter className="mx-0 mb-0 rounded-none border-t bg-muted/35 p-4 sm:justify-end">
            <Button
              variant="outline"
              className="w-full cursor-pointer sm:w-auto"
              onClick={() => alternarConfirmacaoAtendimento(false)}
              disabled={Boolean(startingAlertId)}
            >
              Cancelar
            </Button>
            <Button
              className="w-full cursor-pointer sm:w-auto"
              onClick={() => alertaConfirmacao && iniciarAtendimento(alertaConfirmacao)}
              disabled={!alertaConfirmacao || Boolean(startingAlertId)}
            >
              {startingAlertId ? <Loader2Icon className="mr-1 size-4 animate-spin" /> : <WrenchIcon className="mr-1 size-4" />}
              Iniciar atendimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DashboardTour variant="tecnico" />
    </>
  )
}

function AdminDashboard() {
  return (
    <>
      <SiteHeader tourId="tour-header" />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="@container/main flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DashboardChartsProvider>
              <div id="tour-section-cards">
                <SectionCards />
              </div>

              <div id="tour-charts-main" className="flex min-w-0 flex-col gap-4 lg:gap-6 xl:flex-row xl:gap-0">
                <div className="w-full min-w-0 px-4 lg:px-6 xl:w-4/6">
                  <ChartAreaInteractive />
                </div>
                <ChartRadarDots className="mx-4 flex w-auto flex-col lg:mx-6 xl:mx-0 xl:mr-6 xl:w-2/6" />
              </div>

              <div
                id="tour-charts-secondary"
                className="flex w-full flex-col gap-4 px-4 lg:gap-6 lg:px-6 xl:flex-row"
              >
                <ChartPieDonut className="w-full xl:w-1/3" />
                <ChartBarStacked />
              </div>

            </DashboardChartsProvider>
          </div>
        </div>
      </div>

      <DashboardTour />
    </>
  )
}

export default function Page() {
  const permissions = useDashboardPermissions()

  if (permissions.isTecnico && !permissions.isAdmin) {
    return <TechnicianDashboard />
  }

  return <AdminDashboard />
}
