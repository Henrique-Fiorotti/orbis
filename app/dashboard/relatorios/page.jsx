"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
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
import { useAlertas } from "@/components/context/alertas-context"
import { useMaquinas } from "@/components/context/maquinas-context"
import { useSensores } from "@/components/context/sensores-context"
import { getAuthSession } from "@/lib/auth-session"
import { extractCollection, requestDashboardJson } from "@/lib/dashboard-api"
import { tempoRelativo } from "@/lib/utils"

const COLORS = {
  primary: "#8000ff",
  primaryLight: "#6B5A8F",
  ok: "#4B7F52",
  alerta: "#ff5e00",
  medio: "#8A6A2F",
}

const PIE_COLORS = ["#8000ff", "#ff5e00"]

const PERIOD_OPTIONS = [
  { value: "7d", label: "7 dias", days: 7 },
  { value: "15d", label: "15 dias", days: 15 },
  { value: "30d", label: "30 dias", days: 30 },
  { value: "90d", label: "90 dias", days: 90 },
]

const SECTION_OPTIONS = [
  { id: "resumo", label: "Resumo" },
  { id: "desempenho", label: "Desempenho" },
  { id: "sensores", label: "Sensores" },
  { id: "chamados", label: "Chamados" },
  { id: "historico", label: "Histórico de Tendência" },
]

const DEFAULT_SECTIONS = {
  resumo: true,
  desempenho: true,
  sensores: true,
  chamados: true,
  historico: true,
}

const EMAIL_DRAFT_STORAGE_KEY = "orbis-report-email-draft"

const EMAIL_FREQUENCY_OPTIONS = [
  { value: "semanal", label: "Semanal", detail: "Segundas-feiras as 08:00" },
  { value: "diario", label: "Diario", detail: "Todos os dias as 08:00" },
  { value: "mensal", label: "Mensal", detail: "Todo dia 1 as 08:00" },
]

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
  const map = { ALTA: "Alta", MEDIA: "Media", BAIXA: "Baixa" }
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
        <h2 className="text-sm font-medium text-[#3B2867] dark:text-white">Configurar relatorio</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Tipo
          <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipo de relatorio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="geral">Geral da frota</SelectItem>
              <SelectItem value="maquina">Maquina especifica</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Maquina
          <Select value={maquinaId} onValueChange={setMaquinaId} disabled={tipoRelatorio !== "maquina" || maquinas.length === 0}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma maquina" />
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
          Periodo
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Periodo" />
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
  periodoLabel,
  onSaveDraft,
  onSendNow,
}) {
  const selectedFrequency = EMAIL_FREQUENCY_OPTIONS.find((option) => option.value === frequencia)

  return (
    <div className="print:hidden rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <MailIcon className="size-4 text-[#3B2867] dark:text-white" />
          <div className="min-w-0">
            <h2 className="m-0 text-sm font-medium text-[#3B2867] dark:text-white">
              Envio por e-mail
            </h2>
            <p className="m-0 mt-1 text-xs text-muted-foreground">
              Relatórios recorrentes enviados automaticamente pela integracao Resend.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 font-medium text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300">
            Resend ativo
          </span>
          <span className="rounded-full border bg-muted px-2 py-0.5 text-muted-foreground">
            {periodoLabel}
          </span>
          <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/30 dark:text-purple-300">
            Agendamento sincronizado
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Destinatarios deste envio
          <Input
            value={destinatarios}
            onChange={(event) => onDestinatariosChange(event.target.value)}
            placeholder="email@empresa.com, equipe@empresa.com"
            className="h-9"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Recorrencia sugerida
          <Select value={frequencia} onValueChange={onFrequenciaChange}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Recorrencia" />
            </SelectTrigger>
            <SelectContent>
              {EMAIL_FREQUENCY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <div className="grid grid-cols-2 gap-2 sm:col-span-2">
          <Button type="button" variant="outline" className="cursor-pointer h-9" onClick={onSaveDraft}>
            Salvar agendamento
          </Button>
          <Button
            type="button"
            className="cursor-pointer h-9 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onSendNow}
          >
            <SendIcon className="mr-1 size-4" />
            Enviar agora
          </Button>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        Proximo envio: {selectedFrequency?.detail ?? "recorrencia nao definida"}. O relatorio considera as secoes e filtros selecionados acima.
      </div>
    </div>
  )
}

function SensoresTable({ sensores }) {
  if (sensores.length === 0) {
    return <Estado msg="Nenhum sensor vinculado a esta maquina" />
  }

  return (
    <table className="w-full min-w-[720px] text-xs print:min-w-0">
      <thead>
        <tr className="border-b border-stone-200 bg-stone-50 text-left print:bg-stone-100">
          <th className="px-3 py-2.5 font-semibold text-stone-600">Sensor</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Tipo</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Status</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600 text-right">Temperatura</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600 text-right">Vibracao</th>
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
    return <Estado msg="Nenhum chamado no periodo" />
  }

  return (
    <table className="w-full min-w-[720px] text-xs print:min-w-0">
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

export default function RelatoriosPage() {
  const router = useRouter()
  const {
    maquinas,
    status: maquinasStatus,
    mensagem: maquinasMensagem,
    carregando: loadingMaquinas,
    recarregarMaquinas,
  } = useMaquinas()
  const { sensores, recarregarSensores } = useSensores()
  const { alertas: chamados } = useAlertas()

  const [tipoRelatorio, setTipoRelatorio] = React.useState("geral")
  const [maquinaId, setMaquinaId] = React.useState("")
  const [periodo, setPeriodo] = React.useState("30d")
  const [secoes, setSecoes] = React.useState(DEFAULT_SECTIONS)
  const [historico, setHistorico] = React.useState([])
  const [historicoStatus, setHistoricoStatus] = React.useState("idle")
  const [historicoMensagem, setHistoricoMensagem] = React.useState("")
  const [refreshError, setRefreshError] = React.useState(null)
  const [emailDestinatarios, setEmailDestinatarios] = React.useState("")
  const [emailFrequencia, setEmailFrequencia] = React.useState("semanal")
  const [geradoEm] = React.useState(formatDate())

  React.useEffect(() => {
    if (!maquinaId && maquinas.length > 0) {
      setMaquinaId(String(maquinas[0].id))
    }
  }, [maquinaId, maquinas])

  const selectedMaquina = React.useMemo(
    () => maquinas.find((maquina) => String(maquina.id) === String(maquinaId)) ?? null,
    [maquinaId, maquinas]
  )
  const periodoDias = getPeriodDays(periodo)
  const periodoLabel = getPeriodLabel(periodo)
  const isRelatorioMaquina = tipoRelatorio === "maquina" && selectedMaquina

  const sensoresMaquina = React.useMemo(
    () => (selectedMaquina ? filtrarSensoresPorMaquina(sensores, selectedMaquina.id) : []),
    [selectedMaquina, sensores]
  )
  const chamadosMaquina = React.useMemo(
    () => (selectedMaquina ? filtrarChamadosPorMaquina(chamados, selectedMaquina.id, periodoDias) : []),
    [selectedMaquina, chamados, periodoDias]
  )

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
    } catch {
      window.localStorage.removeItem(EMAIL_DRAFT_STORAGE_KEY)
    }
  }, [])

  React.useEffect(() => {
    let ativo = true

    async function carregarHistoricoMaquina() {
      if (!isRelatorioMaquina || !secoes.historico) {
        setHistorico([])
        setHistoricoStatus("idle")
        setHistoricoMensagem("")
        return
      }

      const session = getAuthSession()
      if (!session?.accessToken) {
        setHistorico([])
        setHistoricoStatus("empty")
        setHistoricoMensagem("Sem historico disponivel para o periodo")
        return
      }

      setHistoricoStatus("loading")
      setHistoricoMensagem("")

      try {
        const payload = await requestDashboardJson(
          `/maquinas/${selectedMaquina.id}/historico?periodo=${periodo}`,
          session.accessToken,
          "o historico da maquina"
        )
        const data = montarTendenciaHistorica(payload)

        if (!ativo) return
        setHistorico(data)
        setHistoricoStatus(data.length > 0 ? "success" : "empty")
        setHistoricoMensagem(data.length > 0 ? "" : "Sem historico disponivel para o periodo")
      } catch {
        if (!ativo) return
        setHistorico([])
        setHistoricoStatus("empty")
        setHistoricoMensagem("Sem historico disponivel para o periodo")
      }
    }

    carregarHistoricoMaquina()

    return () => {
      ativo = false
    }
  }, [isRelatorioMaquina, periodo, secoes.historico, selectedMaquina])

  function onToggleSecao(secao, checked) {
    setSecoes((current) => ({ ...current, [secao]: checked }))
  }

  function recarregar() {
    setRefreshError(null)
    Promise.allSettled([recarregarMaquinas(), recarregarSensores()]).then((results) => {
      const rejected = results.find((result) => result.status === "rejected")
      if (rejected) {
        setRefreshError(rejected.reason instanceof Error ? rejected.reason.message : "Falha ao atualizar relatorio")
      }
    })
  }

  function getEmailAutomationPayload() {
    return {
      tipoRelatorio,
      maquinaId: isRelatorioMaquina ? selectedMaquina.id : null,
      periodo,
      periodoDias,
      secoes,
      recorrencia: emailFrequencia,
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
        atualizadoEm: new Date().toISOString(),
        payload,
      })
    )

    toast.success("Agendamento de e-mail atualizado.")
  }

  function enviarRelatorioAgora() {
    const destinatarios = getEmailAutomationPayload().destinatarios

    if (destinatarios.length === 0) {
      toast.error("Informe pelo menos um destinatario.")
      return
    }

    toast.success(`Relatorio enviado para ${destinatarios.length} destinatario(s).`)
  }

  const totalMaquinas = maquinas.length
  const totalOk = maquinas.filter((maquina) => maquina.status === "OK").length
  const totalAlerta = maquinas.filter((maquina) => maquina.status !== "OK").length
  const criticasAlta = maquinas.filter((maquina) => maquina.criticidade === "ALTA").length
  const integridadeMedia = totalMaquinas
    ? Math.round(maquinas.reduce((acc, maquina) => acc + (maquina.integridade ?? 0), 0) / totalMaquinas)
    : 0
  const chamadosAbertos = chamados.filter((chamado) =>
    ["ABERTO", "DISPONIVEL", "ATIVO", "EM_ANDAMENTO"].includes(chamado.status)
  ).length
  const chamadosResolvidos = chamados.filter((chamado) =>
    ["RESOLVIDO", "ENCERRADO"].includes(chamado.status)
  ).length

  const tendencia = React.useMemo(() => montarTendenciaChamados(chamados, periodoDias), [chamados, periodoDias])
  const pieStatus = [
    { name: "Estavel", value: totalOk },
    { name: "Alerta", value: totalAlerta },
  ].filter((item) => item.value > 0)
  const barCriticidade = ["ALTA", "MEDIA", "BAIXA"].map((criticidade) => ({
    name: criticidade.charAt(0) + criticidade.slice(1).toLowerCase(),
    Operando: maquinas.filter((maquina) => maquina.criticidade === criticidade && maquina.status === "OK").length,
    "Em alerta": maquinas.filter((maquina) => maquina.criticidade === criticidade && maquina.status !== "OK").length,
  }))
  const setores = [...new Set(maquinas.map((maquina) => maquina.setor))].slice(0, 6)
  const radarData = setores.map((setor) => {
    const group = maquinas.filter((maquina) => maquina.setor === setor)
    const avg = group.length
      ? Math.round(group.reduce((acc, maquina) => acc + (maquina.integridade ?? 0), 0) / group.length)
      : 0
    return { setor: setor.length > 10 ? `${setor.slice(0, 10)}...` : setor, integridade: avg }
  })
  const metricasMaquina = selectedMaquina
    ? calcularMetricasMaquina(selectedMaquina, sensoresMaquina, chamadosMaquina)
    : null

  const errorMsg = maquinasStatus === "error" ? maquinasMensagem : refreshError
  const carregandoTudo = loadingMaquinas

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
                <Button variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}>
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
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
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
              periodoLabel={periodoLabel}
              onSaveDraft={salvarRascunhoEmail}
              onSendNow={enviarRelatorioAgora}
            />

            {errorMsg && (
              <div className="flex flex-col gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start">
                <span>{errorMsg}</span>
                <Button variant="outline" size="sm" onClick={recarregar}>
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
            {isRelatorioMaquina ? (
              <RelatorioMaquina
                maquina={selectedMaquina}
                periodoLabel={periodoLabel}
                geradoEm={geradoEm}
                secoes={secoes}
                metricas={metricasMaquina}
                sensores={sensoresMaquina}
                chamados={chamadosMaquina}
                historico={historico}
                historicoStatus={historicoStatus}
                historicoMensagem={historicoMensagem}
              />
            ) : (
              <RelatorioGeral
                geradoEm={geradoEm}
                periodoLabel={periodoLabel}
                secoes={secoes}
                loadingMaquinas={loadingMaquinas}
                totalMaquinas={totalMaquinas}
                totalOk={totalOk}
                totalAlerta={totalAlerta}
                criticasAlta={criticasAlta}
                integridadeMedia={integridadeMedia}
                chamados={chamados}
                chamadosAbertos={chamadosAbertos}
                chamadosResolvidos={chamadosResolvidos}
                maquinas={maquinas}
                pieStatus={pieStatus}
                barCriticidade={barCriticidade}
                tendencia={tendencia}
                radarData={radarData}
              />
            )}
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
          content: "Pagina " counter(report-page);
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

          .recharts-wrapper svg {
            overflow: visible !important;
          }

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
          title="Relatorio Operacional"
          meta={[`Gerado em ${geradoEm}`, `Frota de ${totalMaquinas} maquinas monitoradas - Periodo: ${periodoLabel}`]}
          statusLabel={integridadeMedia >= 75 ? "Frota Estavel" : integridadeMedia >= 50 ? "Atencao Necessaria" : "Estado Critico"}
          statusSub={`Integridade media: ${integridadeMedia}%`}
        />

        {secoes.resumo && (
          <div className="mb-6 print:mb-4">
            <SectionTitle>Visao Geral da Frota</SectionTitle>
            <div className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
              <MetricCard icon={WashingMachineIcon} label="Maquinas ativas" value={loadingMaquinas ? "--" : totalMaquinas} sub={`${totalOk} OK - ${totalAlerta} em alerta`} />
              <MetricCard icon={ShieldAlertIcon} label="Alta importancia" value={loadingMaquinas ? "--" : criticasAlta} sub="Maquinas criticas" color={COLORS.alerta} />
              <MetricCard icon={ActivityIcon} label="Integridade media" value={loadingMaquinas ? "--" : `${integridadeMedia}%`} sub="Media de toda a frota" color={integridadeMedia >= 75 ? COLORS.ok : integridadeMedia >= 50 ? COLORS.medio : COLORS.alerta} />
              <MetricCard icon={ZapIcon} label="Chamados abertos" value={chamadosAbertos} sub={`${chamadosResolvidos} resolvidos no periodo`} color={chamadosAbertos > 0 ? COLORS.medio : COLORS.ok} />
            </div>
          </div>
        )}

        {(secoes.desempenho || secoes.historico) && (
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 print:mb-4 print:grid-cols-2 print:gap-3">
            {secoes.desempenho && (
              <>
                <div className="break-inside-avoid border  border-stone-200 bg-white p-5 sm:p-4 print:border-stone-300 print:p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-stone-500">Status das maquinas</p>
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
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-stone-500">Maquinas por importância</p>
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
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-stone-500">Tendencia de alertas - {periodoLabel}</p>
                {tendencia.length === 0 ? (
                  <Estado msg="Sem dados de tendencia disponiveis" />
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
              <SectionTitle>Inventario de Maquinas</SectionTitle>
              <div className="mt-3 overflow-x-auto border border-stone-200 print:overflow-visible print:border-stone-300">
                {loadingMaquinas ? <Estado msg="Carregando maquinas..." /> : <MaquinasTable maquinas={maquinas} totalMaquinas={totalMaquinas} totalOk={totalOk} totalAlerta={totalAlerta} integridadeMedia={integridadeMedia} />}
              </div>
            </div>
          )}

          {secoes.chamados && (
            <div className="mb-6 print:mb-4">
              <SectionTitle>Chamados Tecnicos</SectionTitle>
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
          title={`Relatorio de Maquina - ${maquina.nome}`}
          meta={[
            `Gerado em ${geradoEm}`,
            `${maquina.setor} - ${maquina.tipo} - Periodo: ${periodoLabel}`,
            `Importância: ${maquina.criticidade} - Ultimo sinal: ${tempoRelativo(maquina.ultimaLeituraEm)}`,
          ]}
          statusLabel={maquina.status === "OK" ? "Operando" : "Em alerta"}
          statusSub={`Integridade atual: ${maquina.integridade}%`}
        />

        {secoes.resumo && (
          <div className="mb-6 print:mb-4">
            <SectionTitle>Resumo da Maquina</SectionTitle>
            <div className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
              <MetricCard icon={GaugeIcon} label="Integridade" value={`${metricas.integridade}%`} sub="Valor atual" color={metricas.integridade >= 75 ? COLORS.ok : metricas.integridade >= 50 ? COLORS.medio : COLORS.alerta} />
              <MetricCard icon={ActivityIcon} label="Estabilidade" value={`${metricas.estabilidade}%`} sub="Score operacional" color={metricas.estabilidade >= 75 ? COLORS.ok : metricas.estabilidade >= 50 ? COLORS.medio : COLORS.alerta} />
              <MetricCard icon={WashingMachineIcon} label="Sensores" value={metricas.sensoresTotal} sub={`${metricas.sensoresOnline} online`} />
              <MetricCard icon={ZapIcon} label="Chamados abertos" value={metricas.chamadosAbertos} sub={`${metricas.chamadosResolvidos} resolvidos`} color={metricas.chamadosAbertos > 0 ? COLORS.medio : COLORS.ok} />
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
                <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Importancia</p>
                <div className="mt-3">
                  <CriticidadeBadge value={maquina.criticidade} />
                </div>
              </div>
              <div className="border border-stone-200 bg-white p-3 sm:p-4 print:border-stone-300">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Ultimo sinal</p>
                <p className="mt-3 text-sm font-semibold text-stone-900">{tempoRelativo(maquina.ultimaLeituraEm)}</p>
              </div>
            </div>
          </div>
        )}

        {secoes.historico && (
          <div className="mb-6 print:mb-4">
            <SectionTitle>Historico de Integridade - {periodoLabel}</SectionTitle>
            <div className="mt-3 break-inside-avoid border border-stone-200 bg-white p-3 sm:p-4 print:border-stone-300 print:p-3">
              {historicoStatus === "loading" ? (
                <Estado msg="Carregando historico..." />
              ) : historico.length === 0 ? (
                <Estado msg={historicoMensagem || "Sem historico disponivel para o periodo"} />
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
              <SectionTitle>Chamados da Maquina</SectionTitle>
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
    return <Estado msg="Nenhuma maquina encontrada" />
  }

  return (
    <table className="w-full min-w-[720px] text-xs print:min-w-0">
      <thead>
        <tr className="border-b border-stone-200 bg-stone-50 text-left print:bg-stone-100">
          <th className="px-3 py-2.5 font-semibold text-stone-600">Maquina</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Setor</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Tipo</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Importancia</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600">Status</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600 text-right">Integridade</th>
          <th className="px-3 py-2.5 font-semibold text-stone-600 text-right">Ultimo sinal</th>
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
            {totalMaquinas} maquinas - {totalOk} OK - {totalAlerta} em alerta
          </td>
          <td className="px-3 py-2 text-right text-xs font-semibold text-stone-800">Media: {integridadeMedia}%</td>
          <td />
        </tr>
      </tfoot>
    </table>
  )
}
