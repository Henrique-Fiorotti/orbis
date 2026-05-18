"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeftIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ClockIcon,
  EllipsisVerticalIcon,
  MailIcon,
  PauseCircleIcon,
  PencilIcon,
  PlayCircleIcon,
  PlusIcon,
  RefreshCcwIcon,
  SearchIcon,
  SendIcon,
  SlidersHorizontalIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SiteHeader } from "@/components/site-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useMaquinas } from "@/components/context/maquinas-context"
import { extractCollection, requestDashboardJson } from "@/lib/dashboard-api"
import { getAuthSession } from "@/lib/auth-session"

const TIMEZONE = "America/Sao_Paulo"

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
  { value: "todos", label: "Todos" },
  { value: "ATIVO", label: "Ativos" },
  { value: "PAUSADO", label: "Pausados" },
]

const FREQUENCY_FILTER_OPTIONS = [
  { value: "todos", label: "Todas" },
  ...FREQUENCY_OPTIONS,
]

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

function getScheduledNextRunSortValue(agendamento) {
  const parts = getScheduledDateParts(agendamento)
  if (!parts) return Number.POSITIVE_INFINITY

  return Date.UTC(parts.fullYear, Number(parts.month) - 1, Number(parts.day), Number(agendamento.hora), Number(agendamento.minuto))
}

function getFrequencyLabel(value) {
  return FREQUENCY_OPTIONS.find((option) => option.value === value)?.label ?? value ?? "-"
}

function getWeekdayLabel(value) {
  return WEEKDAY_OPTIONS.find((option) => Number(option.value) === Number(value))?.label ?? "-"
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

function MetricCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm hover:border-[#5E17EB]!">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Icon className="size-4 text-[#3B2867] dark:text-white" />
      </div>
      <span className="text-3xl font-bold text-[#3B2867] dark:text-white">{value}</span>
      <span className="text-xs text-muted-foreground">{sub}</span>
    </div>
  )
}



function ScheduleDescription({ agendamento }) {
  if (agendamento.frequencia === "DIARIO") {
    return <>Todos os dias, às {formatHorario(agendamento.hora, agendamento.minuto)}</>
  }

  if (agendamento.frequencia === "SEMANAL") {
    return <>{getWeekdayLabel(agendamento.diaSemana)+","} às {formatHorario(agendamento.hora, agendamento.minuto)}</>
  }

  return <>Dia {agendamento.diaMes+"," ?? "-"} às {formatHorario(agendamento.hora, agendamento.minuto)}</>
}

function AgendamentoForm({ form, setForm, maquinas, salvando, modo }) {
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
            <Input id="emailsDestino" value={form.emailsDestino} onChange={(event) => updateField("emailsDestino", event.target.value)} placeholder="email@empresa.com, time@empresa.com" disabled={salvando} />
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
  const { maquinas } = useMaquinas()
  const [agendamentos, setAgendamentos] = React.useState([])
  const [status, setStatus] = React.useState("loading")
  const [mensagem, setMensagem] = React.useState("")
  const [busca, setBusca] = React.useState("")
  const [statusFiltro, setStatusFiltro] = React.useState("todos")
  const [frequenciaFiltro, setFrequenciaFiltro] = React.useState("todos")
  const [sheetAberto, setSheetAberto] = React.useState(false)
  const [modoSheet, setModoSheet] = React.useState("criar")
  const [agendamentoSelecionado, setAgendamentoSelecionado] = React.useState(null)
  const [form, setForm] = React.useState(EMPTY_FORM)
  const [salvando, setSalvando] = React.useState(false)
  const [acaoPendenteId, setAcaoPendenteId] = React.useState(null)

  const carregarAgendamentos = React.useCallback(async () => {
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
  }, [])

  React.useEffect(() => {
    carregarAgendamentos()
  }, [carregarAgendamentos])

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
      const matchesStatus = statusFiltro === "todos" || item.status === statusFiltro
      const matchesFrequency = frequenciaFiltro === "todos" || item.frequencia === frequenciaFiltro
      const searchable = [
        item.nome,
        item.assunto,
        item.destinatariosLista.join(" "),
        getFrequencyLabel(item.frequencia),
      ].join(" ").toLowerCase()

      return matchesStatus && matchesFrequency && (!termo || searchable.includes(termo))
    })
  }, [agendamentos, busca, frequenciaFiltro, statusFiltro])

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

  function abrirEditar(agendamento) {
    setModoSheet("editar")
    setAgendamentoSelecionado(agendamento)
    setForm(buildFormFromAgendamento(agendamento))
    setSheetAberto(true)
  }

  async function salvarAgendamento() {
    const validationMessage = validateForm(form)

    if (validationMessage) {
      toast.error(validationMessage)
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
      const editing = modoSheet === "editar" && agendamentoSelecionado?.id

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
    const session = getAuthSession()
    if (!session?.accessToken) {
      toast.error("Sua sessao expirou. Faca login novamente.")
      return
    }

    setAcaoPendenteId(agendamento.id)

    try {
      await requestDashboardJson(`/relatorios/agendamentos/${agendamento.id}/status`, session.accessToken, "o status do agendamento", {
        method: "PATCH",
        body: { status: novoStatus },
      })
      toast.success(novoStatus === "PAUSADO" ? "Envios cancelados/pausados." : "Agendamento reativado.")
      await carregarAgendamentos()
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel atualizar o status."))
    } finally {
      setAcaoPendenteId(null)
    }
  }

  async function executarAgora(agendamento) {
    const session = getAuthSession()
    if (!session?.accessToken) {
      toast.error("Sua sessao expirou. Faca login novamente.")
      return
    }

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
      setAcaoPendenteId(null)
    }
  }

  const loadingInicial = status === "loading"
  const refreshing = status === "refreshing"

  return (
    <>
      <SiteHeader />
      <div className="flex flex-col gap-6 p-6">
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
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={carregarAgendamentos} disabled={loadingInicial || refreshing}>
              <RefreshCcwIcon className="mr-1 size-4" />
              Atualizar
            </Button>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={CalendarClockIcon} label="Total" value={loadingInicial ? "--" : totais.total} sub="Agendamentos cadastrados" />
          <MetricCard icon={CheckCircle2Icon} label="Ativos" value={loadingInicial ? "--" : totais.ativos} sub="Prontos para envio automatico" />
          <MetricCard icon={PauseCircleIcon} label="Pausados" value={loadingInicial ? "--" : totais.pausados} sub="Envios cancelados temporariamente" />
          <MetricCard icon={ClockIcon} label="Proximo envio" value={loadingInicial ? "--" : totais.proximo} sub="Entre os agendamentos ativos" />
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, assunto ou e-mail..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              className="pl-8"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={frequenciaFiltro} onValueChange={setFrequenciaFiltro}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="min-h-[420px] overflow-auto rounded-lg border bg-card dark:border-gray-700! dark:bg-[#0F172A]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Destinatários</TableHead>
                <TableHead>Frequência</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Próximo Envio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingInicial ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Carregando agendamentos...
                  </TableCell>
                </TableRow>
              ) : dadosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Nenhum agendamento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                dadosFiltrados.map((agendamento) => {
                  const pending = acaoPendenteId === agendamento.id

                  return (
                    <TableRow key={agendamento.id} className="relative z-0">
                      <TableCell>
                        <div className="flex min-w-[220px] flex-col gap-1">
                          <span className="font-medium text-foreground">{agendamento.nome}</span>
                          <span className="text-xs text-muted-foreground">{agendamento.assunto}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-[260px] flex-col gap-1">
                          <span className="truncate text-sm text-foreground">{agendamento.destinatariosLista[0] ?? "-"}</span>
                          {agendamento.destinatariosLista.length > 1 ? (
                            <span className="text-xs text-muted-foreground">+ {agendamento.destinatariosLista.length - 1} destinatario(s)</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-muted-foreground">
                          {getFrequencyLabel(agendamento.frequencia)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <ScheduleDescription agendamento={agendamento} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatScheduledNextRun(agendamento)}</TableCell>
                      <TableCell>
                        <StatusBadge status={agendamento.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="cursor-pointer size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon" disabled={pending}>
                              <EllipsisVerticalIcon className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem className="cursor-pointer" onSelect={() => abrirEditar(agendamento)}>
                              <PencilIcon className="mr-1 size-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onSelect={() => executarAgora(agendamento)}>
                              <SendIcon className="mr-1 size-4" /> Enviar agora
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {agendamento.status === "ATIVO" ? (
                              <DropdownMenuItem className="cursor-pointer" onSelect={() => atualizarStatusAgendamento(agendamento, "PAUSADO")}>
                                <PauseCircleIcon className="mr-1 size-4" /> Cancelar envios
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="cursor-pointer" onSelect={() => atualizarStatusAgendamento(agendamento, "ATIVO")}>
                                <PlayCircleIcon className="mr-1 size-4" /> Reativar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-muted-foreground">
          {dadosFiltrados.length} resultado(s)
        </div>

        <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
          <SheetContent side="right" className="w-full max-w-none! sm:w-[560px]! sm:max-w-none!">
            <SheetHeader>
              <SheetTitle>{modoSheet === "criar" ? "Novo agendamento" : "Editar agendamento"}</SheetTitle>
              <SheetDescription>
                Configure o relatorio, os destinatarios e a recorrencia de envio.
              </SheetDescription>
            </SheetHeader>
            <AgendamentoForm form={form} setForm={setForm} maquinas={maquinas} salvando={salvando} modo={modoSheet} />
            <SheetFooter className="px-4 pb-4 sm:flex-row sm:justify-end">
              <Button variant="outline" className="cursor-pointer" onClick={() => setSheetAberto(false)} disabled={salvando}>
                Cancelar
              </Button>
              <Button className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90" onClick={salvarAgendamento} disabled={salvando}>
                {salvando ? "Salvando..." : modoSheet === "criar" ? "Criar agendamento" : "Salvar alteracoes"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
