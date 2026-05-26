"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeftIcon,
  CalendarClockIcon,
  ChevronDownIcon,
  CheckCircle2Icon,
  ClockIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  MailIcon,
  PauseCircleIcon,
  PencilIcon,
  PlayCircleIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SiteHeader } from "@/components/site-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TableColumnHeaderMenu } from "@/components/table-column-header-menu"
import { TablePagination } from "@/components/table-pagination"
import { MetricValue } from "@/components/animated-metric"
import { useAdmins } from "@/components/context/admins-context"
import { useMaquinas } from "@/components/context/maquinas-context"
import { useTecnicos } from "@/components/context/tecnicos-context"
import { RefreshTooltipButton } from "@/components/refresh-tooltip-button"
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions"
import { extractCollection, requestDashboardJson } from "@/lib/dashboard-api"
import { getAuthSession } from "@/lib/auth-session"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

const TIMEZONE = "America/Sao_Paulo"
const FILTER_ALL_VALUE = "__all__"

const PERIOD_OPTIONS = [
  { value: "7", label: "7 dias" },
  { value: "15", label: "15 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
]

const SECTION_OPTIONS = [
  { id: "resumo", label: "Visao geral" },
  { id: "desempenho", label: "Indicadores" },
  { id: "sensores", label: "Inventario" },
  { id: "chamados", label: "Chamados" },
  { id: "historicoTendencia", label: "Historico" },
]

const DEFAULT_SECTIONS = {
  resumo: true,
  desempenho: true,
  sensores: true,
  chamados: true,
  historicoTendencia: true,
}

const WEEKDAY_OPTIONS = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda-feira" },
  { value: "2", label: "Terca-feira" },
  { value: "3", label: "Quarta-feira" },
  { value: "4", label: "Quinta-feira" },
  { value: "5", label: "Sexta-feira" },
  { value: "6", label: "Sabado" },
]

const MONTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => {
  const value = String(index + 1)
  return { value, label: `Dia ${value}` }
})

const FREQUENCY_OPTIONS = [
  { value: "DIARIO", label: "Diario" },
  { value: "SEMANAL", label: "Semanal" },
  { value: "MENSAL", label: "Mensal" },
]

const STATUS_FILTER_OPTIONS = [
  { value: "ATIVO", label: "Ativos" },
  { value: "PAUSADO", label: "Pausados" },
]

const FREQUENCY_FILTER_OPTIONS = [
  ...FREQUENCY_OPTIONS,
]

const STATUS_SORT_OPTIONS = [
  { value: "asc", label: "Ativos primeiro", desc: false },
  { value: "desc", label: "Pausados primeiro", desc: true },
]

const FREQUENCY_SORT_OPTIONS = [
  { value: "asc", label: "Diario primeiro", desc: false },
  { value: "desc", label: "Mensal primeiro", desc: true },
]

const NEXT_RUN_SORT_OPTIONS = [
  { value: "asc", label: "Mais proximos", desc: false },
  { value: "desc", label: "Menos proximos", desc: true },
]

const NEXT_RUN_SOON_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

const EMPTY_FORM = {
  nome: "",
  assunto: "",
  emailsDestino: "",
  tipoRelatorio: "geral",
  maquinaId: "",
  periodoDias: "30",
  secoes: DEFAULT_SECTIONS,
  frequencia: "SEMANAL",
  horario: "08:00",
  diaSemana: "1",
  diaMes: "1",
}

function getErrorMessage(error, fallback) {
  if (error?.payload?.mensagem || error?.payload?.message) {
    return error.payload.mensagem || error.payload.message
  }

  return error instanceof Error ? error.message : fallback
}

function parseEmails(value) {
  return value
    .split(/[;,\s]+/)
    .map((email) => email.trim())
    .filter(Boolean)
}

function getEnabledSections(secoes) {
  return Object.entries(secoes)
    .filter(([, enabled]) => enabled)
    .map(([secao]) => secao)
}

function parseHorario(value) {
  const [hourValue, minuteValue] = String(value || "").split(":")
  const hora = Number(hourValue)
  const minuto = Number(minuteValue)

  return {
    hora: Number.isInteger(hora) ? hora : NaN,
    minuto: Number.isInteger(minuto) ? minuto : NaN,
  }
}

function formatHorario(hora, minuto) {
  const safeHora = Number.isFinite(Number(hora)) ? Number(hora) : 8
  const safeMinuto = Number.isFinite(Number(minuto)) ? Number(minuto) : 0

  return `${String(safeHora).padStart(2, "0")}:${String(safeMinuto).padStart(2, "0")}`
}

function getTimezoneDateParts(value, timezone = TIMEZONE) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]))

  return {
    day: parts.day,
    month: parts.month,
    year: parts.year,
    fullYear: Number(parts.year) + 2000,
  }
}

function getScheduledDateParts(agendamento) {
  if (!agendamento?.proximoEnvioEm) return null

  const date = new Date(agendamento.proximoEnvioEm)
  if (Number.isNaN(date.getTime())) return null

  const utcLooksLikeLocalSchedule =
    date.getUTCHours() === Number(agendamento.hora) &&
    date.getUTCMinutes() === Number(agendamento.minuto)

  if (utcLooksLikeLocalSchedule) {
    return {
      day: String(date.getUTCDate()).padStart(2, "0"),
      month: String(date.getUTCMonth() + 1).padStart(2, "0"),
      year: String(date.getUTCFullYear()).slice(-2),
      fullYear: date.getUTCFullYear(),
    }
  }

  return getTimezoneDateParts(agendamento.proximoEnvioEm, agendamento.timezone)
}

function formatScheduledNextRun(agendamento) {
  const parts = getScheduledDateParts(agendamento)
  if (!parts) return "-"

  return `${parts.day}/${parts.month}/${parts.year}, ${formatHorario(agendamento.hora, agendamento.minuto)}`
}

function formatMetricNextRun(value) {
  if (!value || value === "-") {
    const fallbackValue = value || "-"

    return {
      content: (
        <span key={fallbackValue} className="inline-block animate-in fade-in slide-in-from-bottom-1 duration-500">
          {fallbackValue}
        </span>
      ),
      title: fallbackValue,
      time: "",
    }
  }

  const [date, time] = String(value).split(",").map((part) => part.trim())

  return {
    title: value,
    content: (
      <span key={value} className="inline-block animate-in leading-tight fade-in slide-in-from-bottom-1 duration-500">
        {date}
      </span>
    ),
    time: time || "",
  }
}

function getScheduledNextRunSortValue(agendamento) {
  const parts = getScheduledDateParts(agendamento)
  if (!parts) return Number.POSITIVE_INFINITY

  return Date.UTC(parts.fullYear, Number(parts.month) - 1, Number(parts.day), Number(agendamento.hora), Number(agendamento.minuto))
}

function selectFilterFn(row, columnId, value) {
  if (!value) return true

  return row.getValue(columnId) === value
}

function orderedValueSortFn(order) {
  return (rowA, rowB, columnId) => {
    const valueA = order[rowA.getValue(columnId)] ?? 0
    const valueB = order[rowB.getValue(columnId)] ?? 0

    return valueA - valueB
  }
}

const frequencySortFn = orderedValueSortFn({ DIARIO: 1, SEMANAL: 2, MENSAL: 3 })
const statusSortFn = orderedValueSortFn({ ATIVO: 1, PAUSADO: 2 })

function getNextRunTone(agendamento, firstNextRunValue) {
  const nextRunValue = getScheduledNextRunSortValue(agendamento)

  if (agendamento.status !== "ATIVO" || !Number.isFinite(nextRunValue) || !Number.isFinite(firstNextRunValue)) {
    return "neutral"
  }

  if (nextRunValue === firstNextRunValue) {
    return "current"
  }

  if (nextRunValue - firstNextRunValue <= NEXT_RUN_SOON_WINDOW_MS) {
    return "soon"
  }

  return "neutral"
}

function NextRunBadge({ agendamento, firstNextRunValue }) {
  const tone = getNextRunTone(agendamento, firstNextRunValue)
  const toneClass = {
    current: "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300",
    soon: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300",
    neutral: "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300",
  }[tone]

  return (
    <Badge variant="outline" className={toneClass}>
      {formatScheduledNextRun(agendamento)}
    </Badge>
  )
}

function getFrequencyLabel(value) {
  return FREQUENCY_OPTIONS.find((option) => option.value === value)?.label ?? value ?? "-"
}

function getWeekdayLabel(value) {
  return WEEKDAY_OPTIONS.find((option) => Number(option.value) === Number(value))?.label ?? "-"
}

function getPeriodLabel(value) {
  return PERIOD_OPTIONS.find((option) => option.value === String(value))?.label ?? `${value ?? "-"} dias`
}

function getEnabledSectionLabels(secoes) {
  return SECTION_OPTIONS
    .filter((secao) => secoes?.[secao.id])
    .map((secao) => secao.label)
}

function getRecipients(item) {
  if (Array.isArray(item.destinatarios)) {
    return item.destinatarios
      .map((destinatario) => destinatario?.email ?? destinatario)
      .filter(Boolean)
  }

  if (Array.isArray(item.emailsDestino)) {
    return item.emailsDestino.filter(Boolean)
  }

  return []
}

function normalizeAgendamento(item) {
  const filtros = item?.filtros && typeof item.filtros === "object" ? item.filtros : {}
  const maquinasIds = Array.isArray(filtros.maquinasIds) ? filtros.maquinasIds : []
  const secoesApi = Array.isArray(item?.secoes) ? item.secoes : Array.isArray(filtros.secoes) ? filtros.secoes : []
  const secoes = SECTION_OPTIONS.reduce((acc, secao) => {
    acc[secao.id] = secoesApi.length === 0 ? true : secoesApi.includes(secao.id)
    return acc
  }, {})
  const periodoValor = item?.periodo?.valor ?? item?.periodoDias ?? 30

  return {
    ...item,
    id: item?.id,
    nome: item?.nome ?? `Agendamento ${item?.id ?? ""}`.trim(),
    assunto: item?.assunto ?? "Relatorio Operacional Orbis",
    status: item?.status ?? "ATIVO",
    frequencia: item?.frequencia ?? "SEMANAL",
    hora: Number(item?.hora ?? 8),
    minuto: Number(item?.minuto ?? 0),
    diaSemana: item?.diaSemana ?? null,
    diaMes: item?.diaMes ?? null,
    timezone: item?.timezone ?? TIMEZONE,
    proximoEnvioEm: item?.proximoEnvioEm ?? null,
    destinatariosLista: getRecipients(item),
    tipoRelatorio: maquinasIds.length > 0 ? "maquina" : "geral",
    maquinaId: maquinasIds[0] ? String(maquinasIds[0]) : "",
    periodoDias: String(periodoValor),
    secoes,
  }
}

function buildFormFromAgendamento(agendamento) {
  return {
    nome: agendamento.nome ?? "",
    assunto: agendamento.assunto ?? "",
    emailsDestino: agendamento.destinatariosLista.join(", "),
    tipoRelatorio: agendamento.tipoRelatorio,
    maquinaId: agendamento.maquinaId,
    periodoDias: agendamento.periodoDias,
    secoes: agendamento.secoes,
    frequencia: agendamento.frequencia,
    horario: formatHorario(agendamento.hora, agendamento.minuto),
    diaSemana: agendamento.diaSemana === null || agendamento.diaSemana === undefined ? "1" : String(agendamento.diaSemana),
    diaMes: agendamento.diaMes === null || agendamento.diaMes === undefined ? "1" : String(agendamento.diaMes),
  }
}

function buildPayload(form) {
  const emailsDestino = parseEmails(form.emailsDestino)
  const { hora, minuto } = parseHorario(form.horario)
  const maquinaId = form.tipoRelatorio === "maquina" ? Number(form.maquinaId) : null

  return {
    nome: form.nome.trim(),
    emailsDestino,
    assunto: form.assunto.trim(),
    periodo: {
      tipo: "RELATIVE_DAYS",
      valor: Number(form.periodoDias),
    },
    filtros: {
      maquinasIds: maquinaId ? [maquinaId] : [],
      sensoresIds: [],
      usuariosIds: [],
      secoes: getEnabledSections(form.secoes),
    },
    agendamento: {
      frequencia: form.frequencia,
      diaSemana: form.frequencia === "SEMANAL" ? Number(form.diaSemana) : null,
      diaMes: form.frequencia === "MENSAL" ? Number(form.diaMes) : null,
      hora,
      minuto,
      timezone: TIMEZONE,
    },
  }
}

function validateForm(form) {
  const emails = parseEmails(form.emailsDestino)
  const { hora, minuto } = parseHorario(form.horario)

  if (!form.nome.trim()) return "Informe o nome do agendamento."
  if (!form.assunto.trim()) return "Informe o assunto do e-mail."
  if (emails.length === 0) return "Informe pelo menos um destinatario."
  if (emails.length > 10) return "Informe no maximo 10 destinatarios."
  if (!emails.every((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return "Revise os e-mails informados."
  if (form.tipoRelatorio === "maquina" && !form.maquinaId) return "Selecione a maquina do relatorio."
  if (!Number.isInteger(hora) || !Number.isInteger(minuto) || hora < 0 || hora > 23 || minuto < 0 || minuto > 59) {
    return "Informe um horario valido."
  }
  if (form.frequencia === "SEMANAL" && form.diaSemana === "") return "Selecione o dia da semana."
  if (form.frequencia === "MENSAL" && form.diaMes === "") return "Selecione o dia do mes."
  if (getEnabledSections(form.secoes).length === 0) return "Selecione pelo menos uma secao do relatorio."

  return ""
}

function normalizeDuplicateText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase()
}

function normalizeDuplicateEmails(value) {
  return parseEmails(value)
    .map((email) => email.toLowerCase())
    .sort()
    .join("|")
}

function getDuplicateSignatureFromForm(form) {
  const { hora, minuto } = parseHorario(form.horario)

  return JSON.stringify({
    nome: normalizeDuplicateText(form.nome),
    assunto: normalizeDuplicateText(form.assunto),
    emailsDestino: normalizeDuplicateEmails(form.emailsDestino),
    tipoRelatorio: form.tipoRelatorio,
    maquinaId: form.tipoRelatorio === "maquina" ? String(form.maquinaId || "") : "",
    periodoDias: String(form.periodoDias),
    secoes: getEnabledSections(form.secoes).sort().join("|"),
    frequencia: form.frequencia,
    diaSemana: form.frequencia === "SEMANAL" ? String(form.diaSemana) : "",
    diaMes: form.frequencia === "MENSAL" ? String(form.diaMes) : "",
    horario: `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`,
  })
}

function isDuplicateAgendamento(form, agendamentos, ignoredId = null) {
  const signature = getDuplicateSignatureFromForm(form)

  return agendamentos.some((agendamento) => {
    if (ignoredId !== null && String(agendamento.id) === String(ignoredId)) {
      return false
    }

    return getDuplicateSignatureFromForm(buildFormFromAgendamento(agendamento)) === signature
  })
}

function getUniqueEmails(nextEmails) {
  const seen = new Set()
  const uniqueEmails = []

  for (const rawEmail of nextEmails) {
    const email = rawEmail.trim()
    const key = email.toLowerCase()

    if (!email || seen.has(key)) {
      continue
    }

    seen.add(key)
    uniqueEmails.push(email)
  }

  return uniqueEmails
}

function buildEmployeeEmailOptions(tecnicos = [], admins = []) {
  const seen = new Set()
  const options = []

  for (const person of [...admins, ...tecnicos]) {
    const email = String(person?.email ?? "").trim()
    const key = email.toLowerCase()

    if (!email || seen.has(key)) {
      continue
    }

    seen.add(key)
    options.push({
      email,
      nome: person?.nome || email,
      role: person?.role === "ADMIN" ? "Administrador" : "Técnico",
    })
  }

  return options.sort((a, b) => a.nome.localeCompare(b.nome))
}

function MultiEmailInput({ id, value, onChange, disabled = false, placeholder = "email@empresa.com", employeeOptions = [] }) {
  const [draft, setDraft] = React.useState("")
  const emails = React.useMemo(() => parseEmails(value), [value])
  const selectedEmailKeys = React.useMemo(() => new Set(emails.map((email) => email.toLowerCase())), [emails])

  function updateEmails(nextEmails) {
    const uniqueEmails = getUniqueEmails(nextEmails)
    onChange(uniqueEmails.join(", "))
  }

  function addEmails(rawValue) {
    const nextEmails = parseEmails(rawValue)

    if (nextEmails.length === 0) {
      return
    }

    updateEmails([...emails, ...nextEmails])
    setDraft("")
  }

  function removeEmail(emailToRemove) {
    updateEmails(emails.filter((email) => email !== emailToRemove))
  }

  function addEmployeeEmail(email) {
    updateEmails([...emails, email])
  }

  function handleKeyDown(event) {
    if (["Enter", "Tab", ","].includes(event.key)) {
      if (draft.trim()) {
        event.preventDefault()
        addEmails(draft)
      }
    }

    if (event.key === "Backspace" && !draft && emails.length > 0) {
      removeEmail(emails[emails.length - 1])
    }
  }

  function handlePaste(event) {
    const text = event.clipboardData.getData("text")

    if (parseEmails(text).length > 1) {
      event.preventDefault()
      addEmails(text)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
        {emails.map((email) => (
          <span key={email} className="inline-flex max-w-full items-center gap-1 rounded-md border bg-muted px-2 py-1 text-xs text-foreground">
            <span className="truncate">{email}</span>
            <button
              type="button"
              className="cursor-pointer rounded-sm text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => removeEmail(email)}
              disabled={disabled}
              aria-label={`Remover ${email}`}
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addEmails(draft)}
          onPaste={handlePaste}
          placeholder={emails.length === 0 ? placeholder : "Adicionar outro e-mail"}
          disabled={disabled}
          className="min-w-[180px] flex-1 bg-transparent py-1 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          type="email"
          inputMode="email"
        />
      </div>
      {employeeOptions.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="w-fit cursor-pointer" disabled={disabled}>
              <PlusIcon className="mr-1 size-4" />
              Adicionar cadastrado
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-72 w-80 overflow-y-auto">
            <DropdownMenuLabel>Funcionários cadastrados</DropdownMenuLabel>
            {employeeOptions.map((employee) => {
              const selected = selectedEmailKeys.has(employee.email.toLowerCase())

              return (
                <DropdownMenuItem
                  key={employee.email}
                  className="cursor-pointer"
                  disabled={selected}
                  onSelect={() => addEmployeeEmail(employee.email)}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{employee.nome}</span>
                    <span className="truncate text-xs text-muted-foreground">{employee.email} - {employee.role}</span>
                  </div>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}

function StatusBadge({ status }) {
  const active = status === "ATIVO"

  return (
    <Badge
      variant="outline"
      className={active ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300" : "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300"}
    >
      {active ? <CheckCircle2Icon /> : <PauseCircleIcon />}
      {active ? "Ativo" : "Pausado"}
    </Badge>
  )
}

function MetricCard({ label, value, valueTitle, sub, detail, badge, badgeClass = "", icon: Icon, featured = false, compactValue = false }) {
  return (
    <Card
      className={`@container/card transition-colors flex-col justify-between hover:border-[#5E17EB]! hover:ring-[#5E17EB]/50 focus-within:border-[#5E17EB]! focus-within:ring-[#5E17EB]/10 
      }`}
    >
      <CardHeader className="min-h-[82px]">
        <CardDescription className={featured ? "" : "text-black! dark:text-white!"}>{label}</CardDescription>
        <CardTitle
          className={`font-semibold tabular-nums ${
            featured ? "text-[#5E17EB]!" : ""
          } ${compactValue ? "text-xl @[250px]/card:text-2xl" : "text-2xl @[250px]/card:text-3xl"}`}
          title={valueTitle ?? (typeof value === "string" || typeof value === "number" ? String(value) : undefined)}
        >
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
        <div className="line-clamp-1 items-center flex gap-2 font-medium ">
          {sub}
          <Icon className="size-4 flex " />
        </div>
        {/* {detail ? <div className="text-muted-foreground">{detail}</div> : null} */}
      </CardFooter>
    </Card>
  )
}



function ScheduleDescription({ agendamento }) {
  if (agendamento.frequencia === "DIARIO") {
    return <>Todos os dias, às {formatHorario(agendamento.hora, agendamento.minuto)}</>
  }

  if (agendamento.frequencia === "SEMANAL") {
    return <>{getWeekdayLabel(agendamento.diaSemana)+","} às {formatHorario(agendamento.hora, agendamento.minuto)}</>
  }

  return <>Dia {agendamento.diaMes ?? "-"}, às {formatHorario(agendamento.hora, agendamento.minuto)}</>
}

function getMobileScheduleBadgeLabel(agendamento) {
  if (agendamento.frequencia === "SEMANAL") {
    return getWeekdayLabel(agendamento.diaSemana)
  }

  if (agendamento.frequencia === "MENSAL") {
    return agendamento.diaMes ? `Dia ${agendamento.diaMes}` : "Mensal"
  }

  return "Diario"
}

function AgendamentoMobileCard({ agendamento, onOpen }) {
  return (
    <button
      type="button"
      className="flex min-h-[110px] w-full cursor-pointer flex-col justify-between gap-3 rounded-lg border bg-card p-2 text-left shadow-sm transition-colors hover:border-[#5E17EB] focus-visible:border-[#5E17EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E17EB]/20 dark:border-gray-700! dark:bg-[#0F172A]"
      onClick={() => onOpen(agendamento)}
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="line-clamp-2 text-xl font-medium leading-tight text-foreground">{agendamento.nome}</span>
        <span className="line-clamp-2 text-base text-muted-foreground">{agendamento.assunto}</span>
      </span>

      <span className="flex flex-wrap justify-end gap-1">
        <Badge variant="outline" className="border-yellow-200 bg-yellow-50 px-3 text-yellow-600 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300">
          {formatHorario(agendamento.hora, agendamento.minuto)}
        </Badge>
        <StatusBadge status={agendamento.status} />
        <Badge variant="outline" className="px-3 text-muted-foreground">
          {getMobileScheduleBadgeLabel(agendamento)}
        </Badge>
      </span>
    </button>
  )
}

function DetailItem({ label, value, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border bg-background px-3 py-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="min-w-0 text-sm font-medium text-foreground">
        {children ?? value ?? "-"}
      </span>
    </div>
  )
}

function DetailSection({ title, icon: Icon, children }) {
  return (
    <section className="grid gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#3B2867] dark:text-white">
        <Icon className="size-4" />
        {title}
      </div>
      <div className="grid gap-3">
        {children}
      </div>
    </section>
  )
}

function AgendamentoDetailsPanel({ agendamento, maquinas, firstNextRunValue }) {
  const maquina = maquinas.find((item) => String(item.id) === String(agendamento.maquinaId))
  const tipoRelatorio = agendamento.tipoRelatorio === "maquina" ? "Maquina especifica" : "Geral da frota"
  const maquinaNome = agendamento.tipoRelatorio === "maquina" ? maquina?.nome ?? "Maquina nao encontrada" : "Todas as maquinas"
  const secoes = getEnabledSectionLabels(agendamento.secoes)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-2">
      <div className="rounded-xl border bg-linear-to-br from-primary/10 via-card to-card p-4 shadow-sm dark:border-gray-700! dark:bg-[#0F172A]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <span className="flex size-11 items-center justify-center rounded-lg bg-[#5E17EB]/10 text-[#5E17EB]">
              <CalendarClockIcon className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="line-clamp-2 text-xl font-semibold leading-tight text-foreground">{agendamento.nome}</h2>
              <p className="line-clamp-2 text-sm text-muted-foreground">{agendamento.assunto}</p>
            </div>
          </div>
          <StatusBadge status={agendamento.status} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline" className="border-yellow-200 bg-yellow-50 px-3 text-yellow-600 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300">
            <ClockIcon className="size-3.5" />
            {formatHorario(agendamento.hora, agendamento.minuto)}
          </Badge>
          <Badge variant="outline" className="px-3 text-muted-foreground">
            {getFrequencyLabel(agendamento.frequencia)}
          </Badge>
          <NextRunBadge agendamento={agendamento} firstNextRunValue={firstNextRunValue} />
        </div>
      </div>

      <DetailSection title="Programacao" icon={CalendarClockIcon}>
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem label="Recorrencia">
            <ScheduleDescription agendamento={agendamento} />
          </DetailItem>
          <DetailItem label="Fuso horario" value={agendamento.timezone} />
        </div>
      </DetailSection>

      <DetailSection title="Relatorio" icon={SlidersHorizontalIcon}>
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem label="Tipo" value={tipoRelatorio} />
          <DetailItem label="Maquina" value={maquinaNome} />
          <DetailItem label="Periodo" value={getPeriodLabel(agendamento.periodoDias)} />
          <DetailItem label="Secoes">
            <span className="flex flex-wrap gap-1.5">
              {secoes.length ? (
                secoes.map((secao) => (
                  <Badge key={secao} variant="outline" className="text-muted-foreground">
                    {secao}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">Nenhuma secao selecionada</span>
              )}
            </span>
          </DetailItem>
        </div>
      </DetailSection>

      <DetailSection title="Destinatarios" icon={MailIcon}>
        <div className="grid gap-2 rounded-lg border bg-background p-3">
          {agendamento.destinatariosLista.length ? (
            agendamento.destinatariosLista.map((email) => (
              <span key={email} className="break-all rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                {email}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">Nenhum destinatario cadastrado.</span>
          )}
        </div>
      </DetailSection>
    </div>
  )
}

function MobileFilterSection({ title, value, options, onChange }) {
  const currentValue = value ?? FILTER_ALL_VALUE

  return (
    <details className="group rounded-lg border bg-background [&>summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-medium">
        <span>{title}</span>
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="grid gap-2 px-3 pb-3">
        <button
          type="button"
          className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
            currentValue === FILTER_ALL_VALUE
              ? "border-[#5E17EB] bg-[#5E17EB]/10 text-[#5E17EB]"
              : "bg-card text-muted-foreground hover:border-[#5E17EB]/50"
          }`}
          onClick={() => onChange(undefined)}
        >
          Todos
        </button>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
              currentValue === option.value
                ? "border-[#5E17EB] bg-[#5E17EB]/10 text-[#5E17EB]"
                : "bg-card text-muted-foreground hover:border-[#5E17EB]/50"
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </details>
  )
}

function MobileFiltersMenu({
  open,
  onOpenChange,
  activeCount,
  filters,
  onFilterChange,
  onClear,
}) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-9 cursor-pointer"
          onClick={() => onOpenChange(!open)}
        >
          <SlidersHorizontalIcon className="size-4" />
          Filtros
          {activeCount > 0 ? (
            <Badge variant="outline" className="ml-1 border-[#5E17EB]/40 bg-[#5E17EB]/10 px-1.5 text-[#5E17EB]">
              {activeCount}
            </Badge>
          ) : null}
        </Button>
        {activeCount > 0 ? (
          <Button type="button" variant="ghost" size="sm" className="cursor-pointer text-muted-foreground" onClick={onClear}>
            Limpar
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm dark:border-gray-700! dark:bg-[#0F172A]">
          <MobileFilterSection
            title="Frequencia"
            value={filters.frequencia}
            options={FREQUENCY_FILTER_OPTIONS}
            onChange={(value) => onFilterChange("frequencia", value)}
          />
          <MobileFilterSection
            title="Status"
            value={filters.status}
            options={STATUS_FILTER_OPTIONS}
            onChange={(value) => onFilterChange("status", value)}
          />
        </div>
      ) : null}
    </div>
  )
}

function AgendamentoForm({ form, setForm, maquinas, salvando, modo, employeeEmailOptions }) {
  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function toggleSecao(secao, checked) {
    setForm((current) => ({
      ...current,
      secoes: {
        ...current.secoes,
        [secao]: checked,
      },
    }))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-2">
      <section className="grid gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#3B2867] dark:text-white">
          <MailIcon className="size-4" />
          Envio por e-mail
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={form.nome} onChange={(event) => updateField("nome", event.target.value)} placeholder="Relatorio semanal operacional" disabled={salvando} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="assunto">Assunto</Label>
            <Input id="assunto" value={form.assunto} onChange={(event) => updateField("assunto", event.target.value)} placeholder="Relatorio Operacional Orbis" disabled={salvando} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="emailsDestino">Destinatarios</Label>
            <MultiEmailInput
              id="emailsDestino"
              value={form.emailsDestino}
              onChange={(value) => updateField("emailsDestino", value)}
              placeholder="email@empresa.com"
              disabled={salvando}
              employeeOptions={employeeEmailOptions}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#3B2867] dark:text-white">
          <SlidersHorizontalIcon className="size-4" />
          Configurar relatorio
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Tipo</Label>
            <Select value={form.tipoRelatorio} onValueChange={(value) => updateField("tipoRelatorio", value)} disabled={salvando}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Geral da frota</SelectItem>
                <SelectItem value="maquina">Maquina especifica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Maquina</Label>
            <Select value={form.maquinaId} onValueChange={(value) => updateField("maquinaId", value)} disabled={salvando || form.tipoRelatorio !== "maquina" || maquinas.length === 0}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {maquinas.map((maquina) => (
                  <SelectItem key={maquina.id} value={String(maquina.id)}>
                    {maquina.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Periodo</Label>
            <Select value={form.periodoDias} onValueChange={(value) => updateField("periodoDias", value)} disabled={salvando}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[460px]:grid-cols-2">
          {SECTION_OPTIONS.map((secao) => (
            <label key={secao.id} className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
              <Checkbox checked={form.secoes[secao.id]} onCheckedChange={(checked) => toggleSecao(secao.id, checked === true)} disabled={salvando} />
              {secao.label}
            </label>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#3B2867] dark:text-white">
          <CalendarClockIcon className="size-4" />
          Recorrencia
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Frequencia</Label>
            <Select value={form.frequencia} onValueChange={(value) => updateField("frequencia", value)} disabled={salvando}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="horario">Horario</Label>
            <Input id="horario" type="time" value={form.horario} onChange={(event) => updateField("horario", event.target.value)} disabled={salvando} />
          </div>
          {form.frequencia === "SEMANAL" ? (
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label>Dia da semana</Label>
              <Select value={form.diaSemana} onValueChange={(value) => updateField("diaSemana", value)} disabled={salvando}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {form.frequencia === "MENSAL" ? (
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label>Dia do mes</Label>
              <Select value={form.diaMes} onValueChange={(value) => updateField("diaMes", value)} disabled={salvando}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_DAY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </section>

      <div className="rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        {modo === "criar" ? "O novo agendamento" : "Este agendamento"} usara os filtros configurados acima e o fuso {TIMEZONE}.
      </div>
    </div>
  )
}

export default function AgendamentosPage() {
  const router = useRouter()
  const permissions = useDashboardPermissions()
  const { maquinas } = useMaquinas()
  const { admins } = useAdmins()
  const { tecnicos } = useTecnicos()
  const [agendamentos, setAgendamentos] = React.useState([])
  const [status, setStatus] = React.useState("loading")
  const [mensagem, setMensagem] = React.useState("")
  const [busca, setBusca] = React.useState("")
  const [sorting, setSorting] = React.useState([])
  const [columnFilters, setColumnFilters] = React.useState([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false)
  const [sheetAberto, setSheetAberto] = React.useState(false)
  const [modoSheet, setModoSheet] = React.useState("criar")
  const [agendamentoSelecionado, setAgendamentoSelecionado] = React.useState(null)
  const [dialogExcluir, setDialogExcluir] = React.useState(false)
  const [agendamentoExcluir, setAgendamentoExcluir] = React.useState(null)
  const [form, setForm] = React.useState(EMPTY_FORM)
  const [salvando, setSalvando] = React.useState(false)
  const [acaoPendenteId, setAcaoPendenteId] = React.useState(null)
  const acaoPendenteRef = React.useRef(false)
  const canViewAgendamentos = permissions.canViewAgendamentos
  const employeeEmailOptions = React.useMemo(() => buildEmployeeEmailOptions(tecnicos, admins), [admins, tecnicos])

  const carregarAgendamentos = React.useCallback(async () => {
    if (!canViewAgendamentos) {
      return
    }

    const session = getAuthSession()

    if (!session?.accessToken) {
      setStatus("error")
      setMensagem("Sua sessao expirou. Faca login novamente.")
      return
    }

    setStatus((current) => (current === "success" ? "refreshing" : "loading"))
    setMensagem("")

    try {
      const payload = await requestDashboardJson("/relatorios/agendamentos", session.accessToken, "os agendamentos")
      setAgendamentos(extractCollection(payload).map(normalizeAgendamento))
      setStatus("success")
    } catch (error) {
      setStatus("error")
      setMensagem(getErrorMessage(error, "Nao foi possivel carregar os agendamentos."))
    }
  }, [canViewAgendamentos])

  React.useEffect(() => {
    if (!canViewAgendamentos) {
      router.replace("/dashboard")
    }
  }, [canViewAgendamentos, router])

  React.useEffect(() => {
    if (!canViewAgendamentos) {
      return
    }

    carregarAgendamentos()
  }, [canViewAgendamentos, carregarAgendamentos])

  React.useEffect(() => {
    if (!agendamentoSelecionado?.id) {
      return
    }

    const atualizado = agendamentos.find((item) => item.id === agendamentoSelecionado.id)

    if (atualizado && atualizado !== agendamentoSelecionado) {
      setAgendamentoSelecionado(atualizado)
    }
  }, [agendamentos, agendamentoSelecionado])

  const totais = React.useMemo(() => {
    const ativos = agendamentos.filter((item) => item.status === "ATIVO").length
    const pausados = agendamentos.filter((item) => item.status === "PAUSADO").length
    const proximos = agendamentos
      .filter((item) => item.status === "ATIVO" && item.proximoEnvioEm)
      .sort((a, b) => getScheduledNextRunSortValue(a) - getScheduledNextRunSortValue(b))

    return {
      total: agendamentos.length,
      ativos,
      pausados,
      proximo: proximos[0] ? formatScheduledNextRun(proximos[0]) : "-",
    }
  }, [agendamentos])

  const dadosFiltrados = React.useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return agendamentos.filter((item) => {
      const searchable = [
        item.nome,
        item.assunto,
        item.destinatariosLista.join(" "),
        getFrequencyLabel(item.frequencia),
      ].join(" ").toLowerCase()

      return !termo || searchable.includes(termo)
    })
  }, [agendamentos, busca])

  const firstNextRunValue = React.useMemo(() => {
    const values = agendamentos
      .filter((item) => item.status === "ATIVO")
      .map(getScheduledNextRunSortValue)
      .filter(Number.isFinite)

    return values.length > 0 ? Math.min(...values) : Number.POSITIVE_INFINITY
  }, [agendamentos])

  function abrirCriar() {
    setModoSheet("criar")
    setAgendamentoSelecionado(null)
    setForm({
      ...EMPTY_FORM,
      secoes: { ...DEFAULT_SECTIONS },
      maquinaId: maquinas[0]?.id ? String(maquinas[0].id) : "",
    })
    setSheetAberto(true)
  }

  function abrirVer(agendamento) {
    setModoSheet("ver")
    setAgendamentoSelecionado(agendamento)
    setForm(buildFormFromAgendamento(agendamento))
    setSheetAberto(true)
  }

  function abrirEditar(agendamento) {
    setModoSheet("editar")
    setAgendamentoSelecionado(agendamento)
    setForm(buildFormFromAgendamento(agendamento))
    setSheetAberto(true)
  }

  function confirmarExcluir(agendamento) {
    setAgendamentoExcluir(agendamento)
    setDialogExcluir(true)
  }

  function alternarDialogExcluir(open) {
    if (!open && acaoPendenteId === agendamentoExcluir?.id) {
      return
    }

    setDialogExcluir(open)

    if (!open) {
      setAgendamentoExcluir(null)
    }
  }

  async function salvarAgendamento() {
    const validationMessage = validateForm(form)
    const editing = modoSheet === "editar" && agendamentoSelecionado?.id

    if (validationMessage) {
      toast.error(validationMessage)
      return
    }

    if (isDuplicateAgendamento(form, agendamentos, editing ? agendamentoSelecionado.id : null)) {
      toast.error("Ja existe um agendamento com estes mesmos dados.")
      return
    }

    const session = getAuthSession()
    if (!session?.accessToken) {
      toast.error("Sua sessao expirou. Faca login novamente.")
      return
    }

    setSalvando(true)

    try {
      const payload = buildPayload(form)

      await requestDashboardJson(
        editing ? `/relatorios/agendamentos/${agendamentoSelecionado.id}` : "/relatorios/agendamentos",
        session.accessToken,
        editing ? "o agendamento" : "o novo agendamento",
        {
          method: editing ? "PATCH" : "POST",
          body: payload,
        }
      )

      toast.success(editing ? "Agendamento atualizado." : "Agendamento criado.")
      setSheetAberto(false)
      setAgendamentoSelecionado(null)
      await carregarAgendamentos()
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel salvar o agendamento."))
    } finally {
      setSalvando(false)
    }
  }

  async function atualizarStatusAgendamento(agendamento, novoStatus) {
    if (acaoPendenteRef.current) {
      return
    }

    const session = getAuthSession()
    if (!session?.accessToken) {
      toast.error("Sua sessao expirou. Faca login novamente.")
      return
    }

    acaoPendenteRef.current = true
    setAcaoPendenteId(agendamento.id)

    try {
      await requestDashboardJson(`/relatorios/agendamentos/${agendamento.id}/status`, session.accessToken, "o status do agendamento", {
        method: "PATCH",
        body: { status: novoStatus },
      })
      toast.success(novoStatus === "PAUSADO" ? "Envios cancelados/pausados." : "Agendamento reativado.")
      setAgendamentoSelecionado((current) => (
        current?.id === agendamento.id ? { ...current, status: novoStatus } : current
      ))
      await carregarAgendamentos()
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel atualizar o status."))
    } finally {
      acaoPendenteRef.current = false
      setAcaoPendenteId(null)
    }
  }

  async function executarAgora(agendamento) {
    if (acaoPendenteRef.current) {
      return
    }

    const session = getAuthSession()
    if (!session?.accessToken) {
      toast.error("Sua sessao expirou. Faca login novamente.")
      return
    }

    acaoPendenteRef.current = true
    setAcaoPendenteId(agendamento.id)

    try {
      await requestDashboardJson(`/relatorios/agendamentos/${agendamento.id}/executar-agora`, session.accessToken, "a execucao do agendamento", {
        method: "POST",
      })
      toast.success("Execucao manual concluida.")
      await carregarAgendamentos()
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel executar o agendamento."))
    } finally {
      acaoPendenteRef.current = false
      setAcaoPendenteId(null)
    }
  }

  async function excluirAgendamento() {
    if (acaoPendenteRef.current) {
      return
    }

    if (!agendamentoExcluir?.id) {
      return
    }

    const session = getAuthSession()
    if (!session?.accessToken) {
      toast.error("Sua sessao expirou. Faca login novamente.")
      return
    }

    acaoPendenteRef.current = true
    setAcaoPendenteId(agendamentoExcluir.id)

    try {
      await requestDashboardJson(`/relatorios/agendamentos/${agendamentoExcluir.id}`, session.accessToken, "o agendamento", {
        method: "DELETE",
      })
      toast.success("Agendamento excluido.")
      setDialogExcluir(false)
      setAgendamentoExcluir(null)

      if (agendamentoSelecionado?.id === agendamentoExcluir.id) {
        setSheetAberto(false)
        setAgendamentoSelecionado(null)
      }

      await carregarAgendamentos()
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel excluir o agendamento."))
    } finally {
      acaoPendenteRef.current = false
      setAcaoPendenteId(null)
    }
  }

  const columns = [
    {
      accessorKey: "nome",
      header: "Nome",
      cell: ({ row }) => (
        <div className="flex min-w-[220px] flex-col gap-1">
          <button
            type="button"
            className="w-fit cursor-pointer text-left font-medium text-foreground transition-colors hover:text-primary hover:underline"
            onClick={() => abrirVer(row.original)}
          >
            {row.original.nome}
          </button>
          <span className="text-xs text-muted-foreground">{row.original.assunto}</span>
        </div>
      ),
    },
    {
      id: "destinatarios",
      header: "Destinatarios",
      cell: ({ row }) => {
        const destinatarios = row.original.destinatariosLista

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="flex max-w-[260px] cursor-default flex-col gap-1 text-left">
                <span className="truncate text-sm text-foreground">{destinatarios[0] ?? "-"}</span>
                {destinatarios.length > 1 ? (
                  <span className="text-xs text-muted-foreground">+ {destinatarios.length - 1} destinatario(s)</span>
                ) : null}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="start" className="max-w-[320px]">
              {destinatarios.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {destinatarios.map((email) => (
                    <span key={email} className="break-all text-xs">{email}</span>
                  ))}
                </div>
              ) : (
                <span className="text-xs">Nenhum destinatario.</span>
              )}
            </TooltipContent>
          </Tooltip>
        )
      },
    },
    {
      accessorKey: "frequencia",
      header: ({ column }) => (
        <TableColumnHeaderMenu
          column={column}
          label="Frequencia"
          filterOptions={FREQUENCY_FILTER_OPTIONS}
          sortOptions={FREQUENCY_SORT_OPTIONS}
        />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground">
          {getFrequencyLabel(row.original.frequencia)}
        </Badge>
      ),
      filterFn: selectFilterFn,
      sortingFn: frequencySortFn,
    },
    {
      id: "horario",
      header: "Horario",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          <ScheduleDescription agendamento={row.original} />
        </span>
      ),
    },
    {
      id: "proximoEnvio",
      accessorFn: getScheduledNextRunSortValue,
      header: ({ column }) => (
        <TableColumnHeaderMenu
          column={column}
          label="Proximo Envio"
          sortOptions={NEXT_RUN_SORT_OPTIONS}
        />
      ),
      cell: ({ row }) => <NextRunBadge agendamento={row.original} firstNextRunValue={firstNextRunValue} />,
      sortingFn: "basic",
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <TableColumnHeaderMenu
          column={column}
          label="Status"
          filterOptions={STATUS_FILTER_OPTIONS}
          sortOptions={STATUS_SORT_OPTIONS}
        />
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      filterFn: selectFilterFn,
      sortingFn: statusSortFn,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const agendamento = row.original
        const pending = acaoPendenteId === agendamento.id
        const actionBusy = acaoPendenteId !== null

        return (
          <div className="text-right">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="cursor-pointer size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon" disabled={actionBusy}>
                  <EllipsisVerticalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} collisionPadding={{ top: 96, right: 16, bottom: 16, left: 16 }} className="z-[80] w-44">
                <DropdownMenuItem className="cursor-pointer" disabled={actionBusy} onSelect={() => abrirVer(agendamento)}>
                  <EyeIcon className="mr-1 size-4" /> Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" disabled={actionBusy} onSelect={() => abrirEditar(agendamento)}>
                  <PencilIcon className="mr-1 size-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" disabled={actionBusy} onSelect={() => executarAgora(agendamento)}>
                  <SendIcon className="mr-1 size-4" /> {pending ? "Enviando..." : "Enviar agora"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {agendamento.status === "ATIVO" ? (
                  <DropdownMenuItem className="cursor-pointer" disabled={actionBusy} onSelect={() => atualizarStatusAgendamento(agendamento, "PAUSADO")}>
                    <PauseCircleIcon className="mr-1 size-4" /> Cancelar envios
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem className="cursor-pointer" disabled={actionBusy} onSelect={() => atualizarStatusAgendamento(agendamento, "ATIVO")}>
                    <PlayCircleIcon className="mr-1 size-4" /> Reativar
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" variant="destructive" disabled={actionBusy} onSelect={() => confirmarExcluir(agendamento)}>
                  <Trash2Icon className="mr-1 size-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: dadosFiltrados,
    columns,
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const mobileFilterValues = {
    frequencia: table.getColumn("frequencia")?.getFilterValue(),
    status: table.getColumn("status")?.getFilterValue(),
  }
  const activeMobileFilters = Object.values(mobileFilterValues).filter((value) => value !== undefined && value !== "").length

  function alterarFiltroMobile(columnId, value) {
    table.getColumn(columnId)?.setFilterValue(value)
    table.setPageIndex(0)
  }

  function limparFiltrosMobile() {
    alterarFiltroMobile("frequencia", undefined)
    alterarFiltroMobile("status", undefined)
  }

  const loadingInicial = status === "loading"
  const refreshing = status === "refreshing"
  const proximoEnvioMetric = formatMetricNextRun(loadingInicial ? "--" : totais.proximo)
  const selectedActionPending = acaoPendenteId === agendamentoSelecionado?.id
  const actionBusy = acaoPendenteId !== null

  if (!canViewAgendamentos) {
    return null
  }

  return (
    <>
      <SiteHeader />
      <div className="flex flex-col gap-6  p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="cursor-pointer" variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}>
                  <ArrowLeftIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="mb-0!">Voltar ao dashboard</p>
              </TooltipContent>
            </Tooltip>
            <div className="flex min-w-0 items-center gap-2">
              <CalendarClockIcon size={22} className="text-[#3B2867] dark:text-white" />
              <h1 className="truncate text-[18pt]! font-medium text-[#3B2867] dark:text-white">Agendamentos</h1>
            </div>
            {refreshing ? <span className="animate-pulse text-xs text-muted-foreground">Atualizando...</span> : null}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <RefreshTooltipButton
              onClick={carregarAgendamentos}
              disabled={loadingInicial || refreshing}
              successMessage="Atualização dos agendamentos concluída."
            />
            <Button size="sm" className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90" onClick={abrirCriar}>
              <PlusIcon className="mr-1 size-4" />
              Novo agendamento
            </Button>
          </div>
        </div>

        <Separator />

        {mensagem ? (
          <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{mensagem}</span>
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={carregarAgendamentos}>
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
          <MetricCard
            featured
            icon={CalendarClockIcon}
            label="Total"
            value={<MetricValue value={totais.total} loading={loadingInicial} />}
            badge={loadingInicial ? "Atualizando" : `${totais.ativos} ativos`}
            sub={loadingInicial ? "Carregando agendamentos" : `${totais.total} agendamentos cadastrados`}
          />
          <MetricCard
            icon={CheckCircle2Icon}
            label="Ativos"
            value={<MetricValue value={totais.ativos} loading={loadingInicial} />}
            badge={loadingInicial ? "Atualizando" : "Prontos"}
            badgeClass={totais.ativos > 0 ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300" : ""}
            sub={loadingInicial ? "Conferindo envios ativos" : `${totais.ativos} prontos para envio`}
          />
          <MetricCard
            icon={PauseCircleIcon}
            label="Pausados"
            value={<MetricValue value={totais.pausados} loading={loadingInicial} />}
            badge={loadingInicial ? "Atualizando" : "Em pausa"}
            badgeClass={totais.pausados > 0 ? "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300" : ""}
            sub={loadingInicial ? "Conferindo pausas" : `${totais.pausados} envios interrompidos`}
          />
          <MetricCard
            compactValue
            icon={ClockIcon}
            label="Proximo envio"
            value={proximoEnvioMetric.content}
            valueTitle={proximoEnvioMetric.title}
            badge={loadingInicial ? "Atualizando" : "Agenda"}
            sub={loadingInicial ? "Calculando proxima execucao" : proximoEnvioMetric.time ? `Às ${proximoEnvioMetric.time} horas` : "Sem horário programado"}
            detail={totais.proximo === "-" ? "Nenhum envio ativo encontrado" : "Baseado na recorrencia configurada"}
          />
        </div>

        <div className="flex flex-col gap-3">
          <MobileFiltersMenu
            open={mobileFiltersOpen}
            onOpenChange={setMobileFiltersOpen}
            activeCount={activeMobileFilters}
            filters={mobileFilterValues}
            onFilterChange={alterarFiltroMobile}
            onClear={limparFiltrosMobile}
          />
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, assunto ou e-mail..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 md:hidden">
          {loadingInicial ? (
            <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
              Carregando agendamentos...
            </div>
          ) : table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <AgendamentoMobileCard key={row.id} agendamento={row.original} onOpen={abrirVer} />
            ))
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhum agendamento encontrado.
            </div>
          )}
        </div>

        <div className="hidden min-h-[420px] overflow-auto rounded-lg border bg-card md:block dark:border-gray-700! dark:bg-[#0F172A]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className={header.column.id === "actions" ? "w-12 text-right" : undefined}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loadingInicial ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                    Carregando agendamentos...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                    Nenhum agendamento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination table={table} />

        <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
          <SheetContent side="right" mobileSide="bottom" className="w-full max-w-none! gap-0 overflow-hidden sm:w-[560px]! sm:max-w-none!">
            {modoSheet === "ver" && agendamentoSelecionado ? (
              <div className="flex min-h-0 flex-1 flex-col animate-in fade-in-0 slide-in-from-right-4 duration-200">
                <SheetHeader className="shrink-0">
                  <SheetTitle>Detalhes do agendamento</SheetTitle>
                  <SheetDescription>
                    Veja a configuracao do envio e execute acoes rapidas.
                  </SheetDescription>
                </SheetHeader>
                <AgendamentoDetailsPanel agendamento={agendamentoSelecionado} maquinas={maquinas} firstNextRunValue={firstNextRunValue} />
                <SheetFooter className="shrink-0 border-t border-border/70 bg-popover/95 p-3 shadow-[0_-12px_30px_rgba(0,0,0,0.08)]">
                  <div className="grid w-full gap-2 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => executarAgora(agendamentoSelecionado)}
                      disabled={actionBusy}
                    >
                      <SendIcon className="mr-1 size-4" />
                      {selectedActionPending ? "Processando..." : "Enviar agora"}
                    </Button>
                    {agendamentoSelecionado.status === "ATIVO" ? (
                      <Button
                        variant="outline"
                        className="cursor-pointer border-yellow-200 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-900/60 dark:text-yellow-300 dark:hover:bg-yellow-950/30"
                        onClick={() => atualizarStatusAgendamento(agendamentoSelecionado, "PAUSADO")}
                        disabled={actionBusy}
                      >
                        <PauseCircleIcon className="mr-1 size-4" />
                        {selectedActionPending ? "Processando..." : "Pausar"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="cursor-pointer border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/60 dark:text-green-300 dark:hover:bg-green-950/30"
                        onClick={() => atualizarStatusAgendamento(agendamentoSelecionado, "ATIVO")}
                        disabled={actionBusy}
                      >
                        <PlayCircleIcon className="mr-1 size-4" />
                        {selectedActionPending ? "Processando..." : "Reativar"}
                      </Button>
                    )}
                    <Button
                      className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => abrirEditar(agendamentoSelecionado)}
                      disabled={actionBusy}
                    >
                      <PencilIcon className="mr-1 size-4" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      className="cursor-pointer"
                      onClick={() => confirmarExcluir(agendamentoSelecionado)}
                      disabled={actionBusy}
                    >
                      <Trash2Icon className="mr-1 size-4" />
                      Excluir
                    </Button>
                  </div>
                </SheetFooter>
              </div>
            ) : (
              <div key={modoSheet} className="flex min-h-0 flex-1 flex-col animate-in fade-in-0 slide-in-from-right-4 duration-200">
                <SheetHeader className="shrink-0">
                  <SheetTitle>{modoSheet === "criar" ? "Novo agendamento" : "Editar agendamento"}</SheetTitle>
                  <SheetDescription>
                    Configure o relatorio, os destinatarios e a recorrencia de envio.
                  </SheetDescription>
                </SheetHeader>
                <AgendamentoForm form={form} setForm={setForm} maquinas={maquinas} salvando={salvando} modo={modoSheet} employeeEmailOptions={employeeEmailOptions} />
                <SheetFooter className="shrink-0 px-4 pb-4 sm:flex-row sm:justify-end">
                  <Button variant="outline" className="cursor-pointer" onClick={() => setSheetAberto(false)} disabled={salvando}>
                    Cancelar
                  </Button>
                  <Button className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90" onClick={salvarAgendamento} disabled={salvando}>
                    {salvando ? "Salvando..." : modoSheet === "criar" ? "Criar agendamento" : "Salvar alteracoes"}
                  </Button>
                </SheetFooter>
              </div>
            )}
          </SheetContent>
        </Sheet>

        <Dialog open={dialogExcluir} onOpenChange={alternarDialogExcluir}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusao</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir <strong>{agendamentoExcluir?.nome}</strong>? Esta acao nao pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" className="cursor-pointer" onClick={() => alternarDialogExcluir(false)} disabled={acaoPendenteId === agendamentoExcluir?.id}>
                Cancelar
              </Button>
              <Button variant="destructive" className="cursor-pointer" onClick={excluirAgendamento} disabled={acaoPendenteId === agendamentoExcluir?.id}>
                {acaoPendenteId === agendamentoExcluir?.id ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
