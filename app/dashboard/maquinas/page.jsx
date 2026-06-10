"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { useMaquinas } from "@/components/context/maquinas-context"
import { useManutencoes } from "@/components/context/manutencoes-context"
import { useAlertas } from "@/components/context/alertas-context"
import { useSensores } from "@/components/context/sensores-context"
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MaquinaDetailsPanel, MaquinaUploadImagePreview } from "@/components/maquina-details-panel"
import { RefreshTooltipButton } from "@/components/refresh-tooltip-button"
import { SiteHeader } from "@/components/site-header"
import { TablePagination } from "@/components/table-pagination"
import { TableColumnHeaderMenu } from "@/components/table-column-header-menu"
import { MetricValue, useDashboardMetricsLoading } from "@/components/animated-metric"
import {
  CircleCheckIcon, AlertTriangleIcon, EllipsisVerticalIcon, PlusIcon,
  ArrowLeftIcon, PencilIcon, Trash2Icon, EyeIcon, SearchIcon,
  WashingMachineIcon, ShieldAlertIcon, ImageIcon, UploadIcon,
  CircleMinusIcon, SlidersHorizontalIcon, ChevronDownIcon,
} from "lucide-react"
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { runAfterCurrentOverlayCloses } from "@/lib/deferred-ui"
import {
  MAQUINA_IMPORTANCIA_FILTER_OPTIONS as IMPORTANCIA_FILTER_OPTIONS,
  MAQUINA_IMPORTANCIA_SORT_OPTIONS as IMPORTANCIA_SORT_OPTIONS,
  MAQUINA_INTEGRIDADE_FILTER_OPTIONS as INTEGRIDADE_FILTER_OPTIONS,
  MAQUINA_INTEGRIDADE_SORT_OPTIONS as INTEGRIDADE_SORT_OPTIONS,
  MAQUINA_STATUS_FILTER_OPTIONS as STATUS_FILTER_OPTIONS,
  MAQUINA_STATUS_SORT_OPTIONS as STATUS_SORT_OPTIONS,
  getMaquinaIntegridadeExibicao,
  getMaquinaStatusExibicao,
  importanciaMaquinaSortFn,
  integridadeMaquinaFilterFn as integridadeFilterFn,
  selectMaquinaFilterFn as selectFilterFn,
  statusMaquinaSortFn,
  withMaquinaAlertasStatus,
} from "@/lib/maquinas-table"

const formVazio = { nome: "", setor: "", tipo: "", criticidade: "MEDIA" }
const FILTER_ALL_VALUE = "__all__"

function CriticidadeBadge({ value }) {
  const styles = {
    ALTA: "bg-white text-gray-700 border-gray-200 dark:border-border dark:bg-muted/30 dark:text-muted-foreground",
    MEDIA: "bg-white text-gray-700 border-gray-200 dark:border-border dark:bg-muted/30 dark:text-muted-foreground",
    BAIXA: "bg-white text-gray-700 border-gray-200 dark:border-border dark:bg-muted/30 dark:text-muted-foreground",
  }
  return <Badge variant="outline" className={`px-1.5 ${styles[value]}`}>{value.charAt(0) + value.slice(1).toLowerCase()}</Badge>
}

function StatusBadge({ value }) {
  if (value === "SEM_SENSOR") {
    return (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        <CircleMinusIcon className="text-muted-foreground" />
        Sem sensor
      </Badge>
    )
  }

  if (value === "EM_ANDAMENTO") {
    return (
      <Badge variant="outline" className="px-1.5 border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300">
        <AlertTriangleIcon className="text-orange-500 dark:text-orange-300" />
        Em andamento
      </Badge>
    )
  }

  if (value === "COM_ALERTA") {
    return (
      <Badge variant="outline" className="px-1.5 border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
        <AlertTriangleIcon className="text-red-500 dark:text-red-300" />
        Com alerta
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      {value === "OK" ? <CircleCheckIcon className="fill-[#5E17EB]! dark:fill-primary!" /> : <AlertTriangleIcon className="text-red-500 dark:text-red-300" />}
      {value}
    </Badge>
  )
}

function IntegridadeBar({ value, inactive = false }) {
  const normalizedValue = Math.round(Number(value)) // isso arredonda o valor 

  if (inactive || !Number.isFinite(normalizedValue)) {
    return (
      <div className="flex items-center gap-2 min-w-[110px]">
        <span className="text-sm font-medium w-9 text-start tabular-nums text-muted-foreground">--</span>
        <div className="flex-1 h-1.5 w-4 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-full rounded-full bg-muted-foreground/20" />
        </div>
      </div>
    )
  }

  const cor = normalizedValue < 50 ? "bg-red-500" : normalizedValue < 75 ? "bg-yellow-400" : "bg-green-500"
  const textCor = normalizedValue < 50 ? "text-red-500 dark:text-red-300" : normalizedValue < 75 ? "text-yellow-500 dark:text-yellow-300" : "text-green-600 dark:text-green-300"

  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <span className={`text-sm font-medium w-9 text-start  tabular-nums ${textCor}`}>{normalizedValue}%</span>
      <div className="flex-1 h-1.5 w-4 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${normalizedValue}%` }} />
      </div>

    </div>
  )
}

function MaquinaMobileCard({ maquina, onOpen }) {
  const status = getMaquinaStatusExibicao(maquina)
  const integridade = getMaquinaIntegridadeExibicao(maquina)
  const normalizedIntegridade = Math.round(Number(integridade))
  const hasIntegridade = status !== "SEM_SENSOR" && Number.isFinite(normalizedIntegridade)
  const integridadeColor = normalizedIntegridade < 50 ? "bg-red-500" : normalizedIntegridade < 75 ? "bg-yellow-400" : "bg-green-500"
  const integridadeTextColor = normalizedIntegridade < 50 ? "text-red-500 dark:text-red-300" : normalizedIntegridade < 75 ? "text-yellow-500 dark:text-yellow-300" : "text-green-600 dark:text-green-300"

  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg border bg-card p-2 text-left shadow-sm transition-colors hover:border-[#5E17EB] focus-visible:border-[#5E17EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E17EB]/20 dark:border-gray-700! dark:bg-[#0F172A]"
      onClick={() => onOpen(maquina)}
    >
      <span className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted text-muted-foreground">
        {maquina.imagem ? (
          <img src={maquina.imagem} alt="" className="size-full object-cover" />
        ) : (
          <WashingMachineIcon className="size-16 stroke-1 text-muted-foreground/35" />
        )}
      </span>

      <span className="flex min-w-0 min-h-[110px] justify-between flex-1 flex-col gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="line-clamp-2 text-xl font-medium leading-tight text-foreground">{maquina.nome}</span>
          <span className="text-sm text-muted-foreground">{maquina.setor}</span>
         
        </span>

        <span className="flex items-center justify-between gap-1">
          <span className="flex min-w-0 items-center gap-2">
            {hasIntegridade ? (
              <span className={`w-12 text-lg font-medium tabular-nums ${integridadeTextColor}`}>
                {normalizedIntegridade}%
              </span>
            ) : (
              <span className="w-12 text-lg font-medium tabular-nums text-muted-foreground">--</span>
            )}
           
          </span>
          <span className="shrink-0 flex gap-1 items-center ">
            <CriticidadeBadge value={maquina.criticidade}/>
            <StatusBadge value={status} />
          </span>
        </span>
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
            title="Importancia"
            value={filters.criticidade}
            options={IMPORTANCIA_FILTER_OPTIONS}
            onChange={(value) => onFilterChange("criticidade", value)}
          />
          <MobileFilterSection
            title="Status"
            value={filters.status}
            options={STATUS_FILTER_OPTIONS}
            onChange={(value) => onFilterChange("status", value)}
          />
          <MobileFilterSection
            title="Integridade"
            value={filters.integridade}
            options={INTEGRIDADE_FILTER_OPTIONS}
            onChange={(value) => onFilterChange("integridade", value)}
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

function MaquinaMetricCard({ label, value, badge, badgeClass = "", footer, icon: Icon, featured = false, children }) {
  return (
    <Card
      className={`@container/card transition-colors hover:border-[#5E17EB]! hover:ring-[#5E17EB]/50 focus-within:border-[#5E17EB]! focus-within:ring-[#5E17EB]/10 `}
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
        {children}
      </CardFooter>
    </Card>
  )
}

function formatMetric(value, loading, suffix = "") {
  if (loading) {
    return "--"
  }

  return `${value}${suffix}`
}

export default function MaquinasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const permissions = useDashboardPermissions()
  const {
    maquinas,
    status,
    mensagem,
    carregando,
    salvando,
    adicionarMaquina,
    editarMaquina,
    excluirMaquina,
    atualizarImagemMaquina,
    recarregarMaquinas,
  } = useMaquinas()
  const {
    manutencoes,
    status: manutencoesStatus,
    mensagem: manutencoesMensagem,
    salvando: salvandoManutencao,
    criarPreventiva,
    concluirManutencao,
    recarregarManutencoes,
  } = useManutencoes()
  const { alertas } = useAlertas()
  const {
    sensores,
    status: sensoresStatus,
    mensagem: sensoresMensagem,
    recarregarSensores,
  } = useSensores()

  const [busca, setBusca] = React.useState("")
  const [sheetAberto, setSheetAberto] = React.useState(false)
  const [modoSheet, setModoSheet] = React.useState("criar")
  const [maquinaSelecionada, setMaquinaSelecionada] = React.useState(null)
  const [form, setForm] = React.useState(formVazio)
  const [imagemArquivo, setImagemArquivo] = React.useState(null)
  const [imagemPreview, setImagemPreview] = React.useState("")
  const [dialogExcluir, setDialogExcluir] = React.useState(false)
  const [maquinaExcluir, setMaquinaExcluir] = React.useState(null)
  const [confirmacaoExclusao, setConfirmacaoExclusao] = React.useState("")
  const [sorting, setSorting] = React.useState([])
  const [columnFilters, setColumnFilters] = React.useState([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [openActionMenuId, setOpenActionMenuId] = React.useState(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false)
  const [preventiveActionId, setPreventiveActionId] = React.useState(null)
  const maquinaAbertaPelaUrlRef = React.useRef(null)

  const loadingInicial = useDashboardMetricsLoading(carregando && maquinas.length === 0)
  const errorSemDados = status === "error" && maquinas.length === 0
  const canManageMaquinas = permissions.canManageMaquinas
  const sensorError = sensoresStatus === "error" ? sensoresMensagem : ""
  const sensoresVinculadosExclusao = Math.max(Number(maquinaExcluir?.sensores ?? 0), 0)
  const podeExcluirMaquina =
    Boolean(maquinaExcluir) &&
    confirmacaoExclusao === maquinaExcluir?.nome &&
    !salvando

  const maquinasComStatus = React.useMemo(() => withMaquinaAlertasStatus(maquinas, alertas), [alertas, maquinas])
  const maquinaSelecionadaAtual = React.useMemo(() => {
    if (!maquinaSelecionada?.id) {
      return maquinaSelecionada
    }

    return maquinasComStatus.find((maquina) => String(maquina.id) === String(maquinaSelecionada.id)) ?? maquinaSelecionada
  }, [maquinaSelecionada, maquinasComStatus])
  const maquinaDetalhada = modoSheet === "ver" ? maquinaSelecionadaAtual : maquinaSelecionada
  const manutencoesMaquinaDetalhada = React.useMemo(() => {
    if (!maquinaDetalhada?.id) {
      return []
    }

    return manutencoes.filter((manutencao) => String(manutencao.maquinaId) === String(maquinaDetalhada.id))
  }, [maquinaDetalhada?.id, manutencoes])
  const totalOk = React.useMemo(() => maquinasComStatus.filter((maquina) => getMaquinaStatusExibicao(maquina) === "OK").length, [maquinasComStatus])
  const totalAlerta = React.useMemo(() => maquinasComStatus.filter((maquina) => ["COM_ALERTA", "EM_ANDAMENTO"].includes(getMaquinaStatusExibicao(maquina))).length, [maquinasComStatus])
  const criticasAlta = React.useMemo(() => maquinasComStatus.filter((maquina) => maquina.criticidade === "ALTA").length, [maquinasComStatus])
  const criticasAltaAlerta = React.useMemo(
    () => maquinasComStatus.filter((maquina) => maquina.criticidade === "ALTA" && ["COM_ALERTA", "EM_ANDAMENTO"].includes(getMaquinaStatusExibicao(maquina))).length,
    [maquinasComStatus]
  )
  const integridadeMedia = React.useMemo(
    () => maquinasComStatus.length
      ? Math.round(maquinasComStatus.reduce((acc, maquina) => acc + (maquina.integridade ?? 0), 0) / maquinasComStatus.length)
      : 0,
    [maquinasComStatus]
  )

  React.useEffect(() => {
    if (!imagemArquivo) {
      setImagemPreview("")
      return
    }

    const objectUrl = URL.createObjectURL(imagemArquivo)
    setImagemPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [imagemArquivo])

  React.useEffect(() => {
    if (searchParams.get("action") === "new") {
      if (!canManageMaquinas) {
        router.replace("/dashboard/maquinas")
        return
      }

      abrirCriar()
    }
  }, [canManageMaquinas, router, searchParams])

  React.useEffect(() => {
    const machineIdParam = searchParams.get("machineId")

    if (!machineIdParam || maquinasComStatus.length === 0) {
      if (!machineIdParam) {
        maquinaAbertaPelaUrlRef.current = null
      }
      return
    }

    const machineIdKey = String(machineIdParam)

    if (maquinaAbertaPelaUrlRef.current === machineIdKey) {
      return
    }

    const maquina = maquinasComStatus.find((item) => String(item.id) === String(machineIdParam))

    if (maquina) {
      maquinaAbertaPelaUrlRef.current = machineIdKey
      abrirVer(maquina)
    }
  }, [maquinasComStatus, searchParams])

  function abrirCriar() {
    if (!canManageMaquinas) {
      return
    }

    setModoSheet("criar")
    setForm(formVazio)
    setImagemArquivo(null)
    setMaquinaSelecionada(null)
    setSheetAberto(true)
  }

  function abrirEditar(maquina) {
    if (!canManageMaquinas) {
      return
    }

    setModoSheet("editar")
    setForm({
      nome: maquina.nome,
      setor: maquina.setor,
      tipo: maquina.tipo,
      criticidade: maquina.criticidade,
    })
    setImagemArquivo(null)
    setMaquinaSelecionada(maquina)
    setSheetAberto(true)
  }

  function abrirVer(maquina) {
    setModoSheet("ver")
    setImagemArquivo(null)
    setMaquinaSelecionada(maquina)
    setSheetAberto(true)
  }

  function selecionarImagem(event) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    if (!["image/png", "image/jpg", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Use uma imagem PNG, JPG, JPEG ou WEBP.")
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 15 MB.")
      return
    }

    setImagemArquivo(file)
  }

  async function salvar() {
    if (!form.nome.trim() || !form.setor.trim() || !form.tipo.trim()) {
      toast.error("Preencha todos os campos obrigatórios.")
      return
    }

    try {
      let maquinaId = maquinaSelecionada?.id

      if (modoSheet === "criar") {
        const payload = await adicionarMaquina(form)
        maquinaId = payload?.id ?? payload?.data?.id ?? payload?.dados?.id

        if (imagemArquivo && maquinaId) {
          await atualizarImagemMaquina(maquinaId, imagemArquivo)
        }

        toast.success("Máquina cadastrada com sucesso!")
      } else {
        await editarMaquina(maquinaSelecionada.id, form)

        if (imagemArquivo && maquinaId) {
          await atualizarImagemMaquina(maquinaId, imagemArquivo)
        }

        toast.success("Máquina atualizada com sucesso!")
      }

      setSheetAberto(false)
      setForm(formVazio)
      setImagemArquivo(null)
      setMaquinaSelecionada(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a máquina.")
    }
  }

  function confirmarExcluir(maquina) {
    if (!canManageMaquinas) {
      return
    }

    setMaquinaExcluir(maquina)
    setConfirmacaoExclusao("")
    setDialogExcluir(true)
  }

  function alternarDialogExcluir(open) {
    setDialogExcluir(open)

    if (!open) {
      setMaquinaExcluir(null)
      setConfirmacaoExclusao("")
    }
  }

  async function excluir() {
    if (!maquinaExcluir) {
      return
    }

    try {
      await excluirMaquina(maquinaExcluir.id)
      toast.success("Máquina removida.")
      setDialogExcluir(false)
      setSheetAberto(false)
      setMaquinaExcluir(null)
      setConfirmacaoExclusao("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover a máquina.")
    }
  }

  async function iniciarPreventivaMaquina(observacao) {
    if (!maquinaDetalhada?.id) {
      return false
    }

    try {
      setPreventiveActionId("create")
      await criarPreventiva({ maquinaId: maquinaDetalhada.id, observacao })
      await Promise.allSettled([recarregarManutencoes(), recarregarMaquinas()])
      toast.success("Manutenção preventiva iniciada.")
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar a manutenção preventiva.")
      return false
    } finally {
      setPreventiveActionId(null)
    }
  }

  async function concluirPreventivaMaquina(manutencao) {
    if (!manutencao?.id) {
      return
    }

    try {
      setPreventiveActionId(manutencao.id)
      await concluirManutencao(manutencao.id, manutencao.observacao || "Preventiva finalizada.")
      await Promise.allSettled([recarregarManutencoes(), recarregarMaquinas(), recarregarSensores()])
      toast.success("Manutenção preventiva concluída.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir a manutenção preventiva.")
    } finally {
      setPreventiveActionId(null)
    }
  }

  const dadosFiltrados = React.useMemo(() =>
    maquinasComStatus.filter((maquina) =>
      maquina.nome.toLowerCase().includes(busca.toLowerCase()) ||
      maquina.setor.toLowerCase().includes(busca.toLowerCase()) ||
      maquina.tipo.toLowerCase().includes(busca.toLowerCase())
    ),
  [maquinasComStatus, busca])

  const columns = [
    {
      accessorKey: "nome",
      header: "Máquina",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => abrirVer(row.original)}
            className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground"
          >
            {row.original.imagem ? (
              <img src={row.original.imagem} alt="" className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-4" />
            )}
          </button>
          <button
            onClick={() => abrirVer(row.original)}
            className="cursor-pointer text-left text-sm font-medium transition-colors hover:text-primary hover:underline"
          >
            {row.original.nome}
          </button>
        </div>
      ),
    },
    { accessorKey: "setor", header: "Setor", cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.setor}</span> },
    {
      accessorKey: "criticidade",
      header: ({ column }) => (
        <TableColumnHeaderMenu
          column={column}
          label="Importância"
          filterOptions={IMPORTANCIA_FILTER_OPTIONS}
          sortOptions={IMPORTANCIA_SORT_OPTIONS}
        />
      ),
      cell: ({ row }) => <CriticidadeBadge value={row.original.criticidade} />,
      filterFn: selectFilterFn,
      sortingFn: importanciaMaquinaSortFn,
    },
    {
      id: "status",
      accessorFn: getMaquinaStatusExibicao,
      header: ({ column }) => (
        <TableColumnHeaderMenu
          column={column}
          label="Status"
          filterOptions={STATUS_FILTER_OPTIONS}
          sortOptions={STATUS_SORT_OPTIONS}
        />
      ),
      cell: ({ row }) => <StatusBadge value={row.getValue("status")} />,
      filterFn: selectFilterFn,
      sortingFn: statusMaquinaSortFn,
    },
    {
      id: "integridade",
      accessorFn: getMaquinaIntegridadeExibicao,
      header: ({ column }) => (
        <TableColumnHeaderMenu
          column={column}
          label="Integridade"
          filterOptions={INTEGRIDADE_FILTER_OPTIONS}
          sortOptions={INTEGRIDADE_SORT_OPTIONS}
        />
      ),
      cell: ({ row }) => <IntegridadeBar value={row.getValue("integridade")} inactive={row.getValue("status") === "SEM_SENSOR"} />,
      filterFn: integridadeFilterFn,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const menuId = String(row.original.id ?? row.id)

        return (
          <DropdownMenu
            modal={false}
            open={openActionMenuId === menuId}
            onOpenChange={(open) => setOpenActionMenuId(open ? menuId : null)}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="cursor-pointer flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon">
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} collisionPadding={{ top: 96, right: 16, bottom: 16, left: 16 }} className="z-[80] w-36">
              <DropdownMenuItem className="cursor-pointer" onSelect={() => runAfterCurrentOverlayCloses(() => abrirVer(row.original))}>
                <EyeIcon className="mr-1 size-4" /> Ver detalhes
              </DropdownMenuItem>
              {canManageMaquinas ? (
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
    criticidade: table.getColumn("criticidade")?.getFilterValue(),
    status: table.getColumn("status")?.getFilterValue(),
    integridade: table.getColumn("integridade")?.getFilterValue(),
  }
  const activeMobileFilters = Object.values(mobileFilterValues).filter((value) => value !== undefined && value !== "").length

  function alterarFiltroMobile(columnId, value) {
    table.getColumn(columnId)?.setFilterValue(value)
    table.setPageIndex(0)
  }

  function limparFiltrosMobile() {
    alterarFiltroMobile("criticidade", undefined)
    alterarFiltroMobile("status", undefined)
    alterarFiltroMobile("integridade", undefined)
  }

  return (
    <>
      <SiteHeader />
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">

            <Tooltip>
              <TooltipTrigger asChild>
                <Button className={"cursor-pointer "} variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}>
                  <ArrowLeftIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="mb-0!">Voltar ao dashboard</p></TooltipContent>
            </Tooltip>

            <div>
              <div className="flex items-center gap-2">
                <WashingMachineIcon size={22} className="text-[#3B2867] dark:text-white" />
                <h1 className="text-[18pt]! mb-0! font-medium text-[#3B2867] dark:text-white">Máquinas</h1>
              </div>

            </div>
          </div>
          {canManageMaquinas ? (
            <Button onClick={abrirCriar} className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90" disabled={salvando}>
              <PlusIcon className="mr-1 size-4" />
              Nova máquina
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
                onClick={() => recarregarMaquinas()}
                disabled={carregando || salvando}
                successMessage="Atualização das máquinas concluída."
              />
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-3 dark:*:data-[slot=card]:bg-card">
          <MaquinaMetricCard
            featured
            icon={WashingMachineIcon}
            label="Total de máquinas"
            value={<MetricValue value={maquinas.length} loading={loadingInicial} />}
            badge={loadingInicial ? "Sincronizando" : totalAlerta > 0 ? `${totalAlerta} em alerta` : `${maquinas.length} cadastradas`}
            badgeClass={totalAlerta > 0 ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300" : ""}
            footer={loadingInicial ? "Atualizando operação..." : `${totalOk} operando normalmente`}
          />

          <MaquinaMetricCard
            icon={ShieldAlertIcon}
            label="Alta importância"
            value={<MetricValue value={criticasAlta} loading={loadingInicial} />}
            badge={loadingInicial ? "Atualizando" : "Atenção"}
            badgeClass={criticasAltaAlerta > 0 ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300" : ""}
            footer={loadingInicial ? "Verificando status..." : `${criticasAltaAlerta} em alerta agora`}
          />

          <MaquinaMetricCard
            icon={CircleCheckIcon}
            label="Integridade média"
            value={<MetricValue value={integridadeMedia} loading={loadingInicial} suffix="%" />}
            badge={loadingInicial ? "Atualizando" : integridadeMedia >= 75 ? "Estável" : integridadeMedia >= 50 ? "Atenção" : "Crítico"}
            badgeClass={
              loadingInicial
                ? ""
                : integridadeMedia >= 75
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300"
                  : integridadeMedia >= 50
                    ? "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300"
                    : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
            }
            footer={loadingInicial ? "Calculando integridade..." : "Média de integridade da frota"}
          >
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  integridadeMedia >= 75 ? "bg-green-500" : integridadeMedia >= 50 ? "bg-yellow-400" : "bg-red-500"
                }`}
                style={{ width: `${loadingInicial ? 0 : integridadeMedia}%` }}
              />
            </div>
          </MaquinaMetricCard>
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
              placeholder="Buscar por nome, setor ou tipo..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              className="pl-8 dark:border-gray-600"
            />
          </div>
        </div>

        {loadingInicial ? (
          <StatePanel message="Sincronizando máquinas da página com a API..." />
        ) : errorSemDados ? (
          <StatePanel message={mensagem || "Não foi possível carregar as máquinas."} tone="error" />
        ) : (
          <>
            <div className="flex flex-col gap-4 md:hidden">
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <MaquinaMobileCard key={row.id} maquina={row.original} onOpen={abrirVer} />
                ))
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                  Nenhuma máquina encontrada.
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
                        Nenhuma máquina encontrada.
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
          <SheetContent side="right" mobileSide="bottom" className="w-full max-w-none! gap-0 overflow-hidden sm:w-[560px]! sm:max-w-none!">
            {modoSheet === "ver" && maquinaDetalhada ? (
              <div key="ver" className="flex min-h-0 flex-1 flex-col animate-in fade-in-0 slide-in-from-right-4 duration-200">
                <SheetHeader className="shrink-0">
                  <SheetTitle>Detalhes da máquina</SheetTitle>
                  <SheetDescription>Veja o resumo operacional e execute ações rápidas.</SheetDescription>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2">
                  <MaquinaDetailsPanel
                    maquina={maquinaDetalhada}
                    sensores={sensores}
                    sensorError={sensorError}
                    manutencoes={manutencoesMaquinaDetalhada}
                    manutencoesStatus={manutencoesStatus}
                    manutencoesMensagem={manutencoesMensagem}
                    canManagePreventiveMaintenances={permissions.canManagePreventiveMaintenances}
                    preventiveActionId={preventiveActionId}
                    preventiveSaving={salvandoManutencao}
                    onCreatePreventiveMaintenance={iniciarPreventivaMaquina}
                    onCompletePreventiveMaintenance={concluirPreventivaMaquina}
                  />
                </div>
                <SheetFooter className="shrink-0 border-t border-border/70 bg-popover/95 p-3 shadow-[0_-12px_30px_rgba(0,0,0,0.08)]">
                  <div className="grid w-full gap-2 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      className={canManageMaquinas ? "cursor-pointer" : "cursor-pointer sm:col-span-2"}
                      type="button"
                      onClick={() => router.push(`/dashboard/alertas?maquina=${encodeURIComponent(maquinaDetalhada.nome)}`)}
                    >
                      <EyeIcon className="mr-1 size-4" />
                      Ver alertas
                    </Button>
                    {canManageMaquinas ? (
                      <>
                        <Button className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => abrirEditar(maquinaDetalhada)} disabled={salvando}>
                          <PencilIcon className="mr-1 size-4" /> Editar
                        </Button>
                        <Button variant="destructive" className="cursor-pointer sm:col-span-2" onClick={() => confirmarExcluir(maquinaDetalhada)} disabled={salvando}>
                          <Trash2Icon className="mr-1 size-4" /> Excluir
                        </Button>
                      </>
                    ) : null}
                  </div>
                </SheetFooter>
              </div>
            ) : (
              <div key={modoSheet} className="flex min-h-0 flex-1 flex-col animate-in fade-in-0 slide-in-from-right-4 duration-200">
                <SheetHeader>
                  <SheetTitle>{modoSheet === "criar" ? "Nova máquina" : "Editar máquina"}</SheetTitle>
                  <SheetDescription>{modoSheet === "criar" ? "Preencha os dados para cadastrar uma nova máquina." : "Altere os dados e clique em salvar."}</SheetDescription>
                </SheetHeader>
                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="imagem-maquina">Imagem da máquina</Label>
                    <MaquinaUploadImagePreview
                      src={imagemPreview || maquinaSelecionada?.imagem}
                      alt={maquinaSelecionada?.nome ? `Imagem da máquina ${maquinaSelecionada.nome}` : "Imagem da máquina"}
                    />
                    <Input
                      id="imagem-maquina"
                      type="file"
                      accept="image/png,image/jpg,image/jpeg,image/webp"
                      className="hidden"
                      onChange={selecionarImagem}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("imagem-maquina")?.click()}
                      disabled={salvando}
                    >
                      <UploadIcon className="mr-1 size-4" />
                      {imagemArquivo ? imagemArquivo.name : "Selecionar imagem"}
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="nome">Nome <span className="text-red-500">*</span></Label>
                    <Input id="nome" placeholder="Ex: Motor Esteira A1" value={form.nome} onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="setor">Setor <span className="text-red-500">*</span></Label>
                    <Input id="setor" placeholder="Ex: Linha de Produção A" value={form.setor} onChange={(event) => setForm((prev) => ({ ...prev, setor: event.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tipo">Tipo de máquina <span className="text-red-500">*</span></Label>
                    <Input id="tipo" placeholder="Ex: Motor Elétrico, Compressor..." value={form.tipo} onChange={(event) => setForm((prev) => ({ ...prev, tipo: event.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="criticidade">Importância</Label>
                    <Select value={form.criticidade} onValueChange={(value) => setForm((prev) => ({ ...prev, criticidade: value }))}>
                      <SelectTrigger id="criticidade" className="w-full">
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
                </div>
                <SheetFooter className="px-4 pb-4 sm:flex-row sm:justify-end">
                  <Button variant="outline" className="cursor-pointer" onClick={() => setSheetAberto(false)} disabled={salvando}>Cancelar</Button>
                  <Button className="cursor-pointer" onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando..." : modoSheet === "criar" ? "Cadastrar" : "Salvar alterações"}
                  </Button>
                </SheetFooter>
              </div>
            )}
          </SheetContent>
        </Sheet>

        <Dialog open={dialogExcluir} onOpenChange={alternarDialogExcluir}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                A máquina <strong>{maquinaExcluir?.nome}</strong> ficará inativa no banco de dados. Os sensores vinculados também ficarão inativos. Tem certeza que deseja excluir?
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="font-medium">
                  {sensoresVinculadosExclusao > 0
                    ? `${sensoresVinculadosExclusao} sensor(es) vinculado(s) serão inativados.`
                    : ""}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmacao-exclusao" className="text-sm text-muted-foreground">
                Digite o nome da máquina para confirmar:
              </Label>
              <Input
                id="confirmacao-exclusao"
                placeholder={maquinaExcluir?.nome}
                value={confirmacaoExclusao}
                onChange={(event) => setConfirmacaoExclusao(event.target.value)}
                disabled={salvando}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => alternarDialogExcluir(false)} disabled={salvando}>Cancelar</Button>
              <Button
                variant="destructive"
                disabled={!podeExcluirMaquina}
                onClick={excluir}
              >
                {salvando ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
