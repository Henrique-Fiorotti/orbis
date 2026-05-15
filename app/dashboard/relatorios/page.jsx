"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowLeftIcon,
  CircleCheckIcon,
  GaugeIcon,
  MailIcon,
  PrinterIcon,
  RefreshCcwIcon,
  SendIcon,
  ShieldAlertIcon,
  SlidersHorizontalIcon,
  WashingMachineIcon,
  ZapIcon,
} from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SiteHeader } from "@/components/site-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useMaquinas } from "@/components/context/maquinas-context"
import { getAuthSession } from "@/lib/auth-session"
import { getHttpErrorStatus, requestDashboardJson } from "@/lib/dashboard-api"
import { tempoRelativo } from "@/lib/utils"

const COLORS = {
  primary: "#8000ff",
  primaryLight: "#6B5A8F",
  ok: "#4B7F52",
  alerta: "#ff5e00",
  medio: "#8A6A2F",
}

const PERIOD_OPTIONS = [
  { value: "7d", label: "7 dias", days: 7 },
  { value: "15d", label: "15 dias", days: 15 },
  { value: "30d", label: "30 dias", days: 30 },
  { value: "90d", label: "90 dias", days: 90 },
]

const SECTION_OPTIONS = [
  { id: "resumo", label: "Visao geral" },
  { id: "indicadores", label: "Indicadores" },
  { id: "maquinas", label: "Inventario" },
  { id: "chamados", label: "Chamados" },
]

const DEFAULT_SECTIONS = {
  resumo: true,
  indicadores: true,
  maquinas: true,
  chamados: true,
}

const DEFAULT_REPORT_CONFIG = {
  tipoRelatorio: "geral",
  maquinaId: "",
  periodo: "30d",
  secoes: DEFAULT_SECTIONS,
}

const EMAIL_DRAFT_STORAGE_KEY = "orbis-report-email-draft"

const REPORT_ENDPOINTS = ["/relatorios/gerar", "/relatorios"]

const EMAIL_FREQUENCY_OPTIONS = [
  { value: "diario", label: "Diario", detail: "Todos os dias as 08:00" },
  { value: "semanal", label: "Semanal", detail: "Segundas-feiras as 08:00" },
  { value: "mensal", label: "Mensal", detail: "Todo dia 1 as 08:00" },
]

const WEEKDAY_OPTIONS = [
  { value: "segunda", label: "Segunda-feira" },
  { value: "terca", label: "Terca-feira" },
  { value: "quarta", label: "Quarta-feira" },
  { value: "quinta", label: "Quinta-feira" },
  { value: "sexta", label: "Sexta-feira" },
  { value: "sabado", label: "Sabado" },
  { value: "domingo", label: "Domingo" },
]

const MONTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => {
  const day = String(index + 1)
  return { value: day, label: `Dia ${day}` }
})

function createReportConfig(overrides = {}) {
  const overrideSections = { ...(overrides.secoes ?? {}) }

  if (overrideSections.historico !== undefined && overrideSections.historicoTendencia === undefined) {
    overrideSections.historicoTendencia = overrideSections.historico
  }

  if (overrideSections.desempenho !== undefined && overrideSections.maquinas === undefined) {
    overrideSections.maquinas = overrideSections.desempenho
  }

  if (overrideSections.sensores !== undefined && overrideSections.indicadores === undefined) {
    overrideSections.indicadores = overrideSections.sensores
  }

  delete overrideSections.historico
  delete overrideSections.historicoTendencia
  delete overrideSections.desempenho
  delete overrideSections.sensores

  return {
    ...DEFAULT_REPORT_CONFIG,
    ...overrides,
    secoes: {
      ...DEFAULT_SECTIONS,
      ...overrideSections,
    },
  }
}

function getEmailDataWindow(frequencia) {
  if (frequencia === "diario") {
    return { tipo: "atual", label: "Dados atuais", periodo: null, periodoDias: null }
  }

  if (frequencia === "mensal") {
    return { tipo: "mensal", label: "Mes atual", periodo: "30d", periodoDias: 30 }
  }

  return { tipo: "semanal", label: "Ultimos 7 dias", periodo: "7d", periodoDias: 7 }
}

function getWeekdayLabel(value) {
  return WEEKDAY_OPTIONS.find((option) => option.value === value)?.label ?? "Segunda-feira"
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getPeriodLabel(periodo) {
  return PERIOD_OPTIONS.find((option) => option.value === periodo)?.label ?? "30 dias"
}

function getPeriodDays(periodo) {
  return PERIOD_OPTIONS.find((option) => option.value === periodo)?.days ?? 30
}

function toReportNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function formatReportDateTime(value) {
  if (!value) return "-"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatReportDate(value) {
  if (!value) return "-"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
}

function getEnabledSections(secoes) {
  return Object.entries(secoes)
    .filter(([, enabled]) => enabled)
    .map(([secao]) => secao)
}

function buildReportPayload({ tipoRelatorio, maquinaId, periodo, secoes }) {
  const periodoDias = getPeriodDays(periodo)
  const isMaquina = tipoRelatorio === "maquina" && maquinaId
  const periodoLabel = getPeriodLabel(periodo)

  return {
    nome: isMaquina ? "Relatorio de Maquina" : "Relatorio Operacional",
    assunto: `Relatorio dos ultimos ${periodoDias} dias`,
    periodo: {
      tipo: "RELATIVE_DAYS",
      valor: periodoDias,
    },
    filtros: {
      maquinasIds: isMaquina ? [Number(maquinaId)] : [],
      secoes: getEnabledSections(secoes),
    },
    config: {
      periodo: periodoLabel,
      tipo: isMaquina ? "maquina" : "geral",
    },
  }
}

function extractReportHtml(source) {
  const html = source?.html ?? source?.relatorioHtml ?? source?.templateHtml ?? source?.body ?? source?.conteudoHtml
  return typeof html === "string" && html.trim().startsWith("<") ? html : ""
}

function normalizeReportPayload(payload, fallbackPeriodLabel = "30 dias") {
  const source = payload?.relatorio ?? payload?.data ?? payload?.dados ?? payload ?? {}
  const resumo = source.resumo ?? {}
  const desempenho = source.desempenho ?? {}
  const statusDasMaquinas = desempenho.statusDasMaquinas ?? {}
  const maquinasPorImportancia = desempenho.maquinasPorImportancia ?? {}
  const sensores = source.sensores ?? {}
  const maquinas = Array.isArray(source.maquinas) ? source.maquinas : []
  const alertas = Array.isArray(source.alertas) ? source.alertas : Array.isArray(source.chamados) ? source.chamados : []
  const config = source.config ?? {}
  const totalMaquinas = toReportNumber(resumo.totalMaquinas ?? resumo.maquinasAtivas ?? maquinas.length)
  const maquinasFuncionando = toReportNumber(
    resumo.maquinasFuncionando ??
      desempenho.statusDasMaquinas?.operando ??
      maquinas.filter((maquina) => maquina.status === "OK").length
  )
  const maquinasEmAlerta = toReportNumber(
    resumo.maquinasEmAlerta ??
      desempenho.statusDasMaquinas?.emAlerta ??
      maquinas.filter((maquina) => maquina.status && maquina.status !== "OK").length
  )
  const alertasAtivos = toReportNumber(
    resumo.alertasAtivos ??
      resumo.chamadosAbertos ??
      alertas.filter((alerta) => !["RESOLVIDO", "ENCERRADO"].includes(alerta.status)).length
  )
  const sensoresOnline = toReportNumber(resumo.sensoresOnline ?? sensores.online)

  return {
    html: extractReportHtml(source),
    periodoLabel: source.periodoLabel ?? config.periodo ?? fallbackPeriodLabel,
    config: {
      periodo: config.periodo ?? fallbackPeriodLabel,
      tipo: config.tipo ?? "geral",
    },
    resumo: {
      totalMaquinas,
      maquinasFuncionando,
      maquinasEmAlerta,
      alertasAtivos,
      alertasHoje: toReportNumber(resumo.alertasHoje),
      tecnicosAtivos: toReportNumber(resumo.tecnicosAtivos),
      integridadeMedia: toReportNumber(resumo.integridadeMedia),
      sensoresOnline,
      alertaSemAtendimento: toReportNumber(resumo.alertaSemAtendimento),
      alertasAtendidosHoje: toReportNumber(resumo.alertasAtendidosHoje),
      maquinasAltaImportancia: toReportNumber(
        resumo.maquinasAltaImportancia ?? maquinas.filter((maquina) => maquina.criticidade === "ALTA").length
      ),
    },
    desempenho: {
      statusDasMaquinas: {
        operando: maquinasFuncionando || toReportNumber(statusDasMaquinas.operando),
        emAlerta: maquinasEmAlerta || toReportNumber(statusDasMaquinas.emAlerta),
        inativa: toReportNumber(statusDasMaquinas.inativa),
      },
      maquinasPorImportancia: {
        alta: toReportNumber(maquinasPorImportancia.alta ?? maquinas.filter((maquina) => maquina.criticidade === "ALTA").length),
        media: toReportNumber(maquinasPorImportancia.media ?? maquinas.filter((maquina) => maquina.criticidade === "MEDIA").length),
        baixa: toReportNumber(maquinasPorImportancia.baixa ?? maquinas.filter((maquina) => maquina.criticidade === "BAIXA").length),
      },
      integridadePorSetor: Array.isArray(desempenho.integridadePorSetor)
        ? desempenho.integridadePorSetor.map((item, index) => ({
            setor: item.setor ?? item.nome ?? `Setor ${index + 1}`,
            integridadeMedia: toReportNumber(item.integridadeMedia ?? item.integridade),
          }))
        : [],
    },
    sensores: {
      online: sensoresOnline,
      offline: toReportNumber(sensores.offline),
      inativo: toReportNumber(sensores.inativo),
    },
    maquinas,
    alertas,
    chamados: alertas,
    historicoTendencia: Array.isArray(source.historicoTendencia)
      ? source.historicoTendencia.map((item) => ({
          data: item.data,
          quantidade: toReportNumber(item.quantidade ?? item.alertas),
        }))
      : [],
  }
}

async function requestRelatorio(payload, accessToken) {
  let lastError = null

  for (const endpoint of REPORT_ENDPOINTS) {
    try {
      return await requestDashboardJson(endpoint, accessToken, "o relatorio", {
        method: "POST",
        body: payload,
      })
    } catch (error) {
      lastError = error

      if (getHttpErrorStatus(error) === 404) {
        continue
      }

      throw error
    }
  }

  throw lastError ?? new Error("Endpoint de relatorio nao encontrado.")
}

function isWithinPeriod(dateValue, days) {
  if (!dateValue) return false

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return false

  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  startDate.setDate(startDate.getDate() - (days - 1))

  return date >= startDate
}

function filtrarChamadosPorMaquina(chamados, maquinaId, days) {
  return chamados.filter((chamado) => {
    const mesmaMaquina = Number(chamado.maquinaId) === Number(maquinaId)
    return mesmaMaquina && isWithinPeriod(chamado.criadoEm ?? chamado.createdAt, days)
  })
}

function filtrarSensoresPorMaquina(sensores, maquinaId) {
  return sensores.filter((sensor) => Number(sensor.maquinaId) === Number(maquinaId))
}

function calcularMetricasMaquina(maquina, sensores, chamados) {
  const chamadosAbertos = chamados.filter((chamado) =>
    ["ABERTO", "DISPONIVEL", "ATIVO", "EM_ANDAMENTO"].includes(chamado.status)
  ).length
  const chamadosResolvidos = chamados.filter((chamado) =>
    ["RESOLVIDO", "ENCERRADO"].includes(chamado.status)
  ).length
  const sensoresOnline = sensores.filter((sensor) => sensor.status === "ONLINE").length

  return {
    integridade: maquina?.integridade ?? 0,
    estabilidade: maquina?.scoreEstabilidade ?? 0,
    chamadosAbertos,
    chamadosResolvidos,
    sensoresTotal: sensores.length,
    sensoresOnline,
  }
}

function montarTendenciaHistorica(payload) {
  return extractCollection(payload)
    .map((item) => {
      const data = item.data ?? item.date ?? item.dia ?? item.createdAt
      const integridade = Number(item.integridade ?? item.saude ?? item.healthScore)
      const scoreEstabilidade = Number(item.scoreEstabilidade ?? item.estabilidade ?? item.stabilityScore)

      if (!data || !Number.isFinite(integridade)) {
        return null
      }

      return {
        data: new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        integridade,
        scoreEstabilidade: Number.isFinite(scoreEstabilidade) ? scoreEstabilidade : integridade,
        temperatura: Number(item.temperaturaMedia ?? item.temperatura ?? NaN),
        vibracao: Number(item.vibracaoMedia ?? item.vibracao ?? NaN),
        timestamp: new Date(data).getTime(),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp)
}

function montarTendenciaChamados(chamados, days) {
  const contagemPorDia = new Map()
  const hoje = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const dia = new Date(hoje)
    dia.setHours(0, 0, 0, 0)
    dia.setDate(hoje.getDate() - i)
    contagemPorDia.set(dia.toISOString().slice(0, 10), 0)
  }

  chamados.forEach((chamado) => {
    const dataBase = chamado.criadoEm ?? chamado.createdAt
    if (!dataBase) return

    const data = new Date(dataBase)
    if (Number.isNaN(data.getTime())) return

    const chave = data.toISOString().slice(0, 10)
    if (contagemPorDia.has(chave)) {
      contagemPorDia.set(chave, contagemPorDia.get(chave) + 1)
    }
  })

  return [...contagemPorDia.entries()]
    .map(([data, alertas]) => ({
      data: new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      alertas,
    }))
    .filter((item) => item.alertas > 0)
}

function CriticidadeBadge({ value }) {
  const map = { ALTA: "Alta", MEDIA: "Média", BAIXA: "Baixa" }
  const colorMap = {
    ALTA: "border-stone-300 bg-stone-50 text-stone-800 print:border-stone-300 print:bg-stone-50",
    MEDIA: "border-stone-300 bg-white text-stone-700 print:border-stone-300 print:bg-white",
    BAIXA: "border-stone-300 bg-white text-stone-600 print:border-stone-300 print:bg-white",
  }

  return (
    <span className={`inline-flex items-center border px-2 py-0.5 text-xs font-medium ${colorMap[value]}`}>
      {map[value] ?? value}
    </span>
  )
}

function StatusBadge({ value }) {
  const isOk = value === "OK" || value === "ONLINE" || value === "RESOLVIDO" || value === "ENCERRADO"

  return (
    <span
      className={`inline-flex items-center gap-1 border px-2 py-0.5 text-xs font-medium ${isOk ? "border-stone-300 bg-white text-stone-700" : "border-stone-300 bg-stone-50 text-stone-800"
        }`}
    >
      {isOk ? <CircleCheckIcon className="size-3" /> : <AlertTriangleIcon className="size-3" />}
      {value}
    </span>
  )
}

function MetricCard({ icon: Icon, label, value, sub, color = COLORS.primary }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 border border-stone-200 bg-white p-3 shadow-none sm:p-4 print:border-stone-300">
      <div className="flex items-center justify-between">
        <span className="min-w-0 text-xs font-medium uppercase tracking-wide text-stone-500">{label}</span>
        <Icon size={15} style={{ color }} />
      </div>
      <span className="break-words text-xl font-semibold text-stone-900 sm:text-2xl">{value}</span>
      {sub && <span className="text-xs text-stone-500">{sub}</span>}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="border-b border-stone-300 pb-1 print:break-before-avoid">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-700">{children}</h2>
    </div>
  )
}

function Estado({ msg, tone = "muted" }) {
  return (
    <div
      className={`flex min-h-[120px] items-center justify-center border border-dashed px-4 text-center text-sm ${tone === "error" ? "border-stone-300 bg-stone-50 text-stone-700" : "border-stone-300 bg-stone-50 text-stone-500"
        }`}
    >
      {msg}
    </div>
  )
}

function PlainStatusBadge({ value }) {
  const normalized = String(value ?? "-")
  const isOk = ["OK", "ONLINE", "RESOLVIDO", "ENCERRADO", "OPERANDO"].includes(normalized)

  return (
    <span className={`inline-flex border px-2 py-0.5 text-xs font-medium ${isOk ? "border-stone-300 bg-white text-stone-700" : "border-stone-300 bg-stone-50 text-stone-800"}`}>
      {normalized}
    </span>
  )
}

function EmailMetric({ label, value, sub }) {
  return (
    <div className="border border-stone-200 bg-white p-3 print:border-stone-300">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mb-0 text-2xl font-semibold text-stone-900">{value}</p>
      {sub && <p className="mb-0 mt-1 text-xs text-stone-500">{sub}</p>}
    </div>
  )
}

function SummaryTable({ rows, emptyMessage = "Sem dados disponiveis" }) {
  if (rows.length === 0) {
    return <Estado msg={emptyMessage} />
  }

  return (
    <table className="w-full text-xs">
      <tbody className="divide-y divide-stone-100 bg-white">
        {rows.map((row) => (
          <tr key={row.label}>
            <th className="w-2/3 px-3 py-2 text-left font-medium text-stone-600">{row.label}</th>
            <td className="px-3 py-2 text-right font-semibold tabular-nums text-stone-900">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ReportPreviewPage({ children }) {
  return (
    <div className="report-preview-page mx-auto w-full max-w-[210mm] bg-white px-4 py-6 shadow-sm ring-1 ring-border/70 sm:px-6 sm:py-8 print:mx-0 print:max-w-none print:bg-white print:px-0 print:py-0 print:shadow-none print:ring-0">
      {children}
    </div>
  )
}

function ReportHeader({ title, meta, statusLabel, statusSub }) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-stone-300 pb-5 sm:flex-row sm:items-start sm:justify-between print:mb-6">
      <div className="min-w-0">
        <img src="/Orbis_extended.svg" alt="Orbis" className="mb-4 h-8 w-auto max-w-[170px] object-contain sm:h-9 sm:max-w-none print:h-8" />
        <p className="break-words text-sm font-semibold uppercase tracking-[0.14em] text-stone-800 sm:tracking-[0.18em]">{title}</p>
        {meta.map((item) => (
          <p key={item} className="mt-0.5 text-xs text-stone-500">
            {item}
          </p>
        ))}
      </div>
      <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
        <span className="border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-800">
          {statusLabel}
        </span>
        {statusSub && <span className="text-[10px] text-stone-500">{statusSub}</span>}
      </div>
    </div>
  )
}

function ConfigPanel({
  tipoRelatorio,
  setTipoRelatorio,
  maquinaId,
  setMaquinaId,
  maquinas,
  periodo,
  setPeriodo,
  secoes,
  onToggleSecao,
}) {
  return (
    <div className="print:hidden rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontalIcon className="size-4 text-[#3B2867] dark:text-white" />
          <h2 className="text-sm font-medium text-[#3B2867] dark:text-white">Configurar relatório</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Tipo
          <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipo de relatório" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="geral">Geral da frota</SelectItem>
                <SelectItem value="maquina">Máquina específica</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Máquina
          <Select value={maquinaId} onValueChange={setMaquinaId} disabled={tipoRelatorio !== "maquina" || maquinas.length === 0}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma máquina" />
            </SelectTrigger>
            <SelectContent>
              {maquinas.map((maquina) => (
                <SelectItem key={maquina.id} value={String(maquina.id)}>
                  {maquina.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Período
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap">
        {SECTION_OPTIONS.map((secao) => (
          <label key={secao.id} className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm text-foreground">
            <Checkbox
              checked={secoes[secao.id]}
              onCheckedChange={(checked) => onToggleSecao(secao.id, checked === true)}
            />
            {secao.label}
          </label>
        ))}
      </div>
    </div>
  )
}

function EmailAutomationPanel({
  destinatarios,
  onDestinatariosChange,
  frequencia,
  onFrequenciaChange,
  horario,
  onHorarioChange,
  diaSemana,
  onDiaSemanaChange,
  diaMes,
  onDiaMesChange,
  reportPeriodLabel,
  onSaveDraft,
  onSendNow,
}) {
  const selectedFrequency = EMAIL_FREQUENCY_OPTIONS.find((option) => option.value === frequencia)
  const hasDestinatarios = destinatarios.trim().length > 0
  const frequencyLabel = selectedFrequency?.label ?? "Recorrência"

  return (
    <div className="print:hidden rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex min-w-0 items-center gap-2">
        <MailIcon className="size-5 text-foreground" />
        <h2 className="m-0 text-sm font-semibold text-[#3B2867] dark:text-white">
          Envio por E-mail
        </h2>
      </div>

      <div className="grid gap-2">
        <Input
          value={destinatarios}
          onChange={(event) => onDestinatariosChange(event.target.value)}
          placeholder="email@empresa.com"
          className="h-9"
          type="email"
          inputMode="email"
        />

        <div className="grid grid-cols-2 gap-2">
          <Select value={frequencia} onValueChange={onFrequenciaChange}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Semanal" />
            </SelectTrigger>
            <SelectContent>
              {EMAIL_FREQUENCY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={horario}
            onChange={(event) => onHorarioChange(event.target.value)}
            className="h-9"
            type="time"
            aria-label="Horario do envio"
          />
        </div>

        {frequencia === "semanal" && (
          <Select value={diaSemana} onValueChange={onDiaSemanaChange}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Dia da semana" />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {frequencia === "mensal" && (
          <Select value={diaMes} onValueChange={onDiaMesChange}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Dia do mes" />
            </SelectTrigger>
            <SelectContent>
              {MONTH_DAY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          type="button"
          variant="secondary"
          className="h-9 bg-muted text-muted-foreground hover:bg-muted"
          onClick={onSaveDraft}
          disabled={!hasDestinatarios}
        >
          Salvar Agendamento
        </Button>

        <Button
          type="button"
          variant="outline"
          className="cursor-pointer mt-1 h-9 border-primary text-primary hover:bg-primary/10 hover:text-primary"
          onClick={onSendNow}
        >
          <SendIcon className="mr-1 size-4" />
          Enviar agora
        </Button>
      </div>

      <div className="mt-3 rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        Proximo envio: {frequencyLabel}
        {frequencia === "semanal" ? `, ${getWeekdayLabel(diaSemana)}` : ""}
        {frequencia === "mensal" ? `, dia ${diaMes}` : ""} as {horario || "08:00"}. Periodo do relatorio: {reportPeriodLabel}. O relatorio usara os filtros configurados acima.
      </div>
    </div>
  )
}

function ReportActionsPanel({ onRefresh, onPrint, refreshDisabled, printDisabled }) {
  return (
    <div className="print:hidden hidden rounded-xl border bg-card p-4 shadow-sm sm:block">
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" className="cursor-pointer h-10" onClick={onRefresh} disabled={refreshDisabled}>
          <RefreshCcwIcon className="mr-1 size-4" />
          Atualizar
        </Button>
        <Button
          type="button"
          className="cursor-pointer h-10 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onPrint}
          disabled={printDisabled}
        >
          <PrinterIcon className="mr-1 size-4" />
          Imprimir agora
        </Button>
      </div>
    </div>
  )
}

function SensoresTable({ sensores }) {
  if (sensores.length === 0) {
    return <Estado msg="Nenhum sensor vinculado a esta máquina" />
  }

  return (
    <table className="w-full min-w-[720px] text-xs print:min-w-0">
      <thead>
        <tr className="border-b border-stone-200 bg-stone-50 text-left print:bg-stone-100">
          <th className="px-3 py-2.5 font-semibold text-stone-600">Sensor</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Tipo</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Status</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600 text-right">Temperatura</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600 text-right">Vibração</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600 text-right">Ultimo sinal</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-100 bg-white">
        {sensores.map((sensor) => (
          <tr key={sensor.id} className={sensor.status !== "ONLINE" ? "bg-stone-50 print:bg-stone-50" : ""}>
            <td className="px-3 py-2 font-medium text-stone-900">{sensor.nome}</td>
            <td className="px-3 py-2 text-stone-600">{sensor.tipo}</td>
            <td className="px-3 py-2">
              <StatusBadge value={sensor.status} />
            </td>
            <td className="px-3 py-2 text-right text-stone-600">
              {sensor.temperatura ? `${sensor.temperatura.valorAtual} / ${sensor.temperatura.limiteMax}` : "-"}
            </td>
            <td className="px-3 py-2 text-right text-stone-600">
              {sensor.vibracao ? `${sensor.vibracao.valorAtual} / ${sensor.vibracao.limiteMax}` : "-"}
            </td>
            <td className="px-3 py-2 text-right text-stone-500">{tempoRelativo(sensor.ultimaLeituraEm)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ChamadosTable({ chamados }) {
  if (chamados.length === 0) {
    return <Estado msg="Nenhum chamado no período" />
  }

  return (
    <table className="w-full min-w-[720px] text-xs print:min-w-0">
      <thead>
        <tr className="border-b border-stone-200 bg-stone-50 text-left print:bg-stone-100">
          <th className="px-3 py-2.5 font-semibold text-stone-600">Máquina</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Tipo</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Severidade</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Status</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Sensor</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600 text-right">Criado</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-100 bg-white">
        {chamados.map((chamado, index) => {
          const isAlta = (chamado.severidade ?? chamado.criticidade) === "ALTA"
          return (
            <tr key={chamado.id ?? index} className={isAlta ? "bg-stone-50 print:bg-stone-50" : ""}>
              <td className="px-3 py-2 font-medium text-stone-900">{chamado.maquina ?? chamado.maquinaNome ?? "-"}</td>
              <td className="px-3 py-2 text-stone-600">{chamado.tipo ?? "-"}</td>
              <td className="px-3 py-2">
                <CriticidadeBadge value={chamado.severidade ?? chamado.criticidade ?? "MEDIA"} />
              </td>
              <td className="px-3 py-2">
                <StatusBadge value={["OK", "RESOLVIDO", "ENCERRADO"].includes(chamado.status) ? "OK" : "ALERTA"} />
              </td>
              <td className="px-3 py-2 text-stone-500">{chamado.sensor ?? chamado.sensorNome ?? "-"}</td>
              <td className="px-3 py-2 text-right text-stone-500">{tempoRelativo(chamado.criadoEm ?? chamado.createdAt)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function ChamadosReportTable({ chamados }) {
  if (chamados.length === 0) {
    return <Estado msg="Nenhum chamado no periodo" />
  }

  return (
    <table className="w-full min-w-[760px] text-xs print:min-w-0">
      <thead>
        <tr className="border-b border-stone-200 bg-stone-50 text-left print:bg-stone-100">
          <th className="px-3 py-2.5 font-semibold text-stone-600">Maquina</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Tipo</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Severidade</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Status</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Sensor</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600 text-right">Criado</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-100 bg-white">
        {chamados.map((chamado, index) => {
          const severidade = chamado.severidade ?? chamado.criticidade ?? "MEDIA"
          const isResolvido = ["RESOLVIDO", "ENCERRADO"].includes(chamado.status)

          return (
            <tr key={chamado.id ?? index} className={severidade === "ALTA" ? "bg-stone-50 print:bg-stone-50" : ""}>
              <td className="px-3 py-2 font-medium text-stone-900">{chamado.maquina ?? chamado.maquinaNome ?? "-"}</td>
              <td className="px-3 py-2 text-stone-600">{chamado.tipo ?? "-"}</td>
              <td className="px-3 py-2">
                <CriticidadeBadge value={severidade} />
              </td>
              <td className="px-3 py-2">
                <PlainStatusBadge value={isResolvido ? "RESOLVIDO" : "ABERTO"} />
              </td>
              <td className="px-3 py-2 text-stone-600">{chamado.sensor ?? chamado.sensorNome ?? "-"}</td>
              <td className="px-3 py-2 text-right text-stone-500">{formatReportDate(chamado.criadoEm ?? chamado.createdAt)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function MaquinasEmailTable({ maquinas }) {
  return (
    <table className="w-full min-w-[720px] text-xs print:min-w-0">
      <thead>
        <tr className="border-b border-stone-200 bg-stone-50 text-left print:bg-stone-100">
          <th className="px-3 py-2.5 font-semibold text-stone-600">Maquina</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Setor</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Tipo</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Importancia</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Status</th>
          <th className="px-3 py-2.5 text-right font-semibold text-stone-600">Integridade</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-100 bg-white">
        {maquinas.map((maquina, index) => {
          const isAlerta = maquina.status !== "OK"
          const integridade = toReportNumber(maquina.integridade)

          return (
            <tr key={maquina.id ?? index} className={isAlerta ? "bg-stone-50 print:bg-stone-50" : ""}>
              <td className="px-3 py-2 font-medium text-stone-900">{maquina.nome ?? "-"}</td>
              <td className="px-3 py-2 text-stone-600">{maquina.setor ?? "-"}</td>
              <td className="px-3 py-2 text-stone-600">{maquina.tipo ?? "-"}</td>
              <td className="px-3 py-2">
                <CriticidadeBadge value={maquina.criticidade ?? "MEDIA"} />
              </td>
              <td className="px-3 py-2">
                <PlainStatusBadge value={isAlerta ? "ALERTA" : "OK"} />
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums text-stone-900">{integridade}%</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function RelatorioOperacional({
  relatorio,
  status,
  mensagem,
  geradoEm,
  periodoLabel,
  secoes,
  tipoRelatorio,
  selectedMaquina,
}) {
  const isLoading = status === "loading"
  const resumo = relatorio?.resumo ?? normalizeReportPayload(null, periodoLabel).resumo
  const maquinas = relatorio?.maquinas ?? []
  const alertas = relatorio?.alertas ?? relatorio?.chamados ?? []
  const reportPeriodLabel = relatorio?.periodoLabel ?? periodoLabel
  const isMaquina = tipoRelatorio === "maquina"
  const escopoLabel = isMaquina ? selectedMaquina?.nome ?? "Maquina especifica" : "Completo"
  const integridadeMedia = Math.round(resumo.integridadeMedia)
  const statusLabel = isLoading
    ? "Carregando"
    : integridadeMedia >= 75
      ? "Frota Estavel"
      : integridadeMedia >= 50
        ? "Atencao Necessaria"
        : "Estado Critico"
  const maquinasVisiveis = maquinas.slice(0, 15)
  const alertasVisiveis = alertas.slice(0, 10)

  if (relatorio?.html) {
    return (
      <div className="report-html-preview mx-auto w-full max-w-[760px] overflow-hidden rounded-sm bg-white shadow-sm ring-1 ring-border/70 print:max-w-none print:shadow-none print:ring-0">
        <div dangerouslySetInnerHTML={{ __html: relatorio.html }} />
      </div>
    )
  }

  return (
    <ReportPreviewPage>
      <div className="mx-auto max-w-[680px] border border-stone-200 bg-white print:max-w-none print:border-stone-300">
        <ReportHeader
          title="Relatorio Operacional"
          meta={[`Gerado em ${geradoEm}`, `Periodo: ${reportPeriodLabel}`, `Escopo: ${escopoLabel}`]}
          statusLabel={statusLabel}
          statusSub={isLoading ? "Aguardando dados do backend" : `Integridade media: ${integridadeMedia}%`}
        />

        {mensagem && status === "error" && (
          <div className="mb-6">
            <Estado msg={mensagem} tone="error" />
          </div>
        )}

        <div className="px-4 pb-6 sm:px-6 print:px-4">
          {secoes.resumo && (
            <div className="mb-6 print:mb-4">
              <SectionTitle>Visao Geral da Frota</SectionTitle>
              {isLoading ? (
                <div className="mt-3">
                  <Estado msg="Carregando resumo..." />
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
                  <EmailMetric label="Maquinas ativas" value={resumo.totalMaquinas} sub={`${resumo.maquinasFuncionando} OK - ${resumo.maquinasEmAlerta} em alerta`} />
                  <EmailMetric label="Alta importancia" value={resumo.maquinasAltaImportancia} sub="Maquinas criticas" />
                  <EmailMetric label="Integridade media" value={`${integridadeMedia}%`} sub="Media de toda a frota" />
                  <EmailMetric label="Chamados abertos" value={resumo.alertasAtivos} sub={`${resumo.alertasAtendidosHoje} atendidos hoje`} />
                </div>
              )}
            </div>
          )}

          <div className="mb-6 print:mb-4">
            <div className="border border-stone-200 bg-white p-4 print:border-stone-300">
              <div className="mb-2 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">Integridade da frota</span>
                <span className="text-sm font-semibold text-stone-900">{isLoading ? "--" : `${integridadeMedia}%`}</span>
              </div>
              <div className="h-2 w-full bg-stone-200">
                <div className="h-2 bg-[#8000ff]" style={{ width: `${Math.min(100, Math.max(0, integridadeMedia))}%` }} />
              </div>
            </div>
          </div>

          {secoes.indicadores && (
            <div className="mb-6 print:mb-4">
              <SectionTitle>Indicadores Operacionais</SectionTitle>
              {isLoading ? (
                <div className="mt-3">
                  <Estado msg="Carregando indicadores..." />
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
                  <EmailMetric label="Alertas hoje" value={resumo.alertasHoje} sub="Novos chamados hoje" />
                  <EmailMetric label="Sem atendimento" value={resumo.alertaSemAtendimento} sub="Chamados sem resposta" />
                  <EmailMetric label="Sensores online" value={resumo.sensoresOnline} sub="Sensores ativos" />
                  <EmailMetric label="Tecnicos ativos" value={resumo.tecnicosAtivos} sub="Disponiveis agora" />
                </div>
              )}
            </div>
          )}

          {secoes.maquinas && (
            <div className="mb-6 print:mb-4">
              <SectionTitle>Inventario de Maquinas</SectionTitle>
              <div className="mt-3 overflow-x-auto border border-stone-200 print:overflow-visible print:border-stone-300">
                {isLoading ? (
                  <Estado msg="Carregando maquinas..." />
                ) : maquinasVisiveis.length === 0 ? (
                  <Estado msg="Nenhuma maquina no relatorio" />
                ) : (
                  <>
                    <MaquinasEmailTable maquinas={maquinasVisiveis} />
                    {maquinas.length > maquinasVisiveis.length && (
                      <p className="mb-0 border-t border-stone-200 bg-stone-50 px-3 py-2 text-center text-xs text-stone-500">
                        + {maquinas.length - maquinasVisiveis.length} maquinas nao exibidas. Acesse o dashboard para ver a lista completa.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {secoes.chamados && (
            <div className="mb-6 print:mb-4">
              <SectionTitle>Chamados Tecnicos</SectionTitle>
              <div className="mt-3 overflow-x-auto border border-stone-200 print:overflow-visible print:border-stone-300">
                {isLoading ? (
                  <Estado msg="Carregando chamados..." />
                ) : alertasVisiveis.length === 0 ? (
                  <Estado msg="Nenhum chamado no periodo selecionado." />
                ) : (
                  <>
                    <ChamadosReportTable chamados={alertasVisiveis} />
                    {alertas.length > alertasVisiveis.length && (
                      <p className="mb-0 border-t border-stone-200 bg-stone-50 px-3 py-2 text-center text-xs text-stone-500">
                        + {alertas.length - alertasVisiveis.length} chamados nao exibidos. Acesse o dashboard para ver todos.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-500 print:border-stone-300">
            Este relatorio foi gerado automaticamente pelo sistema Orbis.
          </div>
        </div>
      </div>
    </ReportPreviewPage>
  )
}

export default function RelatoriosPage() {
  const router = useRouter()
  const {
    maquinas,
    status: maquinasStatus,
    mensagem: maquinasMensagem,
    carregando: loadingMaquinas,
    recarregarMaquinas,
  } = useMaquinas()

  const [tipoRelatorio, setTipoRelatorio] = React.useState("geral")
  const [maquinaId, setMaquinaId] = React.useState("")
  const [periodo, setPeriodo] = React.useState("30d")
  const [secoes, setSecoes] = React.useState(DEFAULT_SECTIONS)
  const [relatorio, setRelatorio] = React.useState(() => normalizeReportPayload(null, getPeriodLabel("30d")))
  const [relatorioStatus, setRelatorioStatus] = React.useState("idle")
  const [relatorioMensagem, setRelatorioMensagem] = React.useState("")
  const [refreshError, setRefreshError] = React.useState(null)
  const [emailDestinatarios, setEmailDestinatarios] = React.useState("")
  const [emailFrequencia, setEmailFrequencia] = React.useState("semanal")
  const [emailHorario, setEmailHorario] = React.useState("08:00")
  const [emailDiaSemana, setEmailDiaSemana] = React.useState("segunda")
  const [emailDiaMes, setEmailDiaMes] = React.useState("1")
  const [geradoEm, setGeradoEm] = React.useState(formatDate())
  const relatorioRequestIdRef = React.useRef(0)

  React.useEffect(() => {
    if (!maquinaId && maquinas.length > 0) {
      setMaquinaId(String(maquinas[0].id))
    }

  }, [maquinaId, maquinas])

  const selectedMaquina = React.useMemo(
    () => maquinas.find((maquina) => String(maquina.id) === String(maquinaId)) ?? null,
    [maquinaId, maquinas]
  )
  const periodoLabel = getPeriodLabel(periodo)
  const isRelatorioMaquina = tipoRelatorio === "maquina"
  const canFetchRelatorio = tipoRelatorio !== "maquina" || Boolean(selectedMaquina)

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(EMAIL_DRAFT_STORAGE_KEY)

      if (!saved) {
        return
      }

      const draft = JSON.parse(saved)

      if (typeof draft.destinatarios === "string") {
        setEmailDestinatarios(draft.destinatarios)
      }

      if (EMAIL_FREQUENCY_OPTIONS.some((option) => option.value === draft.frequencia)) {
        setEmailFrequencia(draft.frequencia)
      }

      if (typeof draft.horario === "string" && /^\d{2}:\d{2}$/.test(draft.horario)) {
        setEmailHorario(draft.horario)
      }

      if (WEEKDAY_OPTIONS.some((option) => option.value === draft.diaSemana)) {
        setEmailDiaSemana(draft.diaSemana)
      }

      if (MONTH_DAY_OPTIONS.some((option) => option.value === String(draft.diaMes))) {
        setEmailDiaMes(String(draft.diaMes))
      }

    } catch {
      window.localStorage.removeItem(EMAIL_DRAFT_STORAGE_KEY)
    }
  }, [])

  const carregarRelatorio = React.useCallback(async () => {
    const requestId = relatorioRequestIdRef.current + 1
    relatorioRequestIdRef.current = requestId

    if (!canFetchRelatorio) {
      setRelatorio(normalizeReportPayload(null, periodoLabel))
      setRelatorioStatus("idle")
      setRelatorioMensagem("Selecione uma maquina para gerar o relatorio.")
      return
    }

    const session = getAuthSession()
    if (!session?.accessToken) {
      setRelatorioStatus("error")
      setRelatorioMensagem("Sua sessao expirou. Faca login novamente.")
      return
    }

    setRelatorioStatus("loading")
    setRelatorioMensagem("")

    try {
      const requestPayload = buildReportPayload({
        tipoRelatorio,
        maquinaId: selectedMaquina?.id ?? maquinaId,
        periodo,
        secoes,
      })
      const payload = await requestRelatorio(requestPayload, session.accessToken)

      if (relatorioRequestIdRef.current !== requestId) return
      setRelatorio(normalizeReportPayload(payload, periodoLabel))
      setGeradoEm(formatDate())
      setRelatorioStatus("success")
    } catch (error) {
      if (relatorioRequestIdRef.current !== requestId) return
      setRelatorioStatus("error")
      setRelatorioMensagem(error instanceof Error ? error.message : "Falha ao carregar relatorio.")
    }
  }, [canFetchRelatorio, maquinaId, periodo, periodoLabel, secoes, selectedMaquina, tipoRelatorio])

  React.useEffect(() => {
    carregarRelatorio()
  }, [carregarRelatorio])

  function onToggleSecao(secao, checked) {
    setSecoes((current) => ({ ...current, [secao]: checked }))
  }

  function recarregar() {
    setRefreshError(null)
    Promise.allSettled([recarregarMaquinas(), carregarRelatorio()]).then((results) => {
      const rejected = results.find((result) => result.status === "rejected")
      if (rejected) {
      setRefreshError(rejected.reason instanceof Error ? rejected.reason.message : "Falha ao atualizar relatório")
      }
    })
  }

  function getEmailAutomationPayload() {
    const dataWindow = getEmailDataWindow(emailFrequencia)
    const relatorioPayload = buildReportPayload({
      tipoRelatorio,
      maquinaId: selectedMaquina?.id ?? maquinaId,
      periodo,
      secoes,
    })

    return {
      ...relatorioPayload,
      janelaDados: {
        ...dataWindow,
        label: getPeriodLabel(periodo),
        periodo,
        periodoDias: getPeriodDays(periodo),
      },
      recorrencia: emailFrequencia,
      horario: emailHorario,
      diaSemana: emailFrequencia === "semanal" ? emailDiaSemana : null,
      diaMes: emailFrequencia === "mensal" ? Number(emailDiaMes) : null,
      destinatarios: emailDestinatarios
        .split(/[;,]/)
        .map((email) => email.trim())
        .filter(Boolean),
    }
  }

  function salvarRascunhoEmail() {
    const payload = getEmailAutomationPayload()

    window.localStorage.setItem(
      EMAIL_DRAFT_STORAGE_KEY,
      JSON.stringify({
        destinatarios: emailDestinatarios,
        frequencia: emailFrequencia,
        horario: emailHorario,
        diaSemana: emailDiaSemana,
        diaMes: emailDiaMes,
        filtrosRelatorio: {
          tipoRelatorio,
          maquinaId,
          periodo,
          secoes,
        },
        atualizadoEm: new Date().toISOString(),
        payload,
      })
    )

    toast.success("Agendamento de e-mail atualizado.")
  }

  function enviarRelatorioAgora() {
    const payload = getEmailAutomationPayload()
    const destinatarios = payload.destinatarios

    if (destinatarios.length === 0) {
      toast.error("Informe pelo menos um destinatario.")
      return
    }

    if (tipoRelatorio === "maquina" && payload.filtros.maquinasIds.length === 0) {
      toast.error("Selecione a maquina do relatorio por e-mail.")
      return
    }

    toast.success(`Solicitacao pronta para enviar a ${destinatarios.length} destinatario(s) quando o backend estiver conectado.`)
  }

  const errorMsg = relatorioStatus === "error" ? relatorioMensagem : maquinasStatus === "error" ? maquinasMensagem : refreshError
  const carregandoTudo = loadingMaquinas || relatorioStatus === "loading"

  return (
    <>
      <div className="print:hidden">
        <SiteHeader />
      </div>

      <main className="flex flex-col gap-6 p-6 print:block print:p-0">
        <div className="print:hidden flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <UITooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" className="cursor-pointer" size="icon-sm" onClick={() => router.push("/dashboard")}>
                  <ArrowLeftIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="mb-0!">Voltar ao dashboard</p>
              </TooltipContent>
            </UITooltip>
            <div className="flex min-w-0 items-center gap-2">
              <PrinterIcon size={22} className="text-[#3B2867] dark:text-white" />
              <h1 className="truncate text-[18pt]! font-medium text-[#3B2867] dark:text-white">Relatórios</h1>
            </div>
            {carregandoTudo && <span className="animate-pulse text-xs text-muted-foreground">Carregando dados...</span>}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={recarregar} disabled={carregandoTudo}>
              <RefreshCcwIcon className="mr-1 size-4" />
              Atualizar
            </Button>
            <Button
              size="sm"
              className="cursor-pointer w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
              onClick={() => window.print()}
              disabled={carregandoTudo || (tipoRelatorio === "maquina" && !selectedMaquina)}
            >
              <PrinterIcon className="mr-1 size-4" />
              Imprimir / PDF
            </Button>
          </div>
        </div>

        <Separator className="print:hidden" />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(320px,480px)_minmax(0,1fr)] print:block">
          <aside className="print:hidden flex min-h-0 flex-col gap-4 lg:sticky lg:top-6">
            <ConfigPanel
              tipoRelatorio={tipoRelatorio}
              setTipoRelatorio={setTipoRelatorio}
              maquinaId={maquinaId}
              setMaquinaId={setMaquinaId}
              maquinas={maquinas}
              periodo={periodo}
              setPeriodo={setPeriodo}
              secoes={secoes}
              onToggleSecao={onToggleSecao}
            />

            <EmailAutomationPanel
              destinatarios={emailDestinatarios}
              onDestinatariosChange={setEmailDestinatarios}
              frequencia={emailFrequencia}
              onFrequenciaChange={setEmailFrequencia}
              horario={emailHorario}
              onHorarioChange={setEmailHorario}
              diaSemana={emailDiaSemana}
              onDiaSemanaChange={setEmailDiaSemana}
              diaMes={emailDiaMes}
              onDiaMesChange={setEmailDiaMes}
              reportPeriodLabel={periodoLabel}
              onSaveDraft={salvarRascunhoEmail}
              onSendNow={enviarRelatorioAgora}
            />

            <ReportActionsPanel
              onRefresh={recarregar}
              onPrint={() => window.print()}
              refreshDisabled={carregandoTudo}
              printDisabled={carregandoTudo || (tipoRelatorio === "maquina" && !selectedMaquina)}
            />

            {errorMsg && (
              <div className="flex flex-col gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start">
                <span>{errorMsg}</span>
                <Button variant="outline" size="sm" className="cursor-pointer" onClick={recarregar}>
                  Tentar novamente
                </Button>
              </div>
            )}
          </aside>
           
          <section className="min-w-0 print:block print:p-0">
          <div
            id="relatorio-conteudo"
            className="report-preview-stack flex w-full flex-col gap-6 pb-6 print:block print:gap-0 print:pb-0 print:px-[1.2cm] print:py-[1cm] print:text-black"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <RelatorioOperacional
              relatorio={relatorio}
              status={relatorioStatus}
              mensagem={relatorioMensagem}
              geradoEm={geradoEm}
              periodoLabel={periodoLabel}
              secoes={secoes}
              tipoRelatorio={tipoRelatorio}
              selectedMaquina={selectedMaquina}
            />
          </div>
        </section>
      </div>
    </main >

      <style jsx global>{`
        .report-preview-stack {
          counter-reset: report-page;
        }

        .report-preview-page {
          counter-increment: report-page;
          position: relative;
        }

        .report-preview-page::after {
          bottom: 10px;
          color: #78716c;
          content: "Página " counter(report-page);
          font-size: 10px;
          position: absolute;
          right: 14px;
        }

        @media (min-width: 1024px) {
          .report-preview-page {
            min-height: 297mm;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 1cm 1.2cm;
          }

          html,
          body,
          main,
          section,
          #relatorio-conteudo,
          .report-preview-stack,
          .report-preview-page {
            background: #ffffff !important;
            color: #111827 !important;
            color-scheme: light !important;
          }

          .report-preview-stack,
          .report-preview-page {
            display: block !important;
          }

          .report-preview-page {
            min-height: 0 !important;
          }

          .report-preview-page::after {
            display: none !important;
          }

          header,
          nav,
          aside,
          [data-sidebar],
          [data-radix-popper-content-wrapper],
          .print\\:hidden {
            display: none !important;
          }

          body {
            background: white !important;
            color: black !important;
            font-size: 10pt !important;
          }

          #relatorio-conteudo :is(h1, h2, h3, h4, h5, h6, p, span, td, th, label) {
            color: inherit;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #relatorio-conteudo {
            padding-top: 0.6cm !important;
            padding-bottom: 0.6cm !important;
          }

          #relatorio-conteudo > div {
            break-inside: auto;
          }

          table { page-break-inside: auto; }
          tr    { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }

          .border {
            border-color: #D1D5DB !important;
          }
        }
      `}</style>
    </>
  )
}

function RelatorioGeral({
  geradoEm,
  periodoLabel,
  secoes,
  loadingMaquinas,
  totalMaquinas,
  totalOk,
  totalAlerta,
  criticasAlta,
  integridadeMedia,
  chamados,
  chamadosAbertos,
  chamadosResolvidos,
  maquinas,
  pieStatus,
  barCriticidade,
  tendencia,
  radarData,
}) {
  return (
    <>
      <ReportPreviewPage>
        <ReportHeader
          title="Relatório Operacional"
          meta={[`Gerado em ${geradoEm}`, `Frota de ${totalMaquinas} máquinas monitoradas - Período: ${periodoLabel}`]}
          statusLabel={integridadeMedia >= 75 ? "Frota Estável" : integridadeMedia >= 50 ? "Atenção Necessária" : "Estado Crítico"}
          statusSub={`Integridade média: ${integridadeMedia}%`}
        />

        {secoes.resumo && (
          <div className="mb-6 print:mb-4">
            <SectionTitle>Visão Geral da Frota</SectionTitle>
            <div className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
              <MetricCard icon={WashingMachineIcon} label="Máquinas ativas" value={loadingMaquinas ? "--" : totalMaquinas} sub={`${totalOk} OK - ${totalAlerta} em alerta`} />
              <MetricCard icon={ShieldAlertIcon} label="Alta importância" value={loadingMaquinas ? "--" : criticasAlta} sub="Máquinas críticas" color={COLORS.alerta} />
              <MetricCard icon={ActivityIcon} label="Integridade média" value={loadingMaquinas ? "--" : `${integridadeMedia}%`} sub="Média de toda a frota" color={integridadeMedia >= 75 ? COLORS.ok : integridadeMedia >= 50 ? COLORS.medio : COLORS.alerta} />
              <MetricCard icon={ZapIcon} label="Alertas abertos" value={chamadosAbertos} sub={`${chamadosResolvidos} resolvidos no período`} color={chamadosAbertos > 0 ? COLORS.medio : COLORS.ok} />
            </div>
          </div>
        )}

        {(secoes.desempenho || secoes.historico) && (
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 print:mb-4 print:grid-cols-2 print:gap-3">
            {secoes.desempenho && (
              <>
                <div className="break-inside-avoid border  border-stone-200 bg-white p-5 sm:p-4 print:border-stone-300 print:p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-stone-500">Status das máquinas</p>
                  {loadingMaquinas ? (
                    <Estado msg="Carregando..." />
                  ) : pieStatus.length === 0 ? (
                    <Estado msg="Sem dados de status" />
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart margin={{ top: 8, right: 8, bottom: 18, left: 8 }}>
                        <Pie data={pieStatus} cx="50%" cy="45%" innerRadius={42} outerRadius={66} dataKey="value" labelLine={false}>
                          {pieStatus.map((_, index) => <Cell key={index} fill={PIE_COLORS[index]} />)}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                        <Legend verticalAlign="bottom" iconType="circle" iconSize={8} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="break-inside-avoid border border-stone-200 bg-white p-3 sm:p-4 print:border-stone-300 print:p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-stone-500">Máquinas por importância</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={barCriticidade} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="Operando" fill={COLORS.primary} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Em alerta" fill={COLORS.alerta} radius={[0, 0, 0, 0]} />
                      <Legend iconType="square" iconSize={8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {secoes.historico && (
              <div className="break-inside-avoid border border-stone-200 bg-white p-3 sm:col-span-2 sm:p-4 print:border-stone-300 print:p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-stone-500">Tendência de alertas - {periodoLabel}</p>
                {tendencia.length === 0 ? (
                  <Estado msg="Sem dados de tendência disponíveis" />
                ) : (
                  <ResponsiveContainer width="100%" height={130}>
                    <AreaChart data={tendencia} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                      <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="alertas" stroke={COLORS.primary} strokeWidth={2} fill={COLORS.primary} fillOpacity={0.08} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {secoes.desempenho && radarData.length > 0 && (
              <div className="break-inside-avoid border border-stone-200 bg-white p-3 sm:col-span-2 sm:p-4 print:border-stone-300 print:p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-stone-500">Integridade por setor</p>
                <ResponsiveContainer width="100%" height={150}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis dataKey="setor" tick={{ fontSize: 11 }} />
                    <Radar dataKey="integridade" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.08} />
                    <Tooltip formatter={(value) => [`${value}%`, "Integridade"]} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </ReportPreviewPage>

      {(secoes.desempenho || secoes.chamados) && (
        <ReportPreviewPage>
          {secoes.desempenho && (
            <div className="mb-6 print:mb-4 print:break-before-page">
              <SectionTitle>Inventário de Máquinas</SectionTitle>
              <div className="mt-3 overflow-x-auto border border-stone-200 print:overflow-visible print:border-stone-300">
                {loadingMaquinas ? <Estado msg="Carregando máquinas..." /> : <MaquinasTable maquinas={maquinas} totalMaquinas={totalMaquinas} totalOk={totalOk} totalAlerta={totalAlerta} integridadeMedia={integridadeMedia} />}
              </div>
            </div>
          )}

          {secoes.chamados && (
            <div className="mb-6 print:mb-4">
              <SectionTitle>Alertas Técnicos</SectionTitle>
              <div className="mt-3 overflow-x-auto border border-stone-200 print:overflow-visible print:border-stone-300">
                <ChamadosTable chamados={chamados} />
              </div>
            </div>
          )}
        </ReportPreviewPage>
      )}
    </>
  )
}

function RelatorioMaquina({
  maquina,
  periodoLabel,
  geradoEm,
  secoes,
  metricas,
  sensores,
  chamados,
  historico,
  historicoStatus,
  historicoMensagem,
}) {
  return (
    <>
      <ReportPreviewPage>
        <ReportHeader
          title={`Relatório de Máquina - ${maquina.nome}`}
          meta={[
            `Gerado em ${geradoEm}`,
            `${maquina.setor} - ${maquina.tipo} - Período: ${periodoLabel}`,
            `Importância: ${maquina.criticidade} - Último sinal: ${tempoRelativo(maquina.ultimaLeituraEm)}`,
          ]}
          statusLabel={maquina.status === "OK" ? "Operando" : "Em alerta"}
          statusSub={`Integridade atual: ${maquina.integridade}%`}
        />

        {secoes.resumo && (
          <div className="mb-6 print:mb-4">
            <SectionTitle>Resumo da Máquina</SectionTitle>
            <div className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
              <MetricCard icon={GaugeIcon} label="Integridade" value={`${metricas.integridade}%`} sub="Valor atual" color={metricas.integridade >= 75 ? COLORS.ok : metricas.integridade >= 50 ? COLORS.medio : COLORS.alerta} />
              <MetricCard icon={ActivityIcon} label="Estabilidade" value={`${metricas.estabilidade}%`} sub="Score operacional" color={metricas.estabilidade >= 75 ? COLORS.ok : metricas.estabilidade >= 50 ? COLORS.medio : COLORS.alerta} />
              <MetricCard icon={WashingMachineIcon} label="Sensores" value={metricas.sensoresTotal} sub={`${metricas.sensoresOnline} online`} />
              <MetricCard icon={ZapIcon} label="Alertas abertos" value={metricas.chamadosAbertos} sub={`${metricas.chamadosResolvidos} resolvidos`} color={metricas.chamadosAbertos > 0 ? COLORS.medio : COLORS.ok} />
            </div>
          </div>
        )}

        {secoes.desempenho && (
          <div className="mb-6 print:mb-4">
            <SectionTitle>Desempenho e Integridade</SectionTitle>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="border border-stone-200 bg-white p-3 sm:p-4 print:border-stone-300">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Status atual</p>
                <div className="mt-3">
                  <StatusBadge value={maquina.status} />
                </div>
              </div>
              <div className="border border-stone-200 bg-white p-3 sm:p-4 print:border-stone-300">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Importância</p>
                <div className="mt-3">
                  <CriticidadeBadge value={maquina.criticidade} />
                </div>
              </div>
              <div className="border border-stone-200 bg-white p-3 sm:p-4 print:border-stone-300">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Último sinal</p>
                <p className="mt-3 text-sm font-semibold text-stone-900">{tempoRelativo(maquina.ultimaLeituraEm)}</p>
              </div>
            </div>
          </div>
        )}

        {secoes.historico && (
          <div className="mb-6 print:mb-4">
            <SectionTitle>Histórico de Integridade - {periodoLabel}</SectionTitle>
            <div className="mt-3 break-inside-avoid border border-stone-200 bg-white p-3 sm:p-4 print:border-stone-300 print:p-3">
              {historicoStatus === "loading" ? (
                <Estado msg="Carregando histórico..." />
              ) : historico.length === 0 ? (
                <Estado msg={historicoMensagem || "Sem histórico disponível para o período"} />
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={historico} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                    <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="integridade" name="Integridade" stroke={COLORS.primary} strokeWidth={2} fill={COLORS.primary} fillOpacity={0.08} dot={false} />
                    <Area type="monotone" dataKey="scoreEstabilidade" name="Estabilidade" stroke={COLORS.medio} strokeWidth={2} fill={COLORS.medio} fillOpacity={0.05} dot={false} />
                    <Legend iconType="square" iconSize={8} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </ReportPreviewPage>

      {(secoes.sensores || secoes.chamados) && (
        <ReportPreviewPage>
          {secoes.sensores && (
            <div className="mb-6 print:mb-4">
              <SectionTitle>Sensores Vinculados</SectionTitle>
              <div className="mt-3 overflow-x-auto border border-stone-200 print:overflow-visible print:border-stone-300">
                <SensoresTable sensores={sensores} />
              </div>
            </div>
          )}

          {secoes.chamados && (
            <div className="mb-6 print:mb-4">
              <SectionTitle>Alertas da Máquina</SectionTitle>
              <div className="mt-3 overflow-x-auto border border-stone-200 print:overflow-visible print:border-stone-300">
                <ChamadosTable chamados={chamados} />
              </div>
            </div>
          )}
        </ReportPreviewPage>
      )}
    </>
  )
}

function MaquinasTable({ maquinas, totalMaquinas, totalOk, totalAlerta, integridadeMedia }) {
  if (maquinas.length === 0) {
    return <Estado msg="Nenhuma máquina encontrada" />
  }

  return (
    <table className="w-full min-w-[720px] text-xs print:min-w-0">
      <thead>
        <tr className="border-b border-stone-200 bg-stone-50 text-left print:bg-stone-100">
          <th className="px-3 py-2.5 font-semibold text-stone-600">Máquina</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Setor</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Tipo</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Importância</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Status</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600 text-right">Integridade</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600 text-right">Último sinal</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-100 bg-white">
        {maquinas.map((maquina, index) => (
          <tr key={maquina.id ?? index} className={maquina.status !== "OK" ? "bg-stone-50 print:bg-stone-50" : ""}>
            <td className="px-3 py-2 font-medium text-stone-900">{maquina.nome}</td>
            <td className="px-3 py-2 text-stone-600">{maquina.setor}</td>
            <td className="px-3 py-2 text-stone-600">{maquina.tipo}</td>
            <td className="px-3 py-2">
              <CriticidadeBadge value={maquina.criticidade} />
            </td>
            <td className="px-3 py-2">
              <StatusBadge value={maquina.status} />
            </td>
            <td className="px-3 py-2 text-right">
              <span className="font-semibold tabular-nums text-stone-800">{maquina.integridade ?? 0}%</span>
            </td>
            <td className="px-3 py-2 text-right text-stone-500">{tempoRelativo(maquina.ultimaLeituraEm)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t border-stone-200 bg-stone-50 print:bg-stone-100">
          <td colSpan={5} className="px-3 py-2 text-xs text-stone-500">
            {totalMaquinas} máquinas - {totalOk} OK - {totalAlerta} em alerta
          </td>
          <td className="px-3 py-2 text-right text-xs font-semibold text-stone-800">Média: {integridadeMedia}%</td>
          <td />
        </tr>
      </tfoot>
    </table>
  )
}
