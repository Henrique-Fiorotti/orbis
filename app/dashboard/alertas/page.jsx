"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { useAlertas } from "@/components/context/alertas-context"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MetricValue, useDashboardMetricsLoading } from "@/components/animated-metric"
import { RefreshTooltipButton } from "@/components/refresh-tooltip-button"
import { SiteHeader } from "@/components/site-header"
import {
  AlertTriangleIcon,
  ClockIcon,
  CircleHelpIcon,
  EllipsisVerticalIcon,
  ArrowLeftIcon,
  EyeIcon,
  HistoryIcon,
  Loader2Icon,
  MessageSquareTextIcon,
  RotateCcwIcon,
  SearchIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
  CircleCheckIcon,
  CircleXIcon,
  RefreshCcwIcon,
  ShieldAlertIcon,
  WrenchIcon,
} from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { runAfterCurrentOverlayCloses } from "@/lib/deferred-ui"
import { getAuthSession } from "@/lib/auth-session"
import { groupAlertasByMaquina } from "@/lib/alertas-grouping"
import { extractCollection, requestDashboardJson } from "@/lib/dashboard-api"
import { tempoRelativo } from "@/lib/utils"

const TIPOS_ALERTA = ["LIMITE_ULTRAPASSADO", "TENDENCIA_CURTA", "TENDENCIA_LONGA", "DEGRADACAO_ACELERADA", "INSTABILIDADE"]
const TIPOS_ALERTA_LABEL = {
  LIMITE_ULTRAPASSADO: "Limite Ultrapassado",
  TENDENCIA_CURTA: "Tendência Curta",
  TENDENCIA_LONGA: "Tendência Longa",
  DEGRADACAO_ACELERADA: "Degradação Acelerada",
  INSTABILIDADE: "Instabilidade",
}

const TIPOS_ALERTA_HELP = {
  LIMITE_ULTRAPASSADO: "Alguma leitura passou do limite seguro configurado.",
  TENDENCIA_CURTA: "A leitura mudou rápido e pode exigir atenção em breve.",
  TENDENCIA_LONGA: "A leitura vem piorando de forma gradual ao longo do tempo.",
  DEGRADACAO_ACELERADA: "O equipamento está perdendo estabilidade mais rápido que o esperado.",
  INSTABILIDADE: "As leituras estão oscilando fora do padrão ideal.",
}

const SEVERIDADE_HELP = {
  ALTA: "A gravidade do problema é alta e pede prioridade.",
  MEDIA: "A gravidade é moderada e deve ser acompanhada.",
  BAIXA: "A gravidade é baixa, com menor risco imediato.",
}

const STATUS_ALERTA_LABEL = {
  ATIVO: "Em aberto",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDO: "Resolvido",
  CANCELADO: "Cancelado",
}

const EVENTO_STATUS_LABEL = {
  ATIVO: "Em aberto",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDO: "Resolvido",
  CANCELADO: "Cancelado",
  ENCERRADO_SEM_SOLUCAO: "Sem solucao",
}

const EVENTOS_COM_MANUTENCAO = new Set(["ACEITO", "ATUALIZADO", "REABERTO", "RESOLVIDO", "CANCELADO"])

const formVazio = {
  tipo: "LIMITE_ULTRAPASSADO",
  maquinaId: "",
  maquinaNome: "",
  sensorId: "",
  sensorNome: "",
  severidade: "MEDIA",
  mensagem: "",
}

function SeveridadeBadge({ value }) {
  const styles = {
    ALTA: "bg-red-100 text-red-700 border-red-200 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
    MEDIA: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300",
    BAIXA: "bg-green-100 text-green-700 border-green-200 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300",
  }

  return (
    <Badge variant="outline" className={`px-1.5 ${styles[value]}`}>
      {value.charAt(0) + value.slice(1).toLowerCase()}
    </Badge>
  )
}

function StatusAlertaBadge({ value }) {
  const cfg = {
    ATIVO: {
      cls: "bg-red-50 text-red-700 border-red-200 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
      Icon: ShieldAlertIcon,
    },
    EM_ANDAMENTO: {
      cls: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300",
      Icon: AlertTriangleIcon,
    },
    RESOLVIDO: {
      cls: "bg-green-50 text-green-700 border-green-200 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300",
      Icon: CircleCheckIcon,
    },
    CANCELADO: {
      cls: "bg-gray-100 text-gray-500 border-gray-200 dark:border-border dark:bg-muted/30 dark:text-muted-foreground",
      Icon: CircleXIcon,
    },
  }
  const { cls, Icon } = cfg[value] ?? cfg.ATIVO

  return (
    <Badge variant="outline" className={`px-1.5 ${cls}`}>
      <Icon className="mr-1 size-3" />
      {STATUS_ALERTA_LABEL[value] ?? value}
    </Badge>
  )
}

function TipoAlertaBadge({ value }) {
  return (
    <Badge variant="outline" className="border-purple-200 bg-purple-50 px-1.5 text-xs font-normal text-[#3B2867] dark:border-primary/40 dark:bg-primary/10 dark:text-primary-foreground">
      {TIPOS_ALERTA_LABEL[value] ?? value}
    </Badge>
  )
}

function HelpTooltip({ label, content }) {
  if (!content) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          tabIndex={0}
          aria-label={label}
          className="inline-flex size-4 cursor-help items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-[#5E17EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E17EB]/40"
        >
          <CircleHelpIcon className="size-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="max-w-56 text-left leading-relaxed">
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

function FieldLabelWithHelp({ children, help, helpLabel }) {
  return (
    <div className="flex items-center gap-1.5">
      <Label className="text-xs text-muted-foreground">{children}</Label>
      <HelpTooltip label={helpLabel} content={help} />
    </div>
  )
}

function isStatusAberto(status) {
  return status === "ATIVO" || status === "EM_ANDAMENTO"
}

function AlertaMetricCard({ label, value, badge, badgeClass = "", footer, icon: Icon, selected = false, featured = false, onClick }) {
  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onClick?.()
    }
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`@container/card cursor-pointer transition-colors hover:border-[#5E17EB]! hover:ring-[#5E17EB]/50 focus-visible:border-[#5E17EB]! focus-visible:ring-2 focus-visible:ring-[#5E17EB]/30 focus-visible:outline-none ${
        selected ? "border-[#5E17EB]! ring-2 ring-[#5E17EB]/30" : ""
      }`}
    >
      <CardHeader className="min-h-[76px]">
        <CardDescription className={featured ? "" : "text-black! dark:text-white!"}>{label}</CardDescription>
        <CardTitle className={`text-2xl font-semibold tabular-nums @[250px]/card:text-3xl ${featured ? "text-[#5E17EB]!" : ""}`}>
          {value}
        </CardTitle>
        <CardAction>
          <Badge variant="outline" className={badgeClass}>
            <Icon className="size-3.5" />
            {badge}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex items-center gap-2 font-medium">
          {footer}
          <Icon className="size-4" />
        </div>
      </CardFooter>
    </Card>
  )
}

function getUltimaOcorrencia(alerta) {
  return alerta.ultimaOcorrenciaEm || alerta.atualizadoEm || alerta.criadoEm
}

function getAlertaTimestamp(alerta) {
  const timestamp = Date.parse(getUltimaOcorrencia(alerta))
  return Number.isFinite(timestamp) ? timestamp : 0
}

function isAlertaRepetido(alerta) {
  return alerta?.duplicado === true && Number(alerta?.ocorrencias) > 1
}

function compareAlertaRecente(a, b) {
  return getAlertaTimestamp(b) - getAlertaTimestamp(a)
}

function normalizeUppercase(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
}

function normalizeDateValue(value) {
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString() : ""
}

function formatAbsoluteDate(value) {
  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) {
    return "Data nao informada"
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function formatTimeOnly(value) {
  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeStyle: "short",
  }).format(date)
}

function isSameLocalDate(firstValue, secondValue) {
  const firstDate = new Date(firstValue)
  const secondDate = new Date(secondValue)

  if (!Number.isFinite(firstDate.getTime()) || !Number.isFinite(secondDate.getTime())) {
    return false
  }

  return firstDate.toLocaleDateString("pt-BR") === secondDate.toLocaleDateString("pt-BR")
}

function formatTimelineDateRange(item) {
  if (!item.ultimoCriadoEm || item.ultimoCriadoEm === item.criadoEm) {
    return formatAbsoluteDate(item.criadoEm)
  }

  if (isSameLocalDate(item.criadoEm, item.ultimoCriadoEm)) {
    return `${formatAbsoluteDate(item.criadoEm)} - ${formatTimeOnly(item.ultimoCriadoEm)}`
  }

  return `${formatAbsoluteDate(item.criadoEm)} - ${formatAbsoluteDate(item.ultimoCriadoEm)}`
}

function getUsuarioResumo(source) {
  const usuario = source?.usuario ?? source?.tecnico ?? source?.responsavel

  if (usuario && typeof usuario === "object") {
    return {
      id: usuario.id ?? source?.usuarioId ?? source?.tecnicoId ?? null,
      nome: usuario.nome || usuario.name || "Tecnico nao informado",
      role: normalizeUppercase(usuario.role),
    }
  }

  return {
    id: source?.usuarioId ?? source?.tecnicoId ?? null,
    nome: source?.usuarioNome || source?.tecnicoNome || source?.nomeTecnico || "Tecnico nao informado",
    role: "",
  }
}

function getEventoUsuario(source) {
  if (source?.usuario && typeof source.usuario === "object") {
    return getUsuarioResumo(source)
  }

  if (source?.manutencao?.usuario && typeof source.manutencao.usuario === "object") {
    return getUsuarioResumo(source.manutencao)
  }

  const usuarioId = source?.usuarioId ?? source?.manutencao?.usuarioId

  if (usuarioId) {
    return {
      id: usuarioId,
      nome: source?.usuarioNome || source?.tecnicoNome || source?.manutencao?.usuarioNome || "Tecnico nao informado",
      role: "TECNICO",
    }
  }

  return { id: null, nome: "Sistema", role: "" }
}

function normalizeManutencao(item) {
  if (!item || typeof item !== "object") {
    return null
  }

  const id = Number(item.id ?? item.manutencaoId)
  const alertaId = Number(item.alertaId ?? item.alerta?.id)

  if (!Number.isFinite(id)) {
    return null
  }

  return {
    id,
    alertaId: Number.isFinite(alertaId) ? alertaId : null,
    usuario: getUsuarioResumo(item),
    observacao: String(item.observacao ?? item.descricao ?? "").trim(),
    status: normalizeUppercase(item.status || "EM_ANDAMENTO"),
    criadoEm: normalizeDateValue(item.criadoEm ?? item.createdAt ?? item.dataCriacao),
  }
}

function normalizeEventoAlerta(item) {
  if (!item || typeof item !== "object") {
    return null
  }

  const id = Number(item.id ?? item.eventoId)
  const manutencaoId = Number(item.manutencaoId ?? item.manutencao?.id)
  const alertaId = Number(item.alertaId ?? item.alerta?.id)
  const manutencao = item.manutencao ? normalizeManutencao(item.manutencao) : null

  return {
    id: Number.isFinite(id) ? id : null,
    alertaId: Number.isFinite(alertaId) ? alertaId : null,
    manutencaoId: Number.isFinite(manutencaoId) ? manutencaoId : null,
    manutencao,
    usuario: getEventoUsuario(item),
    tipo: normalizeUppercase(item.tipo),
    statusAnterior: normalizeUppercase(item.statusAnterior),
    statusNovo: normalizeUppercase(item.statusNovo ?? item.status),
    descricao: String(item.descricao ?? item.observacao ?? item.mensagem ?? "").trim(),
    mensagem: String(item.mensagem ?? "").trim(),
    criadoEm: normalizeDateValue(item.criadoEm ?? item.createdAt ?? item.dataCriacao),
  }
}

function extractEventosFromAlertaPayload(payload) {
  const candidates = [
    payload?.eventos,
    payload?.dados?.eventos,
    payload?.data?.eventos,
    payload?.resultado?.eventos,
  ]
  const eventos = candidates.find(Array.isArray)

  if (eventos) {
    return eventos
  }

  return extractCollection(payload)
}

function compareTimelineDate(a, b) {
  return (Date.parse(a.criadoEm) || 0) - (Date.parse(b.criadoEm) || 0)
}

function getManutencaoStatusTone(status) {
  if (status === "RESOLVIDO") {
    return "success"
  }

  if (status === "ENCERRADO_SEM_SOLUCAO" || status === "ATIVO" || status === "REABERTO") {
    return "warning"
  }

  return "active"
}

function getTimelineIcon(tipo) {
  if (tipo === "alerta") return ShieldAlertIcon
  if (tipo === "inicio") return WrenchIcon
  if (tipo === "encerramento") return CircleCheckIcon
  if (tipo === "cancelamento") return CircleXIcon
  if (tipo === "sem_solucao") return RotateCcwIcon
  return MessageSquareTextIcon
}

function createTimelineItem({ tipo, titulo, usuario, criadoEm, descricao, status, mensagem, manutencaoId = null }) {
  return {
    key: `${tipo}-${criadoEm || "sem-data"}-${titulo}-${descricao || ""}`,
    tipo,
    titulo,
    manutencaoId,
    usuario: usuario?.nome || "Sistema",
    criadoEm,
    descricao,
    mensagem,
    status,
    repeticoes: 1,
    ultimoCriadoEm: criadoEm,
  }
}

function normalizeTimelineText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase()
}

function getTimelineGroupKey(item) {
  return [
    item.tipo,
    item.manutencaoId ?? "sem-manutencao",
    item.titulo,
    item.usuario,
    item.status,
    normalizeTimelineText(item.descricao),
  ].join("|")
}

function compactRepeatedTimelineItems(items) {
  const groupedItems = []
  const groupedIndexes = new Map()

  for (const item of items) {
    const groupKey = getTimelineGroupKey(item)
    const existingIndex = groupedIndexes.get(groupKey)

    if (existingIndex !== undefined) {
      const existingItem = groupedItems[existingIndex]
      groupedItems[existingIndex] = {
        ...existingItem,
        key: `${existingItem.key}-x${existingItem.repeticoes + 1}`,
        repeticoes: existingItem.repeticoes + 1,
        ultimoCriadoEm: item.ultimoCriadoEm || item.criadoEm || existingItem.ultimoCriadoEm,
      }
      continue
    }

    groupedIndexes.set(groupKey, groupedItems.length)
    groupedItems.push(item)
  }

  return groupedItems
}

function getEventoDescricao(evento) {
  return evento.descricao || evento.manutencao?.observacao || evento.mensagem || ""
}

function getEventoStatus(evento) {
  if (evento.tipo === "REABERTO") return "ENCERRADO_SEM_SOLUCAO"
  if (evento.tipo === "ACEITO") return "EM_ANDAMENTO"
  return evento.statusNovo || evento.manutencao?.status || ""
}

function isEventoDeManutencao(evento) {
  return EVENTOS_COM_MANUTENCAO.has(evento.tipo) && Boolean(evento.manutencaoId || evento.manutencao)
}

function createTimelineItemFromEvento(evento) {
  if (evento.tipo === "CRIADO") {
    return createTimelineItem({
      tipo: "alerta",
      titulo: "Alerta aberto",
      usuario: evento.usuario,
      criadoEm: evento.criadoEm,
      descricao: getEventoDescricao(evento),
      status: evento.statusNovo || "ATIVO",
    })
  }

  if (evento.tipo === "ACEITO") {
    return createTimelineItem({
      tipo: "inicio",
      titulo: "Manutencao iniciada",
      usuario: evento.usuario,
      criadoEm: evento.criadoEm || evento.manutencao?.criadoEm,
      descricao: getEventoDescricao(evento),
      status: "EM_ANDAMENTO",
      manutencaoId: evento.manutencaoId,
    })
  }

  if (evento.tipo === "REABERTO") {
    return createTimelineItem({
      tipo: "sem_solucao",
      titulo: "Manutencao encerrada sem solucao",
      usuario: evento.usuario,
      criadoEm: evento.criadoEm,
      descricao: getEventoDescricao(evento),
      status: "ENCERRADO_SEM_SOLUCAO",
      manutencaoId: evento.manutencaoId,
    })
  }

  if (evento.tipo === "RESOLVIDO") {
    return createTimelineItem({
      tipo: "encerramento",
      titulo: "Manutencao encerrada",
      usuario: evento.usuario,
      criadoEm: evento.criadoEm,
      descricao: getEventoDescricao(evento),
      status: "RESOLVIDO",
      manutencaoId: evento.manutencaoId,
    })
  }

  if (evento.tipo === "CANCELADO") {
    return createTimelineItem({
      tipo: "cancelamento",
      titulo: "Alerta cancelado",
      usuario: evento.usuario,
      criadoEm: evento.criadoEm,
      descricao: getEventoDescricao(evento),
      status: "CANCELADO",
      manutencaoId: evento.manutencaoId,
    })
  }

  const isManutencao = isEventoDeManutencao(evento)

  return createTimelineItem({
    tipo: isManutencao ? "atualizacao" : "alerta_atualizado",
    titulo: isManutencao ? "Atualizacao da manutencao" : "Alerta atualizado",
    usuario: evento.usuario,
    criadoEm: evento.criadoEm,
    descricao: getEventoDescricao(evento),
    status: getEventoStatus(evento),
    manutencaoId: evento.manutencaoId,
  })
}

function buildHistoricoTimeline(alerta, eventos) {
  const eventosOrdenados = [...eventos].sort(compareTimelineDate)
  const items = eventosOrdenados
    .map(createTimelineItemFromEvento)
    .filter(Boolean)

  if (!items.some((item) => item.tipo === "alerta")) {
    items.unshift(createTimelineItem({
      tipo: "alerta",
      titulo: "Alerta aberto",
      usuario: { nome: "Sistema" },
      criadoEm: normalizeDateValue(alerta?.criadoEm),
      descricao: alerta?.mensagem,
      status: alerta?.status || "ATIVO",
    }))
  }

  return compactRepeatedTimelineItems(items.filter((item) => item.criadoEm || item.tipo === "alerta"))
}

function StatePanel({ message, tone = "muted" }) {
  return (
    <div
      className={`flex min-h-[420px] items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm ${
        tone === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-border/60 bg-muted/20 text-muted-foreground"
      }`}
    >
      {message}
    </div>
  )
}

function HistoricoManutencaoPanel({
  alerta,
  eventos,
  status,
  mensagem,
  onRetry,
}) {
  const timeline = React.useMemo(
    () => buildHistoricoTimeline(alerta, eventos),
    [alerta, eventos]
  )
  const hasEventosManutencao = eventos.some(isEventoDeManutencao)
  const hasOnlyAlertaAberto = timeline.every((item) => item.tipo === "alerta")

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
      <div className="rounded-lg border bg-muted/20 px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{alerta?.maquinaNome || "Maquina nao informada"}</p>
            <p className="truncate text-xs text-muted-foreground">{alerta?.sensorNome || "Sensor nao informado"}</p>
          </div>
          <Badge variant="outline" className="shrink-0 text-muted-foreground">
            Somente leitura
          </Badge>
        </div>
      </div>

      {status === "loading" ? (
        <div className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Carregando historico de manutencao...
        </div>
      ) : status === "error" ? (
        <div className="grid gap-3 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-3 text-sm text-destructive">
          <span>{mensagem || "Nao foi possivel carregar o historico de manutencao."}</span>
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onRetry}>
            <RefreshCcwIcon className="mr-1 size-4" />
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="relative grid gap-4">
          {timeline.map((item, index) => {
            const Icon = getTimelineIcon(item.tipo)
            const tone = getManutencaoStatusTone(item.status)

            return (
              <div key={`${item.key}-${index}`} className="relative grid grid-cols-[28px_1fr] gap-3">
                {index < timeline.length - 1 ? (
                  <span className="absolute left-[13px] top-8 h-[calc(100%+0.5rem)] w-px bg-border" />
                ) : null}
                <span
                  className={`relative z-10 flex size-7 items-center justify-center rounded-full border bg-background ${
                    tone === "success"
                      ? "text-green-700 dark:text-green-300"
                      : tone === "warning"
                        ? "text-orange-700 dark:text-orange-300"
                        : "text-[#3B2867] dark:text-white"
                  }`}
                >
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 rounded-md border bg-muted/20 px-3 py-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{item.titulo}</span>
                  </div>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <ClockIcon className="size-3" />
                    {formatTimelineDateRange(item)}
                  </span>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.tipo === "alerta" || item.usuario === "Sistema" ? item.usuario : `Tecnico: ${item.usuario}`}</span>
                    {item.status ? (
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-muted-foreground">
                        {EVENTO_STATUS_LABEL[item.status] ?? item.status}
                      </Badge>
                    ) : null}
                  </div>
                  {item.descricao ? (
                    <p className="mt-2 text-sm leading-relaxed text-foreground">{item.descricao}</p>
                  ) : null}
                </div>
              </div>
            )
          })}

          {!hasEventosManutencao && hasOnlyAlertaAberto ? (
            <div className="rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
              Nenhum evento de manutencao foi registrado para este alerta.
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

function GrupoTiposResumo({ tipos = [] }) {
  const visiveis = tipos.slice(0, 2)
  const restante = Math.max(tipos.length - visiveis.length, 0)

  return (
    <div className="flex min-w-[180px] flex-wrap items-center gap-1.5">
      {visiveis.map((tipo) => (
        <TipoAlertaBadge key={tipo} value={tipo} />
      ))}
      {restante > 0 ? (
        <Badge variant="outline" className="px-1.5 text-xs font-normal text-muted-foreground">
          +{restante}
        </Badge>
      ) : null}
    </div>
  )
}

function GrupoSensoresResumo({ sensores = [] }) {
  const visiveis = sensores.slice(0, 2)
  const restante = Math.max(sensores.length - visiveis.length, 0)

  if (visiveis.length === 0) {
    return <span className="text-sm text-muted-foreground">Sensor nao informado</span>
  }

  return (
    <div className="flex min-w-[160px] flex-col gap-0.5">
      {visiveis.map((sensor) => (
        <span key={sensor} className="text-sm text-muted-foreground">
          {sensor}
        </span>
      ))}
      {restante > 0 ? (
        <span className="text-xs text-muted-foreground">+{restante} sensor(es)</span>
      ) : null}
    </div>
  )
}

function GrupoAlertasSheet({ grupo, open, onOpenChange, onVerAlerta }) {
  const alertas = grupo?.alertas ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[520px]! max-w-none! sm:max-w-none!">
        <SheetHeader>
          <SheetTitle>{grupo?.maquinaNome || "Ocorrencias da maquina"}</SheetTitle>
        </SheetHeader>
        <div data-lenis-prevent className="flex flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="flex flex-col gap-3">
            {alertas.map((alerta) => (
              <div key={alerta.id} className="rounded-lg border bg-card p-3 shadow-sm dark:border-gray-700! dark:bg-[#0F172A]">
                <div className="flex flex-wrap items-center gap-2">
                  <TipoAlertaBadge value={alerta.tipo} />
                  <StatusAlertaBadge value={alerta.status} />
                  <SeveridadeBadge value={alerta.severidade} />
                </div>
                <div className="mt-3 flex flex-col gap-1">
                  <span className="text-sm font-medium text-foreground">{alerta.sensorNome}</span>
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{alerta.mensagem}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon className="size-3" />
                      {tempoRelativo(getUltimaOcorrencia(alerta))}
                    </span>
                    <Badge variant="outline" className={`px-1.5 text-xs ${isAlertaRepetido(alerta) ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300" : "text-muted-foreground"}`}>
                      {Math.max(Number(alerta.ocorrencias) || 1, 1)} ocorr.
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer hover:border-[#5E17EB] hover:bg-[#5E17EB] hover:text-white dark:hover:border-[#5E17EB] dark:hover:bg-[#5E17EB] dark:hover:text-white"
                    onClick={() => onVerAlerta(alerta)}
                  >
                    <EyeIcon className="mr-1 size-4" />
                    Ver detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {alertas.length === 0 ? (
            <div className="rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
              Nenhuma ocorrencia encontrada para esta maquina.
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function AlertasTable({ data, onVerGrupo }) {
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [openActionMenuId, setOpenActionMenuId] = React.useState(null)
  const grupos = React.useMemo(() => groupAlertasByMaquina(data), [data])
  const columns = React.useMemo(() => [
    {
      accessorKey: "maquinaNome",
      header: "Máquina",
      cell: ({ row }) => (
        <button
          onClick={() => onVerGrupo(row.original)}
          className="flex cursor-pointer flex-col text-left transition-colors hover:text-primary hover:underline"
        >
          <span className="text-sm font-medium">{row.original.maquinaNome}</span>
          <span className="text-xs text-muted-foreground">{row.original.totalAlertas} alerta(s)</span>
        </button>
      ),
    },
    {
      id: "tipos",
      header: "Tipos",
      cell: ({ row }) => <GrupoTiposResumo tipos={row.original.tipos} />,
    },
    {
      accessorKey: "principalStatus",
      header: "Status",
      cell: ({ row }) => <StatusAlertaBadge value={row.original.principalStatus} />,
    },
    { id: "sensores", header: "Sensores", cell: ({ row }) => <GrupoSensoresResumo sensores={row.original.sensores} /> },
    {
      id: "recencia",
      accessorKey: "ultimaOcorrenciaEm",
      header: "Ultima ocorrencia",
      cell: ({ row }) => (
        <div className="flex min-w-[120px] flex-col gap-1">
          <span className="text-sm text-muted-foreground">{tempoRelativo(row.original.ultimaOcorrenciaEm)}</span>
          <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ${row.original.recencia === "RECENTE" ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300" : "bg-muted text-muted-foreground"}`}>
            {row.original.recencia === "RECENTE" ? "Recente" : "Antigo"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "totalOcorrencias",
      header: "Ocorrencias",
      cell: ({ row }) => (
        <Badge variant="outline" className={`px-1.5 ${row.original.temRepetidos ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300" : "text-muted-foreground"}`}>
          {Math.max(Number(row.original.totalOcorrencias) || 1, 1)}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const grupo = row.original
        const menuId = String(grupo.id ?? row.id)

        return (
          <DropdownMenu
            open={openActionMenuId === menuId}
            onOpenChange={(open) => setOpenActionMenuId(open ? menuId : null)}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="cursor-pointer flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon">
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer" onSelect={() => runAfterCurrentOverlayCloses(() => onVerGrupo(grupo))}>
                <EyeIcon className="mr-1 size-4" /> Ver ocorrencias
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [onVerGrupo, openActionMenuId])

  const table = useReactTable({
    data: grupos,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <>
      <div className="min-h-[500px] overflow-auto rounded-lg border bg-card dark:border-gray-700! dark:bg-[#0F172A]">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="relative z-0">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Nenhuma maquina com alertas encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-4">
        <span className="text-sm text-muted-foreground">{grupos.length} alerta(s)</span>
        <div className="flex w-full items-center justify-end gap-8 lg:w-fit">
          <Button variant="outline" size="icon" className="cursor-pointer hidden size-8 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
            <ChevronsLeftIcon className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="cursor-pointer size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeftIcon className="size-4" />
          </Button>
            <span className="text-sm">Pág. {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}</span>
          <Button variant="outline" size="icon" className="cursor-pointer size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="cursor-pointer hidden size-8 lg:flex" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
            <ChevronsRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </>
  )
}

export default function AlertasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    alertas,
    status,
    mensagem,
    carregando = false,
    salvando,
    adicionarAlerta,
    recarregarAlertas,
  } = useAlertas()

  const [busca, setBusca] = React.useState("")
  const [sheetAberto, setSheetAberto] = React.useState(false)
  const [modoSheet, setModoSheet] = React.useState("criar")
  const [alertaSelecionado, setAlertaSelecionado] = React.useState(null)
  const [grupoAlertasAberto, setGrupoAlertasAberto] = React.useState(false)
  const [grupoAlertasSelecionado, setGrupoAlertasSelecionado] = React.useState(null)
  const [grupoRetornoDetalhes, setGrupoRetornoDetalhes] = React.useState(null)
  const [form, setForm] = React.useState(formVazio)
  const [historicoAberto, setHistoricoAberto] = React.useState(false)
  const [historicoStatus, setHistoricoStatus] = React.useState("idle")
  const [historicoMensagem, setHistoricoMensagem] = React.useState("")
  const [historicoEventos, setHistoricoEventos] = React.useState([])
  const [filtroResumo, setFiltroResumo] = React.useState("em-aberto")
  const historicoRequestIdRef = React.useRef(0)
  const alertaAbertoPelaUrlRef = React.useRef(null)
  const loadingInicial = useDashboardMetricsLoading(carregando && alertas.length === 0)
  const errorSemDados = status === "error" && alertas.length === 0

  const alertasOrdenados = React.useMemo(() => [...alertas].sort(compareAlertaRecente), [alertas])
  const totalEmAberto = React.useMemo(() => alertasOrdenados.filter((alerta) => alerta.status === "ATIVO").length, [alertasOrdenados])
  const totalEmAndamento = React.useMemo(() => alertasOrdenados.filter((alerta) => alerta.status === "EM_ANDAMENTO").length, [alertasOrdenados])
  const totalRepetidos = React.useMemo(() => alertasOrdenados.filter((alerta) => isStatusAberto(alerta.status) && isAlertaRepetido(alerta)).length, [alertasOrdenados])
  const totalConcluidos = React.useMemo(() => alertasOrdenados.filter((alerta) => alerta.status === "RESOLVIDO").length, [alertasOrdenados])

  React.useEffect(() => {
    const maquinaParam = searchParams.get("maquina")

    if (maquinaParam) {
      setBusca(maquinaParam)
    }
  }, [searchParams])

  React.useEffect(() => {
    const alertaIdParam = searchParams.get("alertaId")
    const abrirParam = searchParams.get("abrir")

    if (!alertaIdParam) {
      alertaAbertoPelaUrlRef.current = null
      return
    }

    const alertaUrlKey = `${alertaIdParam}:${abrirParam || "open"}`

    if (abrirParam === "false") {
      if (alertaAbertoPelaUrlRef.current !== alertaUrlKey) {
        setSheetAberto(false)
        alertaAbertoPelaUrlRef.current = alertaUrlKey
      }
      return
    }

    if (alertas.length === 0 || alertaAbertoPelaUrlRef.current === alertaUrlKey) {
      return
    }

    const alerta = alertas.find((item) => String(item.id) === String(alertaIdParam))

    if (alerta) {
      alertaAbertoPelaUrlRef.current = alertaUrlKey
      abrirVer(alerta)
    }
  }, [alertas, searchParams])

  function abrirCriar() {
    resetarHistoricoManutencao()
    setGrupoRetornoDetalhes(null)
    setModoSheet("criar")
    setForm(formVazio)
    setAlertaSelecionado(null)
    setSheetAberto(true)
  }

  function abrirVer(alerta, grupoRetorno = null) {
    resetarHistoricoManutencao()
    setGrupoRetornoDetalhes(grupoRetorno)
    setModoSheet("ver")
    setAlertaSelecionado(alerta)
    setSheetAberto(true)
  }

  function abrirGrupoAlertas(grupo) {
    resetarHistoricoManutencao()
    setGrupoAlertasSelecionado(grupo)
    setGrupoAlertasAberto(true)
  }

  function abrirAlertaDoGrupo(alerta) {
    const grupoRetorno = grupoAlertasSelecionado
    setGrupoAlertasAberto(false)
    runAfterCurrentOverlayCloses(() => abrirVer(alerta, grupoRetorno))
  }

  function resetarHistoricoManutencao() {
    historicoRequestIdRef.current += 1
    setHistoricoAberto(false)
    setHistoricoStatus("idle")
    setHistoricoMensagem("")
    setHistoricoEventos([])
  }

  async function carregarHistoricoManutencao(alertaId) {
    const session = getAuthSession()
    const requestId = historicoRequestIdRef.current + 1
    historicoRequestIdRef.current = requestId

    if (!session?.accessToken) {
      setHistoricoStatus("error")
      setHistoricoMensagem("Faca login para carregar o historico de manutencao.")
      return
    }

    setHistoricoStatus("loading")
    setHistoricoMensagem("")

    try {
      const eventosPayload = await requestDashboardJson(
        `/alertas/${alertaId}/eventos`,
        session.accessToken,
        "os eventos do alerta"
      )

      if (historicoRequestIdRef.current !== requestId) {
        return
      }

      const eventos = extractEventosFromAlertaPayload(eventosPayload)
        .map(normalizeEventoAlerta)
        .filter(Boolean)

      setHistoricoEventos(eventos)
      setHistoricoStatus("success")
    } catch (error) {
      if (historicoRequestIdRef.current !== requestId) {
        return
      }

      setHistoricoStatus("error")
      setHistoricoMensagem(error instanceof Error ? error.message : "Nao foi possivel carregar o historico de manutencao.")
    }
  }

  function abrirHistoricoManutencao() {
    if (!alertaSelecionado?.id) {
      return
    }

    setSheetAberto(false)
    setHistoricoAberto(true)

    if (historicoStatus === "idle") {
      carregarHistoricoManutencao(alertaSelecionado.id)
    }
  }

  function voltarParaDetalhesAlerta() {
    setHistoricoAberto(false)
    setSheetAberto(true)
  }

  function voltarParaAlertasDaMaquina() {
    if (!grupoRetornoDetalhes) {
      return
    }

    const grupoRetorno = grupoRetornoDetalhes

    setSheetAberto(false)
    setGrupoRetornoDetalhes(null)
    runAfterCurrentOverlayCloses(() => {
      setGrupoAlertasSelecionado(grupoRetorno)
      setGrupoAlertasAberto(true)
    })
  }

  async function salvar() {
    if (!form.maquinaNome.trim() || !form.sensorNome.trim() || !form.mensagem.trim()) {
      toast.error("Preencha todos os campos obrigatórios.")
      return
    }

    try {
      await adicionarAlerta({
        ...form,
        maquinaId: form.maquinaId ? Number(form.maquinaId) : null,
        sensorId: form.sensorId ? Number(form.sensorId) : null,
      })
      toast.success("Alerta registrado com sucesso!")
      setSheetAberto(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar o alerta.")
    }
  }

  const dadosFiltrados = React.useMemo(() =>
    alertasOrdenados.filter((alerta) => {
      const termo = busca.toLowerCase()

      return (
        alerta.maquinaNome.toLowerCase().includes(termo) ||
        alerta.sensorNome.toLowerCase().includes(termo) ||
        alerta.mensagem.toLowerCase().includes(termo) ||
        String(alerta.ocorrencias ?? "").includes(termo) ||
        STATUS_ALERTA_LABEL[alerta.status]?.toLowerCase().includes(termo) ||
        TIPOS_ALERTA_LABEL[alerta.tipo]?.toLowerCase().includes(termo)
      )
    }),
  [alertasOrdenados, busca])

  const emAberto = dadosFiltrados.filter((a) => a.status === "ATIVO")
  const emAndamento = dadosFiltrados.filter((a) => a.status === "EM_ANDAMENTO")
  const repetidos = dadosFiltrados.filter((a) => isStatusAberto(a.status) && isAlertaRepetido(a))
  const concluidos = dadosFiltrados.filter((a) => a.status === "RESOLVIDO")

  const tableProps = {
    onVerGrupo: abrirGrupoAlertas,
  }

  return (
    <>
      <SiteHeader />
      <div className="flex min-w-0 flex-col gap-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className={"cursor-pointer"} size="icon-sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeftIcon className="size-4 dark:text-white!" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangleIcon size={22} className="text-[#3B2867] dark:text-white!" />
                <h1 className="text-lg font-medium text-[#3B2867] dark:text-white">Alertas</h1>
              </div>
            </div>
          </div>
          <RefreshTooltipButton
            onClick={() => recarregarAlertas()}
            disabled={carregando || salvando}
            successMessage="Atualização dos alertas concluída."
          />
        </div>

        <Separator />

        {mensagem ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              status === "error"
                ? "border-destructive/25 bg-destructive/5 text-destructive"
                : "border-border/60 bg-muted/30 text-muted-foreground"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{mensagem}</span>
              <RefreshTooltipButton
                onClick={() => recarregarAlertas()}
                disabled={carregando || salvando}
                successMessage="Atualização dos alertas concluída."
              />
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
          <AlertaMetricCard
            featured
            icon={ShieldAlertIcon}
            label="Em aberto"
            value={<MetricValue value={totalEmAberto} loading={loadingInicial} />}
            badge={loadingInicial ? "Atualizando" : "Abertos"}
            badgeClass={totalEmAberto > 0 ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300" : ""}
            footer={loadingInicial ? "Conferindo alertas..." : `${totalEmAberto} aguardando triagem`}
            selected={filtroResumo === "em-aberto"}
            onClick={() => setFiltroResumo("em-aberto")}
          />

          <AlertaMetricCard
            icon={WrenchIcon}
            label="Em andamento"
            value={<MetricValue value={totalEmAndamento} loading={loadingInicial} />}
            badge={loadingInicial ? "Atualizando" : "Em curso"}
            badgeClass={totalEmAndamento > 0 ? "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300" : ""}
            footer={loadingInicial ? "Sincronizando status..." : `${totalEmAndamento} em atendimento`}
            selected={filtroResumo === "em-andamento"}
            onClick={() => setFiltroResumo("em-andamento")}
          />

          <AlertaMetricCard
            icon={RotateCcwIcon}
            label="Repetidos"
            value={<MetricValue value={totalRepetidos} loading={loadingInicial} />}
            badge={loadingInicial ? "Atualizando" : "Recorrentes"}
            badgeClass={totalRepetidos > 0 ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300" : ""}
            footer={loadingInicial ? "Agrupando ocorrências..." : `${totalRepetidos} com recorrência`}
            selected={filtroResumo === "repetidos"}
            onClick={() => setFiltroResumo("repetidos")}
          />

          <AlertaMetricCard
            icon={CircleCheckIcon}
            label="Concluídos"
            value={<MetricValue value={totalConcluidos} loading={loadingInicial} />}
            badge={loadingInicial ? "Atualizando" : "Resolvidos"}
            badgeClass={totalConcluidos > 0 ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300" : ""}
            footer={loadingInicial ? "Conferindo histórico..." : `${totalConcluidos} finalizados`}
            selected={filtroResumo === "concluidos"}
            onClick={() => setFiltroResumo("concluidos")}
          />
        </div>

        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input placeholder="Buscar por máquina, sensor, tipo ou status..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-8 dark:border-gray-600" />
        </div>

        {loadingInicial ? (
          <StatePanel message="Sincronizando alertas gerados pelos sensores..." />
        ) : errorSemDados ? (
          <StatePanel message={mensagem || "Não foi possível carregar os alertas."} tone="error" />
        ) : (
          <Tabs value={filtroResumo} onValueChange={setFiltroResumo} className="min-w-0 w-full flex-col gap-4">
            <TabsList className="w-full max-w-full justify-start overflow-x-auto overflow-y-hidden px-0 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabsTrigger value="em-aberto" className="cursor-pointer shrink-0 flex-none">
                Em aberto{emAberto.length > 0 && <Badge variant="secondary" className="ml-1.5 border-red-200! bg-red-100! text-red-700! dark:border-red-900/60! dark:bg-red-950/30! dark:text-red-300!">{emAberto.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="em-andamento" className="cursor-pointer shrink-0 flex-none">
                Em andamento{emAndamento.length > 0 && <Badge variant="secondary" className="ml-1.5 border-yellow-200! bg-yellow-100! text-yellow-700! dark:border-yellow-900/60! dark:bg-yellow-950/30! dark:text-yellow-300!">{emAndamento.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="repetidos" className="cursor-pointer shrink-0 flex-none">
                Repetidos{repetidos.length > 0 && <Badge variant="secondary" className="ml-1.5 border-orange-200! bg-orange-100! text-orange-700! dark:border-orange-900/60! dark:bg-orange-950/30! dark:text-orange-300!">{repetidos.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="concluidos" className="cursor-pointer shrink-0 flex-none">
                Concluidos{concluidos.length > 0 && <Badge variant="secondary" className="ml-1.5">{concluidos.length}</Badge>}
              </TabsTrigger>
            </TabsList>
            {[
              { value: "em-aberto", data: emAberto },
              { value: "em-andamento", data: emAndamento },
              { value: "repetidos", data: repetidos },
              { value: "concluidos", data: concluidos },
            ].map(({ value, data }) => (
              <TabsContent key={value} value={value} className="flex flex-col gap-4">
                <AlertasTable data={data} {...tableProps} />
              </TabsContent>
            ))}
          </Tabs>
        )}

        <GrupoAlertasSheet
          grupo={grupoAlertasSelecionado}
          open={grupoAlertasAberto}
          onOpenChange={(open) => {
            setGrupoAlertasAberto(open)
            if (!open) {
              setGrupoAlertasSelecionado(null)
            }
          }}
          onVerAlerta={abrirAlertaDoGrupo}
        />

        <Sheet
          open={sheetAberto}
          onOpenChange={(open) => {
            setSheetAberto(open)
            if (!open) {
              resetarHistoricoManutencao()
              setGrupoRetornoDetalhes(null)
            }
          }}
        >
          <SheetContent side="right" className="w-[420px]! max-w-none! sm:max-w-none!">
            <SheetHeader>
              {modoSheet === "ver" && grupoRetornoDetalhes ? (
                <div className="flex items-start gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="mt-0.5 cursor-pointer"
                    aria-label="Voltar para alertas da máquina"
                    onClick={voltarParaAlertasDaMaquina}
                  >
                    <ArrowLeftIcon className="size-4" />
                  </Button>
                  <div className="min-w-0">
                    <SheetTitle>Detalhes do alerta</SheetTitle>
                    <SheetDescription>Informações completas do alerta.</SheetDescription>
                  </div>
                </div>
              ) : (
                <>
                  <SheetTitle>{modoSheet === "criar" ? "Registrar alerta manual" : "Detalhes do alerta"}</SheetTitle>
                  <SheetDescription>{modoSheet === "criar" ? "Registre um alerta manualmente para acompanhamento." : "Informações completas do alerta."}</SheetDescription>
                </>
              )}
            </SheetHeader>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
              {modoSheet === "ver" && alertaSelecionado ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <FieldLabelWithHelp
                        help={TIPOS_ALERTA_HELP[alertaSelecionado.tipo]}
                        helpLabel={`Ajuda sobre tipo ${TIPOS_ALERTA_LABEL[alertaSelecionado.tipo] ?? alertaSelecionado.tipo}`}
                      >
                        Tipo
                      </FieldLabelWithHelp>
                      <TipoAlertaBadge value={alertaSelecionado.tipo} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <FieldLabelWithHelp
                        help={SEVERIDADE_HELP[alertaSelecionado.severidade]}
                        helpLabel={`Ajuda sobre severidade ${alertaSelecionado.severidade}`}
                      >
                        Severidade
                      </FieldLabelWithHelp>
                      <SeveridadeBadge value={alertaSelecionado.severidade} />
                    </div>
                    <div className="col-span-2 flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <StatusAlertaBadge value={alertaSelecionado.status} />
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Máquina</Label>
                      <span className="text-sm font-medium">{alertaSelecionado.maquinaNome}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Sensor</Label>
                      <span className="text-sm font-medium">{alertaSelecionado.sensorNome}</span>
                    </div>
                  </div>
                  {alertaSelecionado.tecnicoNome ? (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Técnico responsável</Label>
                      <span className="text-sm font-medium">{alertaSelecionado.tecnicoNome}</span>
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">Mensagem</Label>
                    <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm leading-relaxed text-foreground">{alertaSelecionado.mensagem}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">Criado em</Label>
                    <span className="text-sm">{tempoRelativo(alertaSelecionado.criadoEm)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Última ocorrência</Label>
                      <span className="text-sm">{tempoRelativo(getUltimaOcorrencia(alertaSelecionado))}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Ocorrências</Label>
                      <span className="text-sm font-semibold">{Math.max(Number(alertaSelecionado.ocorrencias) || 1, 1)}</span>
                    </div>
                  </div>
                  <Separator />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto w-full cursor-pointer justify-between gap-3 px-3 py-3 text-left"
                    onClick={abrirHistoricoManutencao}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <HistoryIcon className="size-4 shrink-0 text-[#3B2867] dark:text-white" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">Historico de Manutencao</span>
                        <span className="block truncate text-xs text-muted-foreground">Abrir cronofluxo de eventos</span>
                      </span>
                    </span>
                    <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tipo">Tipo de alerta</Label>
                    <Select value={form.tipo} onValueChange={(value) => setForm((current) => ({ ...current, tipo: value }))}>
                      <SelectTrigger id="tipo" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>{TIPOS_ALERTA.map((tipo) => <SelectItem key={tipo} value={tipo}>{TIPOS_ALERTA_LABEL[tipo]}</SelectItem>)}</SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="severidade">Severidade</Label>
                    <Select value={form.severidade} onValueChange={(value) => setForm((current) => ({ ...current, severidade: value }))}>
                      <SelectTrigger id="severidade" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="BAIXA">Baixa</SelectItem>
                          <SelectItem value="MEDIA">Média</SelectItem>
                          <SelectItem value="ALTA">Alta</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="maquinaNome">Nome da máquina <span className="text-red-500">*</span></Label>
                    <Input id="maquinaNome" placeholder="Ex: Motor Esteira A1" value={form.maquinaNome} onChange={(e) => setForm((current) => ({ ...current, maquinaNome: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sensorNome">Nome do sensor <span className="text-red-500">*</span></Label>
                    <Input id="sensorNome" placeholder="Ex: Sensor Temp A1-01" value={form.sensorNome} onChange={(e) => setForm((current) => ({ ...current, sensorNome: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="mensagem">Mensagem <span className="text-red-500">*</span></Label>
                    <Input id="mensagem" placeholder="Descreva o problema detectado..." value={form.mensagem} onChange={(e) => setForm((current) => ({ ...current, mensagem: e.target.value }))} />
                  </div>
                </>
              )}
            </div>
            {modoSheet !== "ver" ? (
              <SheetFooter className="px-4 pb-4">
                <Button variant="outline" className="cursor-pointer" onClick={() => setSheetAberto(false)}>Cancelar</Button>
                <Button className="cursor-pointer" onClick={salvar}>Registrar alerta</Button>
              </SheetFooter>
            ) : null}
          </SheetContent>
        </Sheet>

        <Sheet
          open={historicoAberto}
          onOpenChange={(open) => {
            setHistoricoAberto(open)
            if (!open) {
              resetarHistoricoManutencao()
            }
          }}
        >
          <SheetContent side="right" className="w-[420px]! max-w-none! sm:max-w-none!">
            <SheetHeader>
              <div className="flex items-start gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="mt-0.5 cursor-pointer"
                  aria-label="Voltar para detalhes do alerta"
                  onClick={voltarParaDetalhesAlerta}
                >
                  <ArrowLeftIcon className="size-4" />
                </Button>
                <div className="min-w-0">
                  <SheetTitle>Historico de Manutencao</SheetTitle>
                  <SheetDescription>Eventos registrados para este alerta.</SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <HistoricoManutencaoPanel
              alerta={alertaSelecionado}
              eventos={historicoEventos}
              status={historicoStatus}
              mensagem={historicoMensagem}
              onRetry={() => alertaSelecionado?.id ? carregarHistoricoManutencao(alertaSelecionado.id) : null}
            />
          </SheetContent>
        </Sheet>

      </div>
    </>
  )
}
