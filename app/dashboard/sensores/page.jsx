"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { useMaquinas } from "@/components/context/maquinas-context"
import { useSensores } from "@/components/context/sensores-context"
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MetricValue, useDashboardMetricsLoading } from "@/components/animated-metric"
import { RefreshTooltipButton } from "@/components/refresh-tooltip-button"
import { SiteHeader } from "@/components/site-header"
import { TablePagination } from "@/components/table-pagination"
import { TableColumnHeaderMenu } from "@/components/table-column-header-menu"
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  FileTextIcon,
  NfcIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  ThermometerIcon,
  Trash2Icon,
  WifiOffIcon,
} from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { runAfterCurrentOverlayCloses } from "@/lib/deferred-ui"
import { getAuthSession } from "@/lib/auth-session"
import { requestDashboardJson } from "@/lib/dashboard-api"
import { tempoRelativo } from "@/lib/utils"
import { parseDecimalInput, sanitizeDecimalInput } from "@/lib/form-formatters"

const SEM_MAQUINA_VALUE = "__sem_maquina__"
const FILTER_ALL_VALUE = "__all__"
const MANUAL_MAX_FILE_SIZE = 25 * 1024 * 1024
const PREVIEW_FIELD_LABELS = {
  idealTemperatura: "Temp. ideal",
  limiteTemperatura: "Limite temp.",
  idealVibracao: "Vibracao ideal",
  limiteVibracao: "Limite vibracao",
}

const formVazio = {
  tipo: "",
  maquinaId: "",
  limiteTemperatura: "",
  idealTemperatura: "",
  limiteVibracao: "",
  idealVibracao: "",
}

const SENSOR_STATUS_FILTER_OPTIONS = [
  { value: "ONLINE", label: "Online" },
  { value: "OFFLINE", label: "Offline" },
]

const SENSOR_STATUS_SORT_OPTIONS = [
  { value: "desc", label: "Online primeiro", desc: true },
  { value: "asc", label: "Offline primeiro", desc: false },
]

const SENSOR_MAQUINA_FILTER_OPTIONS = [
  { value: "COM_MAQUINA", label: "Com máquina" },
  { value: "SEM_MAQUINA", label: "Sem máquina" },
]

const SENSOR_LEITURA_FILTER_OPTIONS = [
  { value: "NORMAL", label: "Dentro do limite" },
  { value: "FORA_LIMITE", label: "Fora do limite" },
  { value: "SEM_SINAL", label: "Sem sinal" },
  { value: "SEM_LEITURA", label: "Sem leitura" },
]

const SENSOR_STATUS_ORDER = { OFFLINE: 0, ONLINE: 1 }

function StatusBadge({ value }) {
  const isOnline = value === "ONLINE"
  const badgeClass = isOnline
    ? "border-[#5E17EB] bg-[#5E17EB] text-white dark:border-[#5E17EB] dark:bg-[#5E17EB] dark:text-white"
    : "border-gray-200 bg-white text-gray-700 dark:border-border dark:bg-muted/30 dark:text-muted-foreground"

  return (
    <Badge
      variant="outline"
      className={`px-1.5 ${badgeClass}`}
    >
      {isOnline ? <CircleCheckIcon className="text-white" /> : <WifiOffIcon className="text-muted-foreground" />}
      {value}
    </Badge>
  )
}

function LeituraCell({ valor, unidade, limiteMin, limiteMax }) {
  if (valor === undefined || valor === null) {
    return <span className="text-sm text-muted-foreground">N/A</span>
  }

  const overLimit = valor > limiteMax || valor < limiteMin
  const pct = limiteMax > limiteMin ? Math.min(100, Math.max(0, ((valor - limiteMin) / (limiteMax - limiteMin)) * 100)) : 0
  const barColor = overLimit ? "bg-red-500" : pct > 80 ? "bg-yellow-400" : "bg-green-500"

  return (
    <div className="flex min-w-[110px] flex-col gap-1">
      <div className="flex items-center gap-1">
        <span className={`font-mono text-sm font-medium ${overLimit ? "text-red-600 dark:text-red-300" : "text-foreground"}`}>
          {valor}
          <span className="ml-0.5 text-xs font-normal text-muted-foreground">{unidade}</span>
        </span>
        {overLimit ? <AlertTriangleIcon className="size-3 text-red-500 dark:text-red-300" /> : null}
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full w-full origin-left rounded-full transition-[transform,background-color] duration-700 ease-out will-change-transform motion-reduce:transition-none ${barColor}`}
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </div>
    </div>
  )
}

function getLeituraResumo(sensor, chave, unidade) {
  if (!isSensorTransmitindo(sensor)) {
    return {
      label: "--",
      pct: 100,
      barClass: "bg-muted-foreground/35",
      textClass: "text-muted-foreground",
    }
  }

  const leitura = sensor?.[chave]
  const valor = Number(leitura?.valorAtual)
  const limiteMin = Number(leitura?.limiteMin)
  const limiteMax = Number(leitura?.limiteMax)

  if (!leitura || !Number.isFinite(valor) || !Number.isFinite(limiteMin) || !Number.isFinite(limiteMax)) {
    return {
      label: "--",
      pct: 100,
      barClass: "bg-muted-foreground/35",
      textClass: "text-muted-foreground",
    }
  }

  const overLimit = valor > limiteMax || valor < limiteMin
  const pct = limiteMax > limiteMin ? Math.min(100, Math.max(0, ((valor - limiteMin) / (limiteMax - limiteMin)) * 100)) : 0

  return {
    label: `${valor}${unidade}`,
    pct,
    barClass: overLimit ? "bg-red-500" : pct > 80 ? "bg-yellow-400" : "bg-green-500",
    textClass: overLimit ? "text-red-600 dark:text-red-300" : "text-muted-foreground",
  }
}

function SensorReadingRow({ reading, label }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`w-9 text-sm font-medium tabular-nums ${reading.textClass}`}>{reading.label}</span>
      <span className="h-6 w-32 overflow-hidden rounded-md bg-muted">
        <span
          className={`block h-full rounded-md ${reading.barClass}`}
          style={{ width: `${reading.pct}%` }}
        />
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </span>
  )
}

function SensorMobileCard({ sensor, onOpen }) {
  const vibracao = getLeituraResumo(sensor, "vibracao", "")
  const temperatura = getLeituraResumo(sensor, "temperatura", "")

  return (
    <button
      type="button"
      className="flex  w-full cursor-pointer flex-col justify-between gap-4 rounded-lg border bg-card p-4 text-left shadow-sm transition-colors hover:border-[#5E17EB] focus-visible:border-[#5E17EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E17EB]/20 dark:border-gray-700! dark:bg-[#0F172A]"
      onClick={() => onOpen(sensor)}
    >
      <span className="flex items-start justify-between gap-1">
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-base font-medium text-foreground">{sensor.tipo}</span>
          <span className="truncate text-sm text-muted-foreground">{sensor.maquinaId ? sensor.maquinaNome : "Sem máquina"}</span>
        </span>
        <span className="shrink-0">
          <StatusBadge value={sensor.status} />
        </span>
      </span>

      <span className="flex flex-col gap-2">
        <SensorReadingRow reading={vibracao} label="Vib" />
        <SensorReadingRow reading={temperatura} label="Temp" />
      </span>
    </button>
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
            title="Máquina"
            value={filters.vinculoMaquina}
            options={SENSOR_MAQUINA_FILTER_OPTIONS}
            onChange={(value) => onFilterChange("vinculoMaquina", value)}
          />
          <MobileFilterSection
            title="Status"
            value={filters.status}
            options={SENSOR_STATUS_FILTER_OPTIONS}
            onChange={(value) => onFilterChange("status", value)}
          />
          <MobileFilterSection
            title="Temperatura"
            value={filters.temperatura}
            options={SENSOR_LEITURA_FILTER_OPTIONS}
            onChange={(value) => onFilterChange("temperatura", value)}
          />
          <MobileFilterSection
            title="Vibração"
            value={filters.vibracao}
            options={SENSOR_LEITURA_FILTER_OPTIONS}
            onChange={(value) => onFilterChange("vibracao", value)}
          />
        </div>
      ) : null}
    </div>
  )
}

function StatePanel({ message, tone = "muted" }) {
  return (
    <div
      className={`flex min-h-[280px] items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm ${
        tone === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-border/60 bg-muted/20 text-muted-foreground"
      }`}
    >
      {message}
    </div>
  )
}

function SensorMetricCard({ label, value, badge, badgeClass = "", footer, icon: Icon, featured = false }) {
  return (
    <Card
      className={`@container/card transition-colors hover:border-[#5E17EB]! hover:ring-[#5E17EB]/50 focus-within:border-[#5E17EB]! focus-within:ring-[#5E17EB]/10 
      `}
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
        <div className="line-clamp-1 items-center flex gap-2 font-medium">
          {footer}
          <Icon className="size-4" />
        </div>
      </CardFooter>
    </Card>
  )
}

function formatValue(value, suffix) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return "--"
  }

  return `${parsed}${suffix}`
}

function isSensorTransmitindo(sensor) {
  return sensor?.active && sensor?.maquinaId !== null && sensor?.status === "ONLINE"
}

function getSensorVinculoExibicao(sensor) {
  return sensor?.maquinaId ? "COM_MAQUINA" : "SEM_MAQUINA"
}

function getSensorLeituraStatus(sensor, chave) {
  if (!isSensorTransmitindo(sensor)) {
    return "SEM_SINAL"
  }

  const leitura = sensor?.[chave]
  const valor = Number(leitura?.valorAtual)
  const limiteMin = Number(leitura?.limiteMin)
  const limiteMax = Number(leitura?.limiteMax)

  if (!leitura || !Number.isFinite(valor) || !Number.isFinite(limiteMin) || !Number.isFinite(limiteMax)) {
    return "SEM_LEITURA"
  }

  return valor > limiteMax || valor < limiteMin ? "FORA_LIMITE" : "NORMAL"
}

function selectSensorFilterFn(row, columnId, value) {
  if (!value) {
    return true
  }

  return row.getValue(columnId) === value
}

function statusSensorSortFn(rowA, rowB, columnId) {
  const valueA = SENSOR_STATUS_ORDER[rowA.getValue(columnId)] ?? 0
  const valueB = SENSOR_STATUS_ORDER[rowB.getValue(columnId)] ?? 0

  return valueA - valueB
}

function getSensorSemSinalLabel(sensor) {
  return sensor?.active && sensor?.maquinaId !== null ? "N/A - Sem sinal" : "N/A - Sensor Inativo"
}

function formatLeituraAtual(sensor, leitura, suffix) {
  if (!isSensorTransmitindo(sensor)) {
    return "Sem sinal"
  }

  return formatValue(leitura?.valorAtual, suffix)
}

function getSelectedMaquinaId(value) {
  if (!value || value === SEM_MAQUINA_VALUE) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function UnitInput({ id, value, onChange, unit, placeholder, decimalPlaces = 2 }) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        pattern="[0-9]+([.,][0-9]+)?"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(sanitizeDecimalInput(event.target.value, { decimalPlaces }))}
        className="pr-14 tabular-nums"
      />
      <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs font-medium text-muted-foreground">
        {unit}
      </span>
    </div>
  )
}

function toFiniteManualNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeManualUnit(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00ba/g, "\u00b0")
    .toLowerCase()
    .replace(/\s+/g, "")
}

function formatManualNumber(value) {
  if (!Number.isFinite(value)) {
    return "--"
  }

  return String(Number(value.toFixed(2)))
}

function getUnitLabel(unit, fallback) {
  return typeof unit === "string" && unit.trim() ? unit.trim() : fallback
}

function parseTemperaturePreviewValue(value, unit) {
  const rawNumber = toFiniteManualNumber(value)

  if (rawNumber === null) {
    return { rawNumber: null, appliedNumber: null, canApply: false, converted: false }
  }

  const normalizedUnit = normalizeManualUnit(unit)

  if (!normalizedUnit || ["c", "\u00b0c", "celsius", "degc"].includes(normalizedUnit)) {
    return { rawNumber, appliedNumber: rawNumber, canApply: true, converted: false }
  }

  if (["f", "\u00b0f", "fahrenheit", "degf"].includes(normalizedUnit)) {
    return { rawNumber, appliedNumber: (rawNumber - 32) * (5 / 9), canApply: true, converted: true }
  }

  return { rawNumber, appliedNumber: null, canApply: false, converted: false }
}

function isMillimetersPerSecondUnit(unit) {
  const normalizedUnit = normalizeManualUnit(unit)

  return [
    "mm/s",
    "mms",
    "mmseg",
    "mm/srms",
    "mm/s-rms",
    "mm/sec",
    "mmpersecond",
    "milimetrosporsegundo",
    "milimetro/segundo",
  ].includes(normalizedUnit)
}

function parseVibrationPreviewValue(value, unit) {
  const rawNumber = toFiniteManualNumber(value)

  if (rawNumber === null) {
    return { rawNumber: null, appliedNumber: null, canApply: false, converted: false }
  }

  return {
    rawNumber,
    appliedNumber: isMillimetersPerSecondUnit(unit) ? rawNumber : null,
    canApply: isMillimetersPerSecondUnit(unit),
    converted: false,
  }
}

function buildManualPreviewField({ label, rawValue, unit, fallbackUnit, parser }) {
  const parsed = parser(rawValue, unit)
  const displayUnit = getUnitLabel(unit, fallbackUnit)
  const normalizedUnit = parsed.converted ? fallbackUnit : displayUnit
  const displayValue =
    parsed.rawNumber === null
      ? "--"
      : parsed.converted
        ? `${formatManualNumber(parsed.rawNumber)} ${displayUnit} / ${formatManualNumber(parsed.appliedNumber)} ${fallbackUnit}`
        : `${formatManualNumber(parsed.rawNumber)} ${normalizedUnit}`.trim()

  return {
    label,
    displayValue,
    formValue: parsed.canApply ? formatManualNumber(parsed.appliedNumber) : "",
    canApply: parsed.canApply,
    hasValue: parsed.rawNumber !== null,
  }
}

function normalizeManualPreviewPayload(payload) {
  const specs = payload?.especificacoes && typeof payload.especificacoes === "object" ? payload.especificacoes : {}
  const unidadeTemperatura = specs.unidadeTemperatura ?? null
  const unidadeVibracao = specs.unidadeVibracao ?? null

  return {
    nomeArquivo: typeof payload?.nomeArquivo === "string" ? payload.nomeArquivo : "manual.pdf",
    confianca: typeof specs.confianca === "string" ? specs.confianca : "",
    observacoes: Array.isArray(specs.observacoes)
      ? specs.observacoes.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    fields: {
      idealTemperatura: buildManualPreviewField({
        label: PREVIEW_FIELD_LABELS.idealTemperatura,
        rawValue: specs.temperaturaIdeal,
        unit: unidadeTemperatura,
        fallbackUnit: "\u00b0C",
        parser: parseTemperaturePreviewValue,
      }),
      limiteTemperatura: buildManualPreviewField({
        label: PREVIEW_FIELD_LABELS.limiteTemperatura,
        rawValue: specs.temperaturaMaxima,
        unit: unidadeTemperatura,
        fallbackUnit: "\u00b0C",
        parser: parseTemperaturePreviewValue,
      }),
      idealVibracao: buildManualPreviewField({
        label: PREVIEW_FIELD_LABELS.idealVibracao,
        rawValue: specs.vibracaoIdeal,
        unit: unidadeVibracao,
        fallbackUnit: "",
        parser: parseVibrationPreviewValue,
      }),
      limiteVibracao: buildManualPreviewField({
        label: PREVIEW_FIELD_LABELS.limiteVibracao,
        rawValue: specs.vibracaoMaxima,
        unit: unidadeVibracao,
        fallbackUnit: "",
        parser: parseVibrationPreviewValue,
      }),
    },
  }
}

function getManualPreviewAppliedValues(preview) {
  const applied = {}

  for (const [field, item] of Object.entries(preview?.fields || {})) {
    if (item.canApply && item.formValue) {
      applied[field] = item.formValue
    }
  }

  return applied
}

function clearMatchingAppliedPreviewFields(current, appliedValues) {
  if (!appliedValues || Object.keys(appliedValues).length === 0) {
    return current
  }

  let changed = false
  const next = { ...current }

  for (const [field, value] of Object.entries(appliedValues)) {
    if (next[field] === value) {
      next[field] = ""
      changed = true
    }
  }

  return changed ? next : current
}

function getManualFileValidationMessage(file) {
  if (!file) {
    return "Selecione um manual em PDF."
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")

  if (!isPdf) {
    return "Use um arquivo PDF."
  }

  if (file.size > MANUAL_MAX_FILE_SIZE) {
    return "O manual deve ter no maximo 25 MB."
  }

  return ""
}

function ManualPreviewField({ field }) {
  return (
    <div className="flex min-h-20 flex-col gap-1 rounded-md border bg-background px-2.5 py-2">
      <span className="text-xs text-muted-foreground">{field.label}</span>
      <span className="text-sm font-medium tabular-nums">{field.displayValue}</span>
      {field.hasValue ? (
        <Badge variant={field.canApply ? "secondary" : "outline"} className="mt-auto w-fit px-1.5 text-[10px]">
          {field.canApply ? "Aplicado" : "Nao aplicado"}
        </Badge>
      ) : null}
    </div>
  )
}

export default function SensoresPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const permissions = useDashboardPermissions()
  const {
    sensores,
    status,
    mensagem,
    carregando,
    salvando,
    adicionarSensor,
    editarSensor,
    excluirSensor,
    recarregarSensores,
  } = useSensores()
  const { maquinas } = useMaquinas()

  const [busca, setBusca] = React.useState("")
  const [sheetAberto, setSheetAberto] = React.useState(false)
  const [modoSheet, setModoSheet] = React.useState("criar")
  const [sensorSelecionado, setSensorSelecionado] = React.useState(null)
  const [form, setForm] = React.useState(formVazio)
  const [manualArquivo, setManualArquivo] = React.useState(null)
  const [manualPreview, setManualPreview] = React.useState(null)
  const [manualPreviewAplicado, setManualPreviewAplicado] = React.useState(null)
  const [manualPreviewLoading, setManualPreviewLoading] = React.useState(false)
  const [dialogExcluir, setDialogExcluir] = React.useState(false)
  const [sensorExcluir, setSensorExcluir] = React.useState(null)
  const [sorting, setSorting] = React.useState([])
  const [columnFilters, setColumnFilters] = React.useState([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false)
  const manualInputRef = React.useRef(null)
  const sensorAbertoPelaUrlRef = React.useRef(null)

  const loadingInicial = useDashboardMetricsLoading(carregando && sensores.length === 0)
  const errorSemDados = status === "error" && sensores.length === 0
  const canManageSensores = permissions.canManageSensores

  const totalOnline = React.useMemo(() => sensores.filter((sensor) => sensor.status === "ONLINE").length, [sensores])
  const semMaquina = React.useMemo(() => sensores.filter((sensor) => !sensor.maquinaId).length, [sensores])
  const sensorSelecionadoAtual = React.useMemo(() => {
    if (!sensorSelecionado?.id) {
      return sensorSelecionado
    }

    return sensores.find((sensor) => String(sensor.id) === String(sensorSelecionado.id)) ?? sensorSelecionado
  }, [sensorSelecionado, sensores])
  const sensorDetalhado = modoSheet === "ver" ? sensorSelecionadoAtual : sensorSelecionado
  const foraDoLimite = React.useMemo(() => sensores.filter((sensor) => {
    if (!isSensorTransmitindo(sensor)) {
      return false
    }

    const tempFora =
      sensor.temperatura &&
      (sensor.temperatura.valorAtual > sensor.temperatura.limiteMax ||
        sensor.temperatura.valorAtual < sensor.temperatura.limiteMin)
    const vibFora =
      sensor.vibracao &&
      (sensor.vibracao.valorAtual > sensor.vibracao.limiteMax ||
        sensor.vibracao.valorAtual < sensor.vibracao.limiteMin)

    return tempFora || vibFora
  }).length, [sensores])

  React.useEffect(() => {
    if (searchParams.get("action") === "new") {
      if (!canManageSensores) {
        router.replace("/dashboard/sensores")
        return
      }

      abrirCriar()
    }
  }, [canManageSensores, router, searchParams])

  React.useEffect(() => {
    const sensorIdParam = searchParams.get("sensorId")

    if (!sensorIdParam || sensores.length === 0) {
      if (!sensorIdParam) {
        sensorAbertoPelaUrlRef.current = null
      }
      return
    }

    const sensorIdKey = String(sensorIdParam)

    if (sensorAbertoPelaUrlRef.current === sensorIdKey) {
      return
    }

    const sensor = sensores.find((item) => String(item.id) === String(sensorIdParam))

    if (sensor) {
      sensorAbertoPelaUrlRef.current = sensorIdKey
      abrirVer(sensor)
    }
  }, [searchParams, sensores])

  function resetManualAssistState() {
    setManualArquivo(null)
    setManualPreview(null)
    setManualPreviewAplicado(null)
    setManualPreviewLoading(false)

    if (manualInputRef.current) {
      manualInputRef.current.value = ""
    }
  }

  function clearManualPreviewFromCurrentForm() {
    setForm((current) => clearMatchingAppliedPreviewFields(current, manualPreviewAplicado))
    setManualPreview(null)
    setManualPreviewAplicado(null)
  }

  function abrirCriar() {
    if (!canManageSensores) {
      return
    }

    setModoSheet("criar")
    setForm(formVazio)
    resetManualAssistState()
    setSensorSelecionado(null)
    setSheetAberto(true)
  }

  function abrirEditar(sensor) {
    if (!canManageSensores) {
      return
    }

    setModoSheet("editar")
    resetManualAssistState()
    setForm({
      tipo: sensor.tipo ?? "",
      maquinaId: sensor.maquinaId ? String(sensor.maquinaId) : "",
      limiteTemperatura: String(sensor.limiteTemperatura ?? ""),
      idealTemperatura: String(sensor.idealTemperatura ?? ""),
      limiteVibracao: String(sensor.limiteVibracao ?? ""),
      idealVibracao: String(sensor.idealVibracao ?? ""),
    })
    setSensorSelecionado(sensor)
    setSheetAberto(true)
  }

  function abrirVer(sensor) {
    setModoSheet("ver")
    resetManualAssistState()
    setSensorSelecionado(sensor)
    setSheetAberto(true)
  }

  function handleMaquinaChange(value) {
    const maquinaId = getSelectedMaquinaId(value)

    setForm((current) => ({
      ...clearMatchingAppliedPreviewFields(current, manualPreviewAplicado),
      maquinaId: maquinaId === null ? "" : String(maquinaId),
    }))
    setManualPreview(null)
    setManualPreviewAplicado(null)
  }

  function setFormField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleManualFileChange(event) {
    const file = event.target.files?.[0] ?? null

    clearManualPreviewFromCurrentForm()

    if (!file) {
      setManualArquivo(null)
      return
    }

    const validationMessage = getManualFileValidationMessage(file)

    if (validationMessage) {
      setManualArquivo(null)
      event.target.value = ""
      toast.error(validationMessage)
      return
    }

    setManualArquivo(file)
  }

  async function gerarPreviewManual() {
    const maquinaId = getSelectedMaquinaId(form.maquinaId)

    if (!maquinaId) {
      toast.error("Selecione a maquina vinculada ao sensor.")
      return
    }

    const validationMessage = getManualFileValidationMessage(manualArquivo)

    if (validationMessage) {
      toast.error(validationMessage)
      return
    }

    const session = getAuthSession()

    if (!session?.accessToken) {
      toast.error("Faca login para analisar o manual.")
      return
    }

    const formData = new FormData()
    formData.append("manual", manualArquivo)
    formData.append("maquinaId", String(maquinaId))

    setManualPreviewLoading(true)

    try {
      const payload = await requestDashboardJson("/maquinas/manual/preview", session.accessToken, "o preview do manual", {
        method: "POST",
        body: formData,
      })
      const preview = normalizeManualPreviewPayload(payload)
      const appliedValues = getManualPreviewAppliedValues(preview)
      const appliedCount = Object.keys(appliedValues).length

      setManualPreview(preview)
      setManualPreviewAplicado(appliedCount > 0 ? appliedValues : null)
      setForm((current) => ({
        ...clearMatchingAppliedPreviewFields(current, manualPreviewAplicado),
        ...appliedValues,
      }))

      if (appliedCount > 0) {
        toast.success("Preview aplicado aos limites do sensor.")
      } else {
        toast("Preview gerado sem valores compativeis para aplicar.")
      }
    } catch (error) {
      setManualPreview(null)
      toast.error(error instanceof Error ? error.message : "Nao foi possivel analisar o manual.")
    } finally {
      setManualPreviewLoading(false)
    }
  }

  function validarFormulario() {
    if (!form.tipo.trim()) {
      toast.error("Informe o tipo do sensor.")
      return false
    }

    if (!getSelectedMaquinaId(form.maquinaId)) {
      toast.error("Selecione a máquina vinculada ao sensor.")
      return false
    }

    const requiredFields = [
      ["limiteTemperatura", "Informe o limite de temperatura em °C."],
      ["idealTemperatura", "Informe a temperatura ideal em °C."],
      ["limiteVibracao", "Informe o limite de vibração em mm/s."],
      ["idealVibracao", "Informe a vibração ideal em mm/s."],
    ]

    for (const [field, message] of requiredFields) {
      if (!Number.isFinite(parseDecimalInput(form[field]))) {
        toast.error(message)
        return false
      }
    }

    const idealTemperatura = parseDecimalInput(form.idealTemperatura)
    const limiteTemperatura = parseDecimalInput(form.limiteTemperatura)
    const idealVibracao = parseDecimalInput(form.idealVibracao)
    const limiteVibracao = parseDecimalInput(form.limiteVibracao)

    if (limiteTemperatura <= idealTemperatura) {
      toast.error("O limite de temperatura deve ser maior que a temperatura ideal.")
      return false
    }

    if (limiteVibracao <= idealVibracao) {
      toast.error("O limite de vibração deve ser maior que a vibração ideal.")
      return false
    }

    return true
  }

  function criarPayloadSensor(isCreate = false) {
    const maquinaId = getSelectedMaquinaId(form.maquinaId)

    return {
      maquinaId,
      tipo: form.tipo.trim(),
      status: isCreate ? "OFFLINE" : sensorSelecionado?.status ?? "OFFLINE",
      limiteTemperatura: parseDecimalInput(form.limiteTemperatura),
      idealTemperatura: parseDecimalInput(form.idealTemperatura),
      limiteVibracao: parseDecimalInput(form.limiteVibracao),
      idealVibracao: parseDecimalInput(form.idealVibracao),
    }
  }

  async function salvar() {
    if (!validarFormulario()) {
      return
    }

    const payload = criarPayloadSensor(modoSheet === "criar")

    try {
      if (modoSheet === "criar") {
        await adicionarSensor(payload)
        toast.success("Sensor cadastrado com sucesso!")
      } else {
        await editarSensor(sensorSelecionado.id, payload)
        toast.success("Sensor atualizado com sucesso!")
      }

      setSheetAberto(false)
      setForm(formVazio)
      resetManualAssistState()
      setSensorSelecionado(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o sensor.")
    }
  }

  function confirmarExcluir(sensor) {
    if (!canManageSensores) {
      return
    }

    setSensorExcluir(sensor)
    setDialogExcluir(true)
  }

  function alternarDialogExcluir(open) {
    setDialogExcluir(open)

    if (!open) {
      setSensorExcluir(null)
    }
  }

  async function excluir() {
    if (!sensorExcluir) {
      return
    }

    try {
      await excluirSensor(sensorExcluir.id)
      toast.success("Sensor removido.")
      setDialogExcluir(false)
      setSheetAberto(false)
      setSensorExcluir(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover o sensor.")
    }
  }

  const dadosFiltrados = React.useMemo(() => sensores.filter((sensor) => {
    const termo = busca.toLowerCase()

    return (
      sensor.nome.toLowerCase().includes(termo) ||
      sensor.tipo.toLowerCase().includes(termo) ||
      sensor.maquinaNome.toLowerCase().includes(termo)
    )
  }), [sensores, busca])

  const columns = [
    {
      accessorKey: "tipo",
      header: "Sensor",
      cell: ({ row }) => (
        <button
          onClick={() => abrirVer(row.original)}
          className="cursor-pointer text-left text-sm font-medium transition-colors hover:text-primary hover:underline"
        >
          {row.original.tipo}
        </button>
      ),
    },
    {
      id: "vinculoMaquina",
      accessorFn: getSensorVinculoExibicao,
      header: ({ column }) => (
        <TableColumnHeaderMenu
          column={column}
          label="Máquina"
          filterOptions={SENSOR_MAQUINA_FILTER_OPTIONS}
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.maquinaId ? row.original.maquinaNome : "Sem máquina vinculada"}
        </span>
      ),
      filterFn: selectSensorFilterFn,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <TableColumnHeaderMenu
          column={column}
          label="Status"
          filterOptions={SENSOR_STATUS_FILTER_OPTIONS}
          sortOptions={SENSOR_STATUS_SORT_OPTIONS}
        />
      ),
      cell: ({ row }) => <StatusBadge value={row.original.status} />,
      filterFn: selectSensorFilterFn,
      sortingFn: statusSensorSortFn,
    },
    {
      id: "temperatura",
      accessorFn: (sensor) => getSensorLeituraStatus(sensor, "temperatura"),
      header: ({ column }) => (
        <TableColumnHeaderMenu
          column={column}
          label="Temperatura"
          filterOptions={SENSOR_LEITURA_FILTER_OPTIONS}
        />
      ),
      cell: ({ row }) => {
        const sensorAtivo = isSensorTransmitindo(row.original)
        const temperatura = row.original.temperatura

        if (!sensorAtivo) {
          return <span className="text-sm text-muted-foreground">{getSensorSemSinalLabel(row.original)}</span>
        }

        if (!temperatura) {
          return <span className="text-sm text-muted-foreground">N/A</span>
        }

        return <LeituraCell valor={temperatura.valorAtual} unidade="°C" limiteMin={temperatura.limiteMin} limiteMax={temperatura.limiteMax} />
      },
      filterFn: selectSensorFilterFn,
    },
    {
      id: "vibracao",
      accessorFn: (sensor) => getSensorLeituraStatus(sensor, "vibracao"),
      header: ({ column }) => (
        <TableColumnHeaderMenu
          column={column}
          label="Vibração"
          filterOptions={SENSOR_LEITURA_FILTER_OPTIONS}
        />
      ),
      cell: ({ row }) => {
        const sensorAtivo = isSensorTransmitindo(row.original)
        const vibracao = row.original.vibracao

        if (!sensorAtivo) {
          return <span className="text-sm text-muted-foreground">{getSensorSemSinalLabel(row.original)}</span>
        }

        if (!vibracao) {
          return <span className="text-sm text-muted-foreground">N/A</span>
        }

        return <LeituraCell valor={vibracao.valorAtual} unidade="mm/s" limiteMin={vibracao.limiteMin} limiteMax={vibracao.limiteMax} />
      },
      filterFn: selectSensorFilterFn,
    },
    {
      accessorKey: "ultimaLeituraEm",
      header: "Último sinal",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{tempoRelativo(row.original.ultimaLeituraEm)}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="cursor-pointer flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon">
              <EllipsisVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} collisionPadding={{ top: 96, right: 16, bottom: 16, left: 16 }} className="z-[80] w-36">
            <DropdownMenuItem className="cursor-pointer" onSelect={() => runAfterCurrentOverlayCloses(() => abrirVer(row.original))}>
              <EyeIcon className="mr-1 size-4" /> Ver detalhes
            </DropdownMenuItem>
            {canManageSensores ? (
              <>
                <DropdownMenuItem className="cursor-pointer" onSelect={() => runAfterCurrentOverlayCloses(() => abrirEditar(row.original))}>
                  <PencilIcon className="mr-1 size-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" variant="destructive" onSelect={() => runAfterCurrentOverlayCloses(() => confirmarExcluir(row.original))}>
                  <Trash2Icon className="mr-1 size-4" /> Excluir
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
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
    vinculoMaquina: table.getColumn("vinculoMaquina")?.getFilterValue(),
    status: table.getColumn("status")?.getFilterValue(),
    temperatura: table.getColumn("temperatura")?.getFilterValue(),
    vibracao: table.getColumn("vibracao")?.getFilterValue(),
  }
  const activeMobileFilters = Object.values(mobileFilterValues).filter((value) => value !== undefined && value !== "").length

  function alterarFiltroMobile(columnId, value) {
    table.getColumn(columnId)?.setFilterValue(value)
    table.setPageIndex(0)
  }

  function limparFiltrosMobile() {
    alterarFiltroMobile("vinculoMaquina", undefined)
    alterarFiltroMobile("status", undefined)
    alterarFiltroMobile("temperatura", undefined)
    alterarFiltroMobile("vibracao", undefined)
  }

  return (
    <>
      <SiteHeader />
      <div className="flex flex-col gap-6  p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className={"cursor-pointer"} size="icon-sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeftIcon className="size-4" />
            </Button>
            <div className="flex items-center gap-2">
              <NfcIcon size={22} className="text-[#3B2867] dark:text-white" />
              <h1 className="text-lg font-medium text-[#3B2867] dark:text-white">Sensores</h1>
            </div>
          </div>
          {canManageSensores ? (
            <Button onClick={abrirCriar} className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90" disabled={salvando}>
              <PlusIcon className="mr-1 size-4" />
              Novo sensor
            </Button>
          ) : null}
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
                onClick={() => recarregarSensores()}
                disabled={carregando || salvando}
                successMessage="Atualização dos sensores concluída."
              />
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-3 dark:*:data-[slot=card]:bg-card">
          <SensorMetricCard
            featured
            icon={CircleCheckIcon}
            label="Sensores online"
            value={<MetricValue value={totalOnline} loading={loadingInicial} />}
            badge={loadingInicial ? "Sincronizando" : `${sensores.length} total`}
            footer={loadingInicial ? "Atualizando sensores..." : `${totalOnline} transmitindo agora`}
          />

          <SensorMetricCard
            icon={AlertTriangleIcon}
            label="Fora do limite"
            value={<MetricValue value={foraDoLimite} loading={loadingInicial} />}
            badge={loadingInicial ? "Atualizando" : foraDoLimite > 0 ? "Alerta" : "Normal"}
            badgeClass={foraDoLimite > 0 ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300" : ""}
            footer={loadingInicial ? "Verificando limites..." : `${Math.max(sensores.length - foraDoLimite, 0)} dentro dos limites`}
          />

          <SensorMetricCard
            icon={NfcIcon}
            label="Sem máquina vinculada"
            value={<MetricValue value={semMaquina} loading={loadingInicial} />}
            badge={loadingInicial ? "Atualizando" : "Inativos"}
            badgeClass={semMaquina > 0 ? "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300" : ""}
            footer={loadingInicial ? "Conferindo vínculos..." : `${semMaquina} sem vínculo operacional`}
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
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por tipo ou máquina..."
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            className="pl-8 dark:border-gray-600" />
          </div>
        </div>

        {loadingInicial ? (
          <StatePanel message="Sincronizando sensores da página com a API..." />
        ) : errorSemDados ? (
          <StatePanel message={mensagem || "Não foi possível carregar os sensores."} tone="error" />
        ) : (
          <>
            <div className="flex flex-col gap-4 md:hidden">
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <SensorMobileCard key={row.id} sensor={row.original} onOpen={abrirVer} />
                ))
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                  Nenhum sensor encontrado.
                </div>
              )}
            </div>

            <div className="hidden min-h-[500px] overflow-auto rounded-lg border bg-card md:block dark:border-gray-700! dark:bg-[#0F172A]">
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
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                        Nenhum sensor encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <TablePagination table={table} />
          </>
        )}

        <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
          <SheetContent side="right" mobileSide="bottom" className="w-full max-w-none! gap-0 overflow-hidden sm:w-[420px]! sm:max-w-none!">
            <SheetHeader className="shrink-0">
              <SheetTitle>
                {modoSheet === "criar" ? "Novo sensor" : modoSheet === "editar" ? "Editar sensor" : "Detalhes do sensor"}
              </SheetTitle>
              <SheetDescription>
                {modoSheet === "criar"
                  ? "Cadastre os limites e ideais que serão enviados para a API."
                  : modoSheet === "editar"
                    ? "Altere as configurações e clique em salvar."
                    : "Leituras e configurações do sensor."}
              </SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4">
              {modoSheet === "ver" && sensorSelecionado ? (
                <>
                  <div className="rounded-xl border bg-linear-to-br from-primary/10 via-card to-card p-4 shadow-sm dark:border-gray-700! dark:bg-[#0F172A]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="line-clamp-2 text-xl font-semibold leading-tight text-foreground">{sensorSelecionado.tipo}</span>
                        <span className="line-clamp-2 text-sm text-muted-foreground">{sensorSelecionado.maquinaId ? sensorSelecionado.maquinaNome : "Sem maquina vinculada"}</span>
                      </div>
                      <StatusBadge value={sensorSelecionado.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline" className="px-3 text-muted-foreground">
                        ID {sensorSelecionado.id ?? "--"}
                      </Badge>
                      <Badge variant="outline" className="px-3 text-muted-foreground">
                        {tempoRelativo(sensorSelecionado.ultimaLeituraEm)}
                      </Badge>
                    </div>
                  </div>
                  <div className="hidden grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Tipo</Label>
                      <span className="text-sm font-semibold">{sensorDetalhado.tipo}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Máquina vinculada</Label>
                      <span className="text-sm font-medium">{sensorDetalhado.maquinaId ? sensorDetalhado.maquinaNome : "Sem máquina vinculada"}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <StatusBadge value={sensorDetalhado.status} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">ID do sensor</Label>
                      <span className="text-sm font-semibold">{sensorDetalhado.id ?? "--"}</span>
                    </div>
                  </div>
                  <Separator className="hidden" />
                  <div className="flex flex-col gap-3 rounded-lg border border-[#5E17EB] bg-[#5E17EB]/10 p-3 dark:border-[#5E17EB]/40 dark:bg-[#5E17EB]/10">
                    <div className="flex items-center gap-2">
                      <ThermometerIcon className="size-4 text-[#5E17EB] dark:text-[#5E17EB]" />
                      <span className="text-sm font-medium">Temperatura</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Leitura</Label>
                        <span className="text-sm font-semibold">{formatLeituraAtual(sensorDetalhado, sensorDetalhado.temperatura, " °C")}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Ideal</Label>
                        <span className="text-sm">{formatValue(sensorDetalhado.idealTemperatura, " °C")}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Limite</Label>
                        <span className="text-sm">{formatValue(sensorDetalhado.limiteTemperatura, " °C")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 rounded-lg border border-[#5E17EB] bg-[#5E17EB]/10 p-3 dark:border-[#5E17EB]/40 dark:bg-[#5E17EB]/10">
                    <div className="flex items-center gap-2">
                      <ActivityIcon className="size-4 text-[#5E17EB] dark:text-[#5E17EB]" />
                      <span className="text-sm font-medium">Vibração</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Leitura</Label>
                        <span className="text-sm font-semibold">{formatLeituraAtual(sensorDetalhado, sensorDetalhado.vibracao, " mm/s")}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Ideal</Label>
                        <span className="text-sm">{formatValue(sensorDetalhado.idealVibracao, " mm/s")}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Limite</Label>
                        <span className="text-sm">{formatValue(sensorDetalhado.limiteVibracao, " mm/s")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">Último sinal</Label>
                    <span className="text-sm">{tempoRelativo(sensorDetalhado.ultimaLeituraEm)}</span>
                  </div>
                  <Separator className="hidden" />
                  {canManageSensores ? (
                    <div className="hidden">
                      <Button className="cursor-pointer flex-1" onClick={() => { setSheetAberto(false); setTimeout(() => abrirEditar(sensorSelecionado), 100) }} disabled={salvando}>
                        <PencilIcon className="mr-1 size-4" />
                        Editar
                      </Button>
                      <Button variant="destructive" className="cursor-pointer" onClick={() => confirmarExcluir(sensorDetalhado)} disabled={salvando}>
                        <Trash2Icon className="mr-1 size-4" />
                        Excluir
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tipo">
                      Tipo do sensor <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="tipo"
                      placeholder="Ex: TEMPERATURA_VIBRACAO"
                      value={form.tipo}
                      onChange={(event) => setFormField("tipo", event.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="maquina">Máquina vinculada <span className="text-red-500">*</span></Label>
                    <Select value={form.maquinaId || SEM_MAQUINA_VALUE} onValueChange={handleMaquinaChange}>
                      <SelectTrigger id="maquina" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={SEM_MAQUINA_VALUE}>Sem máquina vinculada</SelectItem>
                          {maquinas.map((maquina) => (
                            <SelectItem key={maquina.id} value={String(maquina.id)}>
                              {maquina.nome}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <span className={`text-xs ${form.maquinaId ? "text-muted-foreground" : "font-medium text-red-600 dark:text-red-300"}`}>
                      {form.maquinaId
                        ? "Sensor será vinculado à máquina selecionada no cadastro da API."
                        : "Obrigatório: o back-end exige uma máquina para criar ou atualizar sensores."}
                    </span>
                  </div>
                  {modoSheet === "criar" ? (
                    <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-col gap-1">
                          <Label htmlFor="manual-sensor">Manual PDF</Label>
                          <span className="truncate text-xs text-muted-foreground">
                            {manualArquivo ? manualArquivo.name : "Nenhum arquivo selecionado"}
                          </span>
                        </div>
                        {manualPreview?.confianca ? (
                          <Badge variant="secondary" className="shrink-0 px-1.5">
                            Confianca {manualPreview.confianca}
                          </Badge>
                        ) : null}
                      </div>
                      <input
                        ref={manualInputRef}
                        id="manual-sensor"
                        type="file"
                        accept="application/pdf"
                        aria-label="Manual PDF"
                        className="sr-only"
                        onChange={handleManualFileChange}
                        disabled={manualPreviewLoading || salvando}
                      />
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          className="cursor-pointer justify-start sm:flex-1"
                          onClick={() => manualInputRef.current?.click()}
                          disabled={manualPreviewLoading || salvando}
                        >
                          <FileTextIcon className="mr-1 size-4" />
                          <span className="truncate">{manualArquivo ? manualArquivo.name : "Selecionar PDF"}</span>
                        </Button>
                        <Button
                          type="button"
                          className="cursor-pointer"
                          onClick={gerarPreviewManual}
                          disabled={manualPreviewLoading || salvando}
                        >
                          <SearchIcon className="mr-1 size-4" />
                          {manualPreviewLoading ? "Analisando..." : "Preview"}
                        </Button>
                      </div>
                      {manualPreview ? (
                        <div className="flex flex-col gap-3">
                          <div className="grid grid-cols-2 gap-2">
                            <ManualPreviewField field={manualPreview.fields.idealTemperatura} />
                            <ManualPreviewField field={manualPreview.fields.limiteTemperatura} />
                            <ManualPreviewField field={manualPreview.fields.idealVibracao} />
                            <ManualPreviewField field={manualPreview.fields.limiteVibracao} />
                          </div>
                          {manualPreview.observacoes.length > 0 ? (
                            <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                              {manualPreview.observacoes.map((observacao, index) => (
                                <li key={`${observacao}-${index}`}>{observacao}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="ideal-temperatura" className="text-xs text-muted-foreground">
                        Temperatura ideal <span className="text-red-500">*</span>
                      </Label>
                      <UnitInput
                        id="ideal-temperatura"
                        unit="°C"
                        placeholder="60"
                        value={form.idealTemperatura}
                        decimalPlaces={2}
                        onChange={(value) => setFormField("idealTemperatura", value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="limite-temperatura" className="text-xs text-muted-foreground">
                        Limite de temperatura <span className="text-red-500">*</span>
                      </Label>
                      <UnitInput
                        id="limite-temperatura"
                        unit="°C"
                        placeholder="80"
                        value={form.limiteTemperatura}
                        decimalPlaces={2}
                        onChange={(value) => setFormField("limiteTemperatura", value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="ideal-vibracao" className="text-xs text-muted-foreground">
                        Vibração ideal <span className="text-red-500">*</span>
                      </Label>
                      <UnitInput
                        id="ideal-vibracao"
                        unit="mm/s"
                        placeholder="0.4"
                        value={form.idealVibracao}
                        decimalPlaces={2}
                        onChange={(value) => setFormField("idealVibracao", value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="limite-vibracao" className="text-xs text-muted-foreground">
                        Limite de vibração <span className="text-red-500">*</span>
                      </Label>
                      <UnitInput
                        id="limite-vibracao"
                        unit="mm/s"
                        placeholder="0.8"
                        value={form.limiteVibracao}
                        decimalPlaces={2}
                        onChange={(value) => setFormField("limiteVibracao", value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Temperatura em Celsius (°C) e vibração em milímetros por segundo (mm/s). O limite deve ser maior que o valor ideal.
                  </p>
                </>
              )}
            </div>
            {modoSheet === "ver" && sensorSelecionado ? (
              <SheetFooter className="shrink-0 border-t border-border/70 bg-popover/95 p-3 shadow-[0_-12px_30px_rgba(0,0,0,0.08)]">
                {canManageSensores ? (
                  <div className="grid w-full gap-2 sm:grid-cols-2">
                    <Button className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { setSheetAberto(false); setTimeout(() => abrirEditar(sensorSelecionado), 100) }} disabled={salvando}>
                      <PencilIcon className="mr-1 size-4" />
                      Editar
                    </Button>
                    <Button variant="destructive" className="cursor-pointer" onClick={() => confirmarExcluir(sensorSelecionado)} disabled={salvando}>
                      <Trash2Icon className="mr-1 size-4" />
                      Excluir
                    </Button>
                  </div>
                ) : null}
              </SheetFooter>
            ) : (
              <SheetFooter className="shrink-0 border-t border-border/70 bg-popover/95 p-3 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] sm:flex-row sm:justify-end">
                <Button variant="outline" className="cursor-pointer" onClick={() => setSheetAberto(false)} disabled={salvando}>
                  Cancelar
                </Button>
                <Button className="cursor-pointer" onClick={salvar} disabled={salvando || manualPreviewLoading}>
                  {salvando ? "Salvando..." : modoSheet === "criar" ? "Cadastrar" : "Salvar alterações"}
                </Button>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>

        <Dialog open={dialogExcluir} onOpenChange={alternarDialogExcluir}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o sensor <strong>{sensorExcluir?.tipo}</strong>? Esta ação será enviada para a API e não usa mais dados locais do navegador.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" className="cursor-pointer" onClick={() => alternarDialogExcluir(false)} disabled={salvando}>
                Cancelar
              </Button>
              <Button variant="destructive" className="cursor-pointer" onClick={excluir} disabled={salvando}>
                {salvando ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
