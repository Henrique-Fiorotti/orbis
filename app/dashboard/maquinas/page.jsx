"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { useMaquinas } from "@/components/context/maquinas-context"
import { useSensores } from "@/components/context/sensores-context"
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MaquinaDetailsPanel, MaquinaImagePreview } from "@/components/maquina-details-panel"
import { SiteHeader } from "@/components/site-header"
import { TableColumnHeaderMenu } from "@/components/table-column-header-menu"
import { MetricValue, useDashboardMetricsLoading } from "@/components/animated-metric"
import {
  CircleCheckIcon, AlertTriangleIcon, EllipsisVerticalIcon, PlusIcon,
  ArrowLeftIcon, PencilIcon, Trash2Icon, EyeIcon, SearchIcon,
  ChevronsLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon,
  WashingMachineIcon, ShieldAlertIcon, RefreshCcwIcon, ImageIcon, UploadIcon,
  CircleMinusIcon,
} from "lucide-react"
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { runAfterCurrentOverlayCloses } from "@/lib/deferred-ui"
import { tempoRelativo } from "@/lib/utils"
import {
  MAQUINA_IMPORTANCIA_FILTER_OPTIONS as IMPORTANCIA_FILTER_OPTIONS,
  MAQUINA_IMPORTANCIA_SORT_OPTIONS as IMPORTANCIA_SORT_OPTIONS,
  MAQUINA_INTEGRIDADE_FILTER_OPTIONS as INTEGRIDADE_FILTER_OPTIONS,
  MAQUINA_INTEGRIDADE_SORT_OPTIONS as INTEGRIDADE_SORT_OPTIONS,
  MAQUINA_STATUS_FILTER_OPTIONS as STATUS_FILTER_OPTIONS,
  MAQUINA_STATUS_SORT_OPTIONS as STATUS_SORT_OPTIONS,
  getMaquinaIntegridadeExibicao,
  getMaquinaStatusExibicao,
  getMaquinaUltimaLeituraExibicao,
  importanciaMaquinaSortFn,
  integridadeMaquinaFilterFn as integridadeFilterFn,
  selectMaquinaFilterFn as selectFilterFn,
  statusMaquinaSortFn,
} from "@/lib/maquinas-table"

const formVazio = { nome: "", setor: "", tipo: "", criticidade: "MEDIA" }

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

  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      {value === "OK" ? <CircleCheckIcon className="fill-[#5E17EB]! dark:fill-primary!" /> : <AlertTriangleIcon className="text-red-500 dark:text-red-300" />}
      {value}
    </Badge>
  )
}

function IntegridadeBar({ value, inactive = false }) {
  const normalizedValue = Number(value)

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
    sensores,
    status: sensoresStatus,
    mensagem: sensoresMensagem,
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

  const totalOk = React.useMemo(() => maquinas.filter((maquina) => maquina.status === "OK").length, [maquinas])
  const totalAlerta = React.useMemo(() => maquinas.filter((maquina) => maquina.status !== "OK").length, [maquinas])
  const criticasAlta = React.useMemo(() => maquinas.filter((maquina) => maquina.criticidade === "ALTA").length, [maquinas])
  const criticasAltaAlerta = React.useMemo(
    () => maquinas.filter((maquina) => maquina.criticidade === "ALTA" && maquina.status !== "OK").length,
    [maquinas]
  )
  const integridadeMedia = React.useMemo(
    () => maquinas.length
      ? Math.round(maquinas.reduce((acc, maquina) => acc + (maquina.integridade ?? 0), 0) / maquinas.length)
      : 0,
    [maquinas]
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

    if (!machineIdParam || maquinas.length === 0) {
      if (!machineIdParam) {
        maquinaAbertaPelaUrlRef.current = null
      }
      return
    }

    const machineIdKey = String(machineIdParam)

    if (maquinaAbertaPelaUrlRef.current === machineIdKey) {
      return
    }

    const maquina = maquinas.find((item) => String(item.id) === String(machineIdParam))

    if (maquina) {
      maquinaAbertaPelaUrlRef.current = machineIdKey
      abrirVer(maquina)
    }
  }, [maquinas, searchParams])

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

  const dadosFiltrados = React.useMemo(() =>
    maquinas.filter((maquina) =>
      maquina.nome.toLowerCase().includes(busca.toLowerCase()) ||
      maquina.setor.toLowerCase().includes(busca.toLowerCase()) ||
      maquina.tipo.toLowerCase().includes(busca.toLowerCase())
    ),
  [maquinas, busca])

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
      id: "ultimaLeituraEm",
      accessorFn: getMaquinaUltimaLeituraExibicao,
      header: "Último sinal",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.getValue("ultimaLeituraEm") ? tempoRelativo(row.getValue("ultimaLeituraEm")) : "Sem leitura"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="cursor-pointer flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon">
              <EllipsisVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
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

  return (
    <>
      <SiteHeader />
      <div className="flex flex-col gap-6 p-6">
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
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => recarregarMaquinas()} disabled={carregando || salvando}>
                <RefreshCcwIcon className="mr-1 size-4" />
                Atualizar
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-[#5E17EB]!">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Total de máquinas</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {loadingInicial ? "Sincronizando" : `${maquinas.length} cadastradas`}
              </span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867] dark:text-white">
              <MetricValue value={maquinas.length} loading={loadingInicial} />
            </span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="text-green-700 dark:text-green-300 flex items-center gap-1">
                <CircleCheckIcon className="size-3.5 fill-green-600" />
                {loadingInicial ? "Atualizando operação..." : `${totalOk} operando normalmente`}
              </span>
              <span className="text-red-600 dark:text-red-300 flex items-center gap-1">
                <AlertTriangleIcon className="size-3.5" />
                {loadingInicial ? "Lendo alertas..." : `${totalAlerta} requerem atenção`}
              </span>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-[#5E17EB]!">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Alta Importância</span>
              <span className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-medium dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                atenção
              </span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867] dark:text-white">
              <MetricValue value={criticasAlta} loading={loadingInicial} />
            </span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="text-red-600 dark:text-red-300 flex items-center gap-1">
                <ShieldAlertIcon className="size-3.5" />
                {loadingInicial ? "Verificando status..." : `${criticasAltaAlerta} em alerta agora`}
              </span>
              <span className="text-muted-foreground text-xs">
                {loadingInicial ? "Classificando importância" : `${Math.max(criticasAlta - criticasAltaAlerta, 0)} operando normalmente`}
              </span>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-[#5E17EB]! sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Integridade média</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${integridadeMedia >= 75 ? "text-green-700 bg-green-50 border border-green-200 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300" :
                  integridadeMedia >= 50 ? "text-yellow-700 bg-yellow-50 border border-yellow-200 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300" :
                    "text-red-700 bg-red-50 border border-red-200 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                }`}>
                {integridadeMedia >= 75 ? "Estável" : integridadeMedia >= 50 ? "Atenção" : "Crítico"}
              </span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867] dark:text-white">
              <MetricValue value={integridadeMedia} loading={loadingInicial} suffix="%" />
            </span>
            <div className="flex flex-col gap-1.5">
              <div className="h-2 w-50 bg-gray-200 dark:bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${integridadeMedia >= 75 ? "bg-green-500" : integridadeMedia >= 50 ? "bg-yellow-400" : "bg-red-500"
                    }`}
                  style={{ width: `${integridadeMedia}%` }}
                />
              </div>
              <span className="text-muted-foreground text-xs">Média de integridade da frota</span>
            </div>
          </div>
        </div>

        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, setor ou tipo..."
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            className="pl-8 dark:border-gray-600"
          />
        </div>

        {loadingInicial ? (
          <StatePanel message="Sincronizando máquinas da página com a API..." />
        ) : errorSemDados ? (
          <StatePanel message={mensagem || "Não foi possível carregar as máquinas."} tone="error" />
        ) : (
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
                        Nenhuma máquina encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between px-4">
              <span className="text-sm text-muted-foreground">{table.getFilteredRowModel().rows.length} resultado(s)</span>
              <div className="flex w-full items-center justify-end gap-8 lg:w-fit">
                <Button variant="outline" size="icon" className="cursor-pointer hidden size-8 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                  <ChevronsLeftIcon className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="cursor-pointer size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <span className="flex w-fit items-center justify-center text-sm font-medium">Pág. {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}</span>
                <Button variant="outline" size="icon" className="cursor-pointer size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  <ChevronRightIcon className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="cursor-pointer hidden size-8 lg:flex" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                  <ChevronsRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
          <SheetContent side="right" className="w-[420px]! max-w-none! sm:max-w-none!">
            {modoSheet === "ver" && maquinaSelecionada ? (
              <>
                <div className="px-4 pt-4">
                  <MaquinaImagePreview maquina={maquinaSelecionada} />
                </div>
                <SheetHeader>
                  <SheetTitle>Detalhes da máquina</SheetTitle>
                  <SheetDescription>{maquinaSelecionada.setor} - {maquinaSelecionada.tipo}</SheetDescription>
                </SheetHeader>
                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4">
                  <MaquinaDetailsPanel maquina={maquinaSelecionada} sensores={sensores} sensorError={sensorError} />
                  <Button 
                    className={"cursor-pointer"}
                    type="button"
                    onClick={() => router.push(`/dashboard/alertas?maquina=${encodeURIComponent(maquinaSelecionada.nome)}`)}
                  >
                    Ver alertas desta máquina
                  </Button>
                  {canManageMaquinas ? (
                    <div className="flex gap-2">
                      <Button className="cursor-pointer flex-1" onClick={() => { setSheetAberto(false); setTimeout(() => abrirEditar(maquinaSelecionada), 100) }} disabled={salvando}>
                        <PencilIcon className="mr-1 size-4" /> Editar
                      </Button>
                      <Button variant="destructive" className="cursor-pointer" onClick={() => confirmarExcluir(maquinaSelecionada)} disabled={salvando}>
                        <Trash2Icon className="mr-1 size-4" /> Excluir
                      </Button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <SheetHeader>
                  <SheetTitle>{modoSheet === "criar" ? "Nova máquina" : "Editar máquina"}</SheetTitle>
                  <SheetDescription>{modoSheet === "criar" ? "Preencha os dados para cadastrar uma nova máquina." : "Altere os dados e clique em salvar."}</SheetDescription>
                </SheetHeader>
                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="imagem-maquina">Imagem da máquina</Label>
                    <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                      {imagemPreview || maquinaSelecionada?.imagem ? (
                        <img src={imagemPreview || maquinaSelecionada?.imagem} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <ImageIcon className="size-8" />
                        </div>
                      )}
                    </div>
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
                <SheetFooter className="px-4 pb-4">
                  <Button variant="outline" className="cursor-pointer" onClick={() => setSheetAberto(false)} disabled={salvando}>Cancelar</Button>
                  <Button className="cursor-pointer" onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando..." : modoSheet === "criar" ? "Cadastrar" : "Salvar alterações"}
                  </Button>
                </SheetFooter>
              </>
            )}
          </SheetContent>
        </Sheet>

        <Dialog open={dialogExcluir} onOpenChange={alternarDialogExcluir}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                A máquina <strong>{maquinaExcluir?.nome}</strong> ficará inativa no banco de dados (active: false). Os sensores vinculados também ficarão inativos. Tem certeza que deseja excluir?
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="font-medium">
                  {sensoresVinculadosExclusao > 0
                    ? `${sensoresVinculadosExclusao} sensor(es) vinculado(s) serão inativados.`
                    : "Nenhum sensor vinculado foi informado pela API."}
                </span>
                <span>
                  {sensoresVinculadosExclusao > 0
                    ? "A exclusão será enviada para a API. O backend deve aplicar soft delete na máquina e inativar os sensores relacionados."
                    : "A exclusão será enviada para a API e a máquina deve sair das listagens ativas."}
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
