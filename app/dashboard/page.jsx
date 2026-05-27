"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  ClipboardListIcon,
  GaugeIcon,
  Loader2Icon,
  WrenchIcon,
  WashingMachineIcon,
  NfcIcon,
} from "lucide-react"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DashboardChartsProvider } from "@/components/context/dashboard-charts-context"
import { useAlertas } from "@/components/context/alertas-context"
import { useMaquinas } from "@/components/context/maquinas-context"
import { useSensores } from "@/components/context/sensores-context"
import { useTecnicos } from "@/components/context/tecnicos-context"
import { RefreshTooltipButton } from "@/components/refresh-tooltip-button"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
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

const TIPO_ALERTA_LABEL = {
  LIMITE_ULTRAPASSADO: "Limite ultrapassado",
  TENDENCIA_CURTA: "Tendência curta",
  TENDENCIA_LONGA: "Tendência longa",
  DEGRADACAO_ACELERADA: "Degradação acelerada",
  INSTABILIDADE: "Instabilidade",
}

const MACHINE_ALERT_STATUS_BADGE_CLASS = {
  COM_ALERTA: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
  EM_ANDAMENTO: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300",
}

const MACHINE_ALERT_STATUS_LABEL = {
  COM_ALERTA: "Com alerta",
  EM_ANDAMENTO: "Em andamento",
}

const ATENDIMENTOS_CONCLUIDOS_PAGE_SIZE = 3

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

function getInitials(value) {
  return String(value ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "T"
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

function useMediaQuery(query) {
  const [matches, setMatches] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handleChange = () => setMatches(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener("change", handleChange)

    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [query])

  return matches
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

function getTecnicoResponsavel(alerta, tecnicos, usuario) {
  if (!alerta) {
    return null
  }

  const byId = alerta.tecnicoId !== null && alerta.tecnicoId !== undefined
    ? tecnicos.find((tecnico) => String(tecnico.id) === String(alerta.tecnicoId))
    : null

  if (byId) {
    return byId
  }

  const alertaTecnicoNome = normalizeText(alerta.tecnicoNome)
  const byName = alertaTecnicoNome
    ? tecnicos.find((tecnico) => normalizeText(tecnico.nome) === alertaTecnicoNome)
    : null

  if (byName) {
    return byName
  }

  if (isAlertAssignedToUser(alerta, usuario)) {
    return {
      id: usuario?.id ?? alerta.tecnicoId ?? null,
      nome: usuario?.nome || alerta.tecnicoNome || "Técnico responsável",
      email: usuario?.email || "",
      telefone: usuario?.telefone || "",
      especialidade: usuario?.especialidade || "Sem especialidade informada",
      status: "ATIVO",
      alertasAtendidos: 0,
      criadoEm: "",
      foto: usuario?.fotoPerfil || null,
    }
  }

  if (alerta.tecnicoNome || alerta.tecnicoId) {
    return {
      id: alerta.tecnicoId ?? null,
      nome: alerta.tecnicoNome || `Técnico ${alerta.tecnicoId}`,
      email: "",
      telefone: "",
      especialidade: "Dados do técnico não encontrados",
      status: "ATIVO",
      alertasAtendidos: 0,
      criadoEm: "",
      foto: null,
    }
  }

  return null
}

function MetricCard({ icon: Icon, label, value, sub, badge, tone = "purple", featured = false, onClick }) {
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

  function handleKeyDown(event) {
    if (!onClick || (event.key !== "Enter" && event.key !== " ")) {
      return
    }

    event.preventDefault()
    onClick()
  }

  return (
    <Card
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`${technicianCardClass} ${onClick ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E17EB]/40" : ""} ${featured ? "border-[#5E17EB]! border-2" : ""}`}
    >
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

function TipoAlertaBadge({ value }) {
  return (
    <Badge variant="outline" className="border-purple-200 bg-purple-50 px-1.5 font-normal text-[#3B2867] dark:border-primary/40 dark:bg-primary/10 dark:text-purple-200">
      {TIPO_ALERTA_LABEL[value] ?? value ?? "Alerta"}
    </Badge>
  )
}

function OcorrenciasBadge({ value }) {
  const count = Math.max(Number(value) || 1, 1)

  return (
    <Badge variant="outline" className="border-slate-200 bg-slate-50 px-1.5 font-normal text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
      {count} ocorr.
    </Badge>
  )
}

function TecnicoResponsavelCard({ tecnico, compact = false }) {
  if (!tecnico) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 p-3 text-sm text-muted-foreground">
        Nenhum técnico responsável informado.
      </div>
    )
  }

  return (
    <div className={`rounded-xl border bg-card shadow-xs ring-1 ring-foreground/5 dark:border-gray-700! dark:bg-[#0F172A] ${compact ? "p-3" : "p-4"}`}>
      <div className="flex min-w-0 items-start gap-3">
        <Avatar className={compact ? "size-10" : "size-12"}>
          <AvatarImage src={tecnico.foto || undefined} alt={tecnico.nome} />
          <AvatarFallback className="bg-purple-100 font-semibold text-purple-700 dark:bg-primary/20 dark:text-primary-foreground">
            {getInitials(tecnico.nome)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#3B2867] dark:text-white">{tecnico.nome}</p>
              <p className="truncate text-xs text-muted-foreground">{tecnico.especialidade || "Sem especialidade informada"}</p>
            </div>
            <Badge variant="outline" className="border-green-200 bg-green-50 px-1.5 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300">
              Responsável
            </Badge>
          </div>
          {!compact ? (
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <div className="min-w-0 rounded-lg border bg-muted/25 px-2.5 py-2">
                <span className="text-muted-foreground">E-mail</span>
                <p className="truncate font-medium text-foreground">{tecnico.email || "Não informado"}</p>
              </div>
              <div className="min-w-0 rounded-lg border bg-muted/25 px-2.5 py-2">
                <span className="text-muted-foreground">Telefone</span>
                <p className="truncate font-medium text-foreground">{tecnico.telefone || "Não informado"}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
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

function AlertListItem({ alerta, onOpen }) {
  return (
    <button
      type="button"
      className="group flex min-h-[116px] w-full cursor-pointer flex-col justify-between rounded-xl border bg-card p-3 text-left shadow-xs ring-1 ring-foreground/5 transition-colors hover:border-[#5E17EB] hover:ring-[#5E17EB]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E17EB]/30 dark:border-gray-700! dark:bg-[#0F172A]"
      onClick={() => onOpen(alerta)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold leading-tight text-[#3B2867] dark:text-white">{alerta.maquinaNome}</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{alerta.sensorNome}</p>
        </div>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-[#5E17EB]" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <TipoAlertaBadge value={alerta.tipo} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={alerta.status} />
          <OcorrenciasBadge value={alerta.ocorrencias} />
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ClockIcon className="size-3.5" />
          {tempoRelativo(getAlertDate(alerta))}
        </span>
      </div>
    </button>
  )
}

function PriorityAlertCard({ alerta, imageSrc, onOpen }) {
  return (
    <div className="flex min-h-[150px] flex-col gap-4 rounded-xl border bg-card p-3 shadow-xs ring-1 ring-foreground/5 transition-colors hover:border-[#5E17EB]/70 sm:min-h-[132px] sm:flex-row sm:items-center dark:border-gray-700! dark:bg-[#0F172A]">
      <div className="flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-slate-300 bg-slate-400 text-sm font-medium text-slate-950 shadow-inner sm:size-[116px]">
        {imageSrc ? (
          <img src={imageSrc} alt="" className="size-full object-cover" />
        ) : (
          <span>FOTO</span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col  gap-2 justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold leading-tight text-[#3B2867] dark:text-white">{alerta.maquinaNome}</p>
              <p className="mt-1 truncate text-sm text-muted-foreground">{alerta.sensorNome}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
              <ClockIcon className="size-4" />
              {tempoRelativo(getAlertDate(alerta))}
            </span>
          </div>
        </div>



        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <TipoAlertaBadge value={alerta.tipo} />
            <StatusBadge status={alerta.status} />
            <OcorrenciasBadge value={alerta.ocorrencias} />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer rounded-full border-[#8B00FF] px-5 text-[#7C00FF] hover:border-[#7C00FF] hover:bg-[#7C00FF]/10 hover:text-[#6B00E8]"
            onClick={() => onOpen(alerta)}
          >
            Ver Detalhes &gt;
          </Button>
        </div>
      </div>
    </div>
  )
}

function MachineAttentionItem({ item, onOpen }) {
  const tecnico = item.tecnicoResponsavel

  return (
    <button
      type="button"
      className="group flex min-h-[148px] cursor-pointer flex-col justify-between gap-3 rounded-xl border bg-card/80 p-3 text-left shadow-xs ring-1 ring-foreground/5 transition-colors hover:border-[#5E17EB] hover:ring-[#5E17EB]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E17EB]/30 dark:border-gray-700! dark:bg-[#0F172A]"
      onClick={() => onOpen(item)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#3B2867] dark:text-white">{item.maquinaNome}</p>
          <p className="text-xs text-muted-foreground">{item.sensores.size} sensor(es) em atendimento</p>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={`px-1.5 ${MACHINE_ALERT_STATUS_BADGE_CLASS[item.statusMaquina] ?? MACHINE_ALERT_STATUS_BADGE_CLASS.COM_ALERTA}`}>
              {MACHINE_ALERT_STATUS_LABEL[item.statusMaquina] ?? "Com alerta"}
            </Badge>
            <SeveridadeBadge value={item.severidade} />
          </div>
          <ChevronRightIcon className="mt-0.5 size-4 text-muted-foreground transition-colors group-hover:text-[#5E17EB]" />
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/25 px-2.5 py-2">
        <Avatar className="size-8">
          <AvatarImage src={tecnico?.foto || undefined} alt={tecnico?.nome || "Técnico responsável"} />
          <AvatarFallback className="bg-purple-100 text-xs font-semibold text-purple-700 dark:bg-primary/20 dark:text-primary-foreground">
            {getInitials(tecnico?.nome || item.tecnicoNome)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">{tecnico?.nome || item.tecnicoNome || "Responsável não informado"}</p>
          <p className="truncate text-[11px] text-muted-foreground">{tecnico?.especialidade || "Técnico responsável pelo atendimento"}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{item.total} alerta(s)</span>
        <span>{tempoRelativo(item.ultimaOcorrenciaEm)}</span>
      </div>
    </button>
  )
}

function DashboardShortcuts({ id = "dashboard-shortcuts" }) {
  const router = useRouter()

  return (
    <section id={id} className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <Button variant="outline" className="h-auto cursor-pointer justify-between p-4" onClick={() => router.push("/dashboard/alertas")}>
        <span className="flex items-center gap-2">
          <AlertTriangleIcon className="size-4 text-[#5E17EB]" />
          Alertas em aberto
        </span>
        <ArrowRightIcon className="size-4" />
      </Button>
      <Button variant="outline" className="h-auto cursor-pointer justify-between p-4" onClick={() => router.push("/dashboard/maquinas")}>
        <span className="flex items-center gap-2">
          <WashingMachineIcon className="size-4 text-[#5E17EB]" />
          Máquinas
        </span>
        <ArrowRightIcon className="size-4" />
      </Button>
      <Button variant="outline" className="h-auto cursor-pointer justify-between p-4" onClick={() => router.push("/dashboard/sensores")}>
        <span className="flex items-center gap-2">
          <NfcIcon className="size-4 text-[#5E17EB]" />
          Sensores
        </span>
        <ArrowRightIcon className="size-4" />
      </Button>
    </section>
  )
}

function TechnicianDashboard() {
  const router = useRouter()
  const usuario = getAuthSessionUser()
  const isMobileDrawer = useMediaQuery("(max-width: 640px)")
  const {
    alertas,
    status: alertasStatus,
    salvando,
    atualizarStatus,
    recarregarAlertas,
  } = useAlertas()
  const { maquinas, status: maquinasStatus, recarregarMaquinas } = useMaquinas()
  const { sensores, status: sensoresStatus, recarregarSensores } = useSensores()
  const { tecnicos } = useTecnicos()
  const [startingAlertId, setStartingAlertId] = React.useState(null)
  const [completingAlertId, setCompletingAlertId] = React.useState(null)
  const [alertaSelecionado, setAlertaSelecionado] = React.useState(null)
  const [atendimentosIniciados, setAtendimentosIniciados] = React.useState(() => new Set())
  const [highlightedSection, setHighlightedSection] = React.useState("")
  const [paginaConcluidos, setPaginaConcluidos] = React.useState(0)
  const highlightTimerRef = React.useRef(null)

  const loading = alertasStatus === "loading" || maquinasStatus === "loading" || sensoresStatus === "loading"
  const atendimentoActionPending = Boolean(startingAlertId || completingAlertId)
  const alertasAtivos = React.useMemo(() => alertas.filter((alerta) => alerta.status === "ATIVO"), [alertas])
  const alertasEmAndamento = React.useMemo(() => alertas.filter((alerta) => alerta.status === "EM_ANDAMENTO"), [alertas])
  const meusAtendimentos = React.useMemo(
    () => alertasEmAndamento
      .filter((alerta) => isAlertAssignedToUser(alerta, usuario) || atendimentosIniciados.has(alerta.id))
      .sort(sortByPriority),
    [alertasEmAndamento, atendimentosIniciados, usuario]
  )
  const atendimentosDeOutrosTecnicos = React.useMemo(
    () => alertasEmAndamento
      .filter((alerta) => !isAlertAssignedToUser(alerta, usuario) && !atendimentosIniciados.has(alerta.id))
      .sort(sortByPriority),
    [alertasEmAndamento, atendimentosIniciados, usuario]
  )
  const alertasPrioritarios = React.useMemo(
    () => [...alertasAtivos].sort(sortByPriority).slice(0, 5),
    [alertasAtivos]
  )
  const atendimentosConcluidos = React.useMemo(
    () => alertas
      .filter((alerta) => alerta.status === "RESOLVIDO" && (isAlertAssignedToUser(alerta, usuario) || atendimentosIniciados.has(alerta.id)))
      .sort((a, b) => getAlertTimestamp(b) - getAlertTimestamp(a)),
    [alertas, atendimentosIniciados, usuario]
  )
  const atendimentosConcluidosHoje = React.useMemo(
    () => atendimentosConcluidos.filter((alerta) => isToday(alerta.atualizadoEm || alerta.ultimaOcorrenciaEm || alerta.criadoEm)),
    [atendimentosConcluidos]
  )
  const totalPaginasConcluidos = Math.max(Math.ceil(atendimentosConcluidosHoje.length / ATENDIMENTOS_CONCLUIDOS_PAGE_SIZE), 1)
  const paginaConcluidosAtual = Math.min(paginaConcluidos, totalPaginasConcluidos - 1)
  const atendimentosConcluidosPaginados = React.useMemo(() => {
    const start = paginaConcluidosAtual * ATENDIMENTOS_CONCLUIDOS_PAGE_SIZE

    return atendimentosConcluidosHoje.slice(start, start + ATENDIMENTOS_CONCLUIDOS_PAGE_SIZE)
  }, [atendimentosConcluidosHoje, paginaConcluidosAtual])
  const imagensMaquinas = React.useMemo(() => {
    const map = new Map()

    for (const maquina of maquinas) {
      const image = maquina.imagem || maquina.caminhoImagem

      if (!image) {
        continue
      }

      if (maquina.id !== null && maquina.id !== undefined) {
        map.set(`id:${String(maquina.id)}`, image)
      }

      if (maquina.nome) {
        map.set(`nome:${normalizeText(maquina.nome)}`, image)
      }
    }

    return map
  }, [maquinas])
  const maquinasEmAndamento = React.useMemo(() => {
    const grouped = new Map()

    for (const alerta of atendimentosDeOutrosTecnicos) {
      const key = String(alerta.maquinaId ?? alerta.maquinaNome)
      const tecnicoResponsavel = getTecnicoResponsavel(alerta, tecnicos, usuario)
      const existing = grouped.get(key) ?? {
        maquinaId: alerta.maquinaId,
        maquinaNome: alerta.maquinaNome,
        sensores: new Set(),
        total: 0,
        statusMaquina: "EM_ANDAMENTO",
        severidade: alerta.severidade,
        ultimaOcorrenciaEm: getAlertDate(alerta),
        alertas: [],
        tecnicoResponsavel,
        tecnicoNome: tecnicoResponsavel?.nome || alerta.tecnicoNome,
      }

      existing.total += 1
      existing.sensores.add(alerta.sensorNome)
      existing.alertas.push(alerta)

      if ((SEVERIDADE_ORDEM[alerta.severidade] ?? 0) > (SEVERIDADE_ORDEM[existing.severidade] ?? 0)) {
        existing.severidade = alerta.severidade
      }

      if (getAlertTimestamp(alerta) > Date.parse(existing.ultimaOcorrenciaEm || "")) {
        existing.ultimaOcorrenciaEm = getAlertDate(alerta)
        existing.tecnicoResponsavel = tecnicoResponsavel
        existing.tecnicoNome = tecnicoResponsavel?.nome || alerta.tecnicoNome
      }

      grouped.set(key, existing)
    }

    return Array.from(grouped.values()).sort((a, b) => {
      const severityDiff = (SEVERIDADE_ORDEM[b.severidade] ?? 0) - (SEVERIDADE_ORDEM[a.severidade] ?? 0)
      return severityDiff || Date.parse(b.ultimaOcorrenciaEm || "") - Date.parse(a.ultimaOcorrenciaEm || "")
    }).slice(0, 6)
  }, [atendimentosDeOutrosTecnicos, tecnicos, usuario])
  const sensoresOffline = React.useMemo(() => sensores.filter((sensor) => sensor.status === "OFFLINE").length, [sensores])
  const tecnicoAlertaSelecionado = React.useMemo(
    () => getTecnicoResponsavel(alertaSelecionado, tecnicos, usuario),
    [alertaSelecionado, tecnicos, usuario]
  )

  React.useEffect(() => {
    setPaginaConcluidos((current) => Math.min(current, totalPaginasConcluidos - 1))
  }, [totalPaginasConcluidos])

  React.useEffect(() => {
    return () => {
      window.clearTimeout(highlightTimerRef.current)
    }
  }, [])

  function getHighlightedPanelClass(baseClass, sectionId) {
    const highlightClass =
      "ring-2 ring-[#5E17EB]/70 shadow-[0_0_0_4px_rgba(94,23,235,0.14),0_0_32px_rgba(94,23,235,0.38)]"

    return `${baseClass} scroll-mt-24 transition-[box-shadow,border-color,transform] duration-500 ${
      highlightedSection === sectionId ? highlightClass : ""
    }`
  }

  function focarSecaoTecnico(sectionId) {
    const section = document.getElementById(sectionId)

    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "center" })
    }

    window.clearTimeout(highlightTimerRef.current)
    setHighlightedSection(sectionId)
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedSection("")
    }, 1800)
  }

  function getAlertaMaquinaImagem(alerta) {
    if (alerta?.maquinaId !== null && alerta?.maquinaId !== undefined) {
      const byId = imagensMaquinas.get(`id:${String(alerta.maquinaId)}`)

      if (byId) {
        return byId
      }
    }

    return imagensMaquinas.get(`nome:${normalizeText(alerta?.maquinaNome)}`) || ""
  }

  async function refreshAll() {
    await Promise.allSettled([recarregarAlertas(), recarregarMaquinas(), recarregarSensores()])
  }

  function abrirAlerta(alerta) {
    setAlertaSelecionado(alerta)
  }

  function abrirMaquina(item) {
    const alerta = item?.alertas?.[0]

    if (alerta) {
      setAlertaSelecionado(alerta)
      return
    }

    router.push(`/dashboard/alertas?maquina=${encodeURIComponent(item.maquinaNome)}`)
  }

  function alternarDetalhesAtendimento(open) {
    if (!open && !atendimentoActionPending) {
      setAlertaSelecionado(null)
    }
  }

  function podeConcluirAtendimento(alerta) {
    return (
      alerta?.status === "EM_ANDAMENTO" &&
      (isAlertAssignedToUser(alerta, usuario) || atendimentosIniciados.has(alerta.id))
    )
  }

  async function iniciarAtendimento(alerta) {
    try {
      setStartingAlertId(alerta.id)
      await atualizarStatus(alerta.id, "EM_ANDAMENTO")
      setAtendimentosIniciados((current) => new Set(current).add(alerta.id))
      setAlertaSelecionado(null)
      toast.success("Atendimento iniciado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar o atendimento.")
    } finally {
      setStartingAlertId(null)
    }
  }

  async function concluirAtendimento(alerta) {
    if (!podeConcluirAtendimento(alerta)) {
      toast.error("Este atendimento nao esta vinculado ao seu usuario.")
      return
    }

    try {
      setCompletingAlertId(alerta.id)
      await atualizarStatus(alerta.id, "RESOLVIDO")
      setAtendimentosIniciados((current) => new Set(current).add(alerta.id))
      setAlertaSelecionado(null)
      toast.success("Atendimento concluido.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel concluir o atendimento.")
    } finally {
      setCompletingAlertId(null)
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

        <div id="tour-technician-metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard icon={ClipboardListIcon} label="Pendentes" value={alertasAtivos.length} sub="Disponíveis para iniciar" badge="Aguardando" tone="red" featured onClick={() => focarSecaoTecnico("tour-technician-priority")} />
          <MetricCard icon={WrenchIcon} label="Minha fila" value={meusAtendimentos.length} sub="Alertas assumidos por você" badge="Sua fila" tone="purple" onClick={() => focarSecaoTecnico("tour-technician-active")} />
          <MetricCard icon={ClockIcon} label="Em andamento" value={atendimentosDeOutrosTecnicos.length} sub="Atendimentos de outros técnicos" badge="Equipe" tone="yellow" onClick={() => focarSecaoTecnico("tour-technician-machines")} />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <section id="tour-technician-priority" className={getHighlightedPanelClass(technicianPriorityPanelClass, "tour-technician-priority")}>
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
                  <PriorityAlertCard
                    key={alerta.id}
                    alerta={alerta}
                    imageSrc={getAlertaMaquinaImagem(alerta)}
                    onOpen={abrirAlerta}
                  />
                ))
              ) : (
                <EmptyPanel title="Sem alertas pendentes" description="Quando novos alertas forem gerados, eles aparecem aqui para atendimento." />
              )}
            </div>
          </section>

          <div className="flex flex-col gap-4">
            <section id="tour-technician-active" className={getHighlightedPanelClass(technicianPanelClass, "tour-technician-active")}>
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
                    />
                  ))
                ) : (
                  <EmptyPanel title="Nenhum atendimento em andamento" description="Ao iniciar um alerta, ele passa a aparecer nesta lista." />
                )}
              </div>
            </section>

            <section id="tour-technician-completed" className={getHighlightedPanelClass(technicianPanelClass, "tour-technician-completed")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[#3B2867] dark:text-white">Atendimentos concluídos</h2>
                  <p className="text-sm text-muted-foreground">Alertas resolvidos por você hoje.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300">
                    {atendimentosConcluidosHoje.length} hoje
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => router.push("/dashboard/perfil?tab=minha-atividade")}
                  >
                    Ver todos
                    <ArrowRightIcon className="ml-1 size-4" />
                  </Button>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex flex-col gap-3">
                {atendimentosConcluidosHoje.length > 0 ? (
                  atendimentosConcluidosPaginados.map((alerta) => (
                    <AlertListItem
                      key={alerta.id}
                      alerta={alerta}
                      onOpen={abrirAlerta}
                    />
                  ))
                ) : (
                  <EmptyPanel title="Nenhum atendimento concluído hoje" description="Seu histórico completo fica em Perfil > Minha atividade." />
                )}
              </div>
              {atendimentosConcluidosHoje.length > ATENDIMENTOS_CONCLUIDOS_PAGE_SIZE ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                  <span className="text-sm text-muted-foreground">
                    Pag. {paginaConcluidosAtual + 1} de {totalPaginasConcluidos}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8 cursor-pointer"
                      onClick={() => setPaginaConcluidos((current) => Math.max(current - 1, 0))}
                      disabled={paginaConcluidosAtual === 0}
                    >
                      <ChevronLeftIcon className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8 cursor-pointer"
                      onClick={() => setPaginaConcluidos((current) => Math.min(current + 1, totalPaginasConcluidos - 1))}
                      disabled={paginaConcluidosAtual >= totalPaginasConcluidos - 1}
                    >
                      <ChevronRightIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
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

          <section id="tour-technician-machines" className={getHighlightedPanelClass(technicianPanelClass, "tour-technician-machines")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[#3B2867] dark:text-white">Em andamento</h2>
                  <p className="text-sm text-muted-foreground">Atendimentos de outros técnicos da equipe.</p>
                </div>
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => router.push("/dashboard/maquinas")}>
                Ver máquinas
              </Button>
            </div>
            <Separator className="my-4" />
            {maquinasEmAndamento.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {maquinasEmAndamento.map((item) => (
                  <MachineAttentionItem key={`${item.maquinaId ?? item.maquinaNome}`} item={item} onOpen={abrirMaquina} />
                ))}
              </div>
            ) : (
              <EmptyPanel title="Nenhum atendimento de outros técnicos" description="Quando a equipe assumir novos atendimentos, eles aparecem aqui." />
            )}
          </section>
        </div>

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

      <Drawer direction={isMobileDrawer ? "bottom" : "right"} open={Boolean(alertaSelecionado)} onOpenChange={alternarDetalhesAtendimento}>
        <DrawerContent className="overflow-hidden bg-background data-[vaul-drawer-direction=bottom]:max-h-[92dvh] data-[vaul-drawer-direction=right]:w-[min(620px,calc(100vw-1rem))] data-[vaul-drawer-direction=right]:max-w-xl">
          {alertaSelecionado ? (
            <>
              <DrawerHeader className="border-b px-5 py-5 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <DrawerTitle className="truncate text-lg font-semibold text-[#3B2867] dark:text-white">
                      {alertaSelecionado.maquinaNome}
                    </DrawerTitle>
                    <DrawerDescription className="mt-1">{alertaSelecionado.sensorNome}</DrawerDescription>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                    <ClockIcon className="size-3.5" />
                    {tempoRelativo(getAlertDate(alertaSelecionado))}
                  </span>
                </div>
              </DrawerHeader>

              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
                <div className="rounded-xl border bg-card p-4 shadow-xs ring-1 ring-foreground/5">
                  <div className="flex flex-wrap items-center gap-2">
                    <TipoAlertaBadge value={alertaSelecionado.tipo} />
                    <StatusBadge status={alertaSelecionado.status} />
                    <SeveridadeBadge value={alertaSelecionado.severidade} />
                    <OcorrenciasBadge value={alertaSelecionado.ocorrencias} />
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-foreground">
                    {alertaSelecionado.mensagem}
                  </p>
                </div>

                {alertaSelecionado.status === "EM_ANDAMENTO" || tecnicoAlertaSelecionado ? (
                  <TecnicoResponsavelCard tecnico={tecnicoAlertaSelecionado} />
                ) : null}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border bg-card p-3 shadow-xs">
                    <span className="text-xs text-muted-foreground">Última ocorrência</span>
                    <p className="mt-1 text-sm font-semibold text-[#3B2867] dark:text-white">
                      {tempoRelativo(getAlertDate(alertaSelecionado))}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-card p-3 shadow-xs">
                    <span className="text-xs text-muted-foreground">Ocorrências</span>
                    <p className="mt-1 text-sm font-semibold text-[#3B2867] dark:text-white">
                      {Math.max(Number(alertaSelecionado.ocorrencias) || 1, 1)}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-card p-3 shadow-xs">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <p className="mt-1 text-sm font-semibold text-[#3B2867] dark:text-white">
                      {STATUS_LABEL[alertaSelecionado.status] ?? alertaSelecionado.status}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-card p-3 shadow-xs">
                    <span className="text-xs text-muted-foreground">Severidade</span>
                    <p className="mt-1 text-sm font-semibold text-[#3B2867] dark:text-white">
                      {alertaSelecionado.severidade ? alertaSelecionado.severidade.charAt(0) + alertaSelecionado.severidade.slice(1).toLowerCase() : "Média"}
                    </p>
                  </div>
                </div>
              </div>

              <DrawerFooter className="border-t bg-muted/35 p-4">
                {alertaSelecionado.status === "ATIVO" ? (
                  <Button
                    className="w-full cursor-pointer"
                    onClick={() => iniciarAtendimento(alertaSelecionado)}
                    disabled={atendimentoActionPending || salvando}
                  >
                    {startingAlertId === alertaSelecionado.id ? <Loader2Icon className="mr-1 size-4 animate-spin" /> : <WrenchIcon className="mr-1 size-4" />}
                    Iniciar atendimento
                  </Button>
                ) : podeConcluirAtendimento(alertaSelecionado) ? (
                  <Button
                    className="w-full cursor-pointer bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                    onClick={() => concluirAtendimento(alertaSelecionado)}
                    disabled={atendimentoActionPending || salvando}
                  >
                    {completingAlertId === alertaSelecionado.id ? <Loader2Icon className="mr-1 size-4 animate-spin" /> : <CheckCircle2Icon className="mr-1 size-4" />}
                    Concluir atendimento
                  </Button>
                ) : (
                  <Button className="w-full" disabled>
                    {alertaSelecionado.status === "RESOLVIDO" ? "Atendimento concluído" : "Atendimento em andamento"}
                  </Button>
                )}
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full cursor-pointer" disabled={atendimentoActionPending || salvando}>
                    Fechar
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          ) : null}
        </DrawerContent>
      </Drawer>

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

              <div className="px-4 lg:px-6">
                <DashboardShortcuts />
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
