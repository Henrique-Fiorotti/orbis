"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { useAlertas } from "@/components/context/alertas-context"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetricValue, useDashboardMetricsLoading } from "@/components/animated-metric"
import { SiteHeader } from "@/components/site-header"
import { TableColumnHeaderMenu } from "@/components/table-column-header-menu"
import {
  AlertTriangleIcon,
  EllipsisVerticalIcon,
  ArrowLeftIcon,
  EyeIcon,
  SearchIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
  CircleCheckIcon,
  CircleXIcon,
  RefreshCcwIcon,
  ShieldAlertIcon,
} from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { tempoRelativo } from "@/lib/utils"

const TIPOS_ALERTA = ["LIMITE_ULTRAPASSADO", "TENDENCIA_CURTA", "TENDENCIA_LONGA", "DEGRADACAO_ACELERADA", "INSTABILIDADE"]
const TIPOS_ALERTA_LABEL = {
  LIMITE_ULTRAPASSADO: "Limite Ultrapassado",
  TENDENCIA_CURTA: "Tendência Curta",
  TENDENCIA_LONGA: "Tendência Longa",
  DEGRADACAO_ACELERADA: "Degradação Acelerada",
  INSTABILIDADE: "Instabilidade",
}

const STATUS_ALERTA_LABEL = {
  ATIVO: "Disponível",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDO: "Resolvido",
  CANCELADO: "Cancelado",
}

const ALERTA_TIPO_FILTER_OPTIONS = TIPOS_ALERTA.map((value) => ({
  value,
  label: TIPOS_ALERTA_LABEL[value] ?? value,
}))

const ALERTA_STATUS_FILTER_OPTIONS = Object.entries(STATUS_ALERTA_LABEL).map(([value, label]) => ({
  value,
  label,
}))

const ALERTA_STATUS_SORT_OPTIONS = [
  { value: "desc", label: "Abertos primeiro", desc: true },
  { value: "asc", label: "Resolvidos primeiro", desc: false },
]

const ALERTA_RECENCIA_FILTER_OPTIONS = [
  { value: "RECENTE", label: "Recente" },
  { value: "ANTIGO", label: "Antigo" },
]

const ALERTA_RECENCIA_SORT_OPTIONS = [
  { value: "desc", label: "Mais recentes", desc: true },
  { value: "asc", label: "Mais antigos", desc: false },
]

const ALERTA_OCORRENCIAS_FILTER_OPTIONS = [
  { value: "UNICO", label: "Única ocorrência" },
  { value: "REPETIDO", label: "Repetidos" },
]

const ALERTA_OCORRENCIAS_SORT_OPTIONS = [
  { value: "desc", label: "Maior primeiro", desc: true },
  { value: "asc", label: "Menor primeiro", desc: false },
]

const ALERTA_STATUS_ORDER = { CANCELADO: 0, RESOLVIDO: 1, EM_ANDAMENTO: 2, ATIVO: 3 }

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

function isStatusCancelavel(status) {
  return status === "ATIVO" || status === "EM_ANDAMENTO"
}

function isStatusAberto(status) {
  return status === "ATIVO" || status === "EM_ANDAMENTO"
}

function getUltimaOcorrencia(alerta) {
  return alerta.ultimaOcorrenciaEm || alerta.atualizadoEm || alerta.criadoEm
}

function getAlertaTimestamp(alerta) {
  const timestamp = Date.parse(getUltimaOcorrencia(alerta))
  return Number.isFinite(timestamp) ? timestamp : 0
}

function compareAlertaRecente(a, b) {
  return getAlertaTimestamp(b) - getAlertaTimestamp(a)
}

function getAlertaRecenciaFiltro(alerta) {
  return alerta?.recencia === "RECENTE" ? "RECENTE" : "ANTIGO"
}

function getAlertaOcorrenciasFiltro(alerta) {
  return alerta?.duplicado || Number(alerta?.ocorrencias) > 1 ? "REPETIDO" : "UNICO"
}

function selectAlertaFilterFn(row, columnId, value) {
  if (!value) {
    return true
  }

  return row.getValue(columnId) === value
}

function alertaStatusSortFn(rowA, rowB, columnId) {
  const valueA = ALERTA_STATUS_ORDER[rowA.getValue(columnId)] ?? 0
  const valueB = ALERTA_STATUS_ORDER[rowB.getValue(columnId)] ?? 0

  return valueA - valueB
}

function alertaUltimaOcorrenciaSortFn(rowA, rowB) {
  return getAlertaTimestamp(rowA.original) - getAlertaTimestamp(rowB.original)
}

function alertaOcorrenciasSortFn(rowA, rowB, columnId) {
  return Number(rowA.getValue(columnId) ?? 0) - Number(rowB.getValue(columnId) ?? 0)
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

function AlertasTable({ data, onVer, onCancelar, onStatus, canCancelAlertas, canStartAlertStatus, canResolveAlertStatus }) {
  const [sorting, setSorting] = React.useState([])
  const [columnFilters, setColumnFilters] = React.useState([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const columns = React.useMemo(() => [
    {
      accessorKey: "maquinaNome",
      header: "Máquina",
      cell: ({ row }) => (
        <button
          onClick={() => onVer(row.original)}
          className="text-left text-sm font-medium transition-colors hover:text-primary hover:underline"
        >
          {row.original.maquinaNome}
        </button>
      ),
    },
    {
      accessorKey: "tipo",
      header: ({ column }) => (
        <TableColumnHeaderMenu
          column={column}
          label="Tipo"
          filterOptions={ALERTA_TIPO_FILTER_OPTIONS}
        />
      ),
      cell: ({ row }) => <TipoAlertaBadge value={row.original.tipo} />,
      filterFn: selectAlertaFilterFn,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <TableColumnHeaderMenu
          column={column}
          label="Status"
          filterOptions={ALERTA_STATUS_FILTER_OPTIONS}
          sortOptions={ALERTA_STATUS_SORT_OPTIONS}
        />
      ),
      cell: ({ row }) => <StatusAlertaBadge value={row.original.status} />,
      filterFn: selectAlertaFilterFn,
      sortingFn: alertaStatusSortFn,
    },
    { accessorKey: "sensorNome", header: "Sensor", cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.sensorNome}</span> },
    {
      id: "recencia",
      accessorFn: getAlertaRecenciaFiltro,
      header: ({ column }) => (
        <TableColumnHeaderMenu
          column={column}
          label="Última ocorrência"
          filterOptions={ALERTA_RECENCIA_FILTER_OPTIONS}
          sortOptions={ALERTA_RECENCIA_SORT_OPTIONS}
        />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-[120px] flex-col gap-1">
          <span className="text-sm text-muted-foreground">{tempoRelativo(getUltimaOcorrencia(row.original))}</span>
          <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ${row.original.recencia === "RECENTE" ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300" : "bg-muted text-muted-foreground"}`}>
            {row.original.recencia === "RECENTE" ? "Recente" : "Antigo"}
          </span>
        </div>
      ),
      filterFn: selectAlertaFilterFn,
      sortingFn: alertaUltimaOcorrenciaSortFn,
    },
    {
      accessorKey: "ocorrencias",
      header: ({ column }) => (
        <TableColumnHeaderMenu
          column={column}
          label="Ocorrências"
          filterOptions={ALERTA_OCORRENCIAS_FILTER_OPTIONS}
          sortOptions={ALERTA_OCORRENCIAS_SORT_OPTIONS}
        />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className={`px-1.5 ${row.original.duplicado ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300" : "text-muted-foreground"}`}>
          {Math.max(Number(row.original.ocorrencias) || 1, 1)}
        </Badge>
      ),
      filterFn: (row, columnId, value) => {
        if (!value) {
          return true
        }

        return getAlertaOcorrenciasFiltro(row.original) === value
      },
      sortingFn: alertaOcorrenciasSortFn,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const chamado = row.original
        const canIniciar = canStartAlertStatus && chamado.status === "ATIVO"
        const canResolver = canResolveAlertStatus && chamado.status === "EM_ANDAMENTO"
        const canCancelar = canCancelAlertas && isStatusCancelavel(chamado.status)

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="cursor-pointer flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon">
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer" onClick={() => onVer(chamado)}>
                <EyeIcon className="mr-1 size-4" /> Ver detalhes
              </DropdownMenuItem>
              {canIniciar || canResolver || canCancelar ? <DropdownMenuSeparator /> : null}
              {canIniciar ? (
                <DropdownMenuItem onClick={() => onStatus(chamado.id, "EM_ANDAMENTO")}>
                  <AlertTriangleIcon className="mr-1 size-4 text-yellow-600 dark:text-yellow-300" /> Iniciar atendimento
                </DropdownMenuItem>
              ) : null}
              {canResolver ? (
                <DropdownMenuItem onClick={() => onStatus(chamado.id, "RESOLVIDO")}>
                  <CircleCheckIcon className="mr-1 size-4 text-green-600 dark:text-green-300" /> Resolver chamado
                </DropdownMenuItem>
              ) : null}
              {canCancelar ? (
                <DropdownMenuItem variant="destructive" onClick={() => onCancelar(chamado)}>
                  <CircleXIcon className="mr-1 size-4" /> Cancelar chamado
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [canCancelAlertas, canResolveAlertStatus, canStartAlertStatus, onVer, onCancelar, onStatus])

  const table = useReactTable({
    data,
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
                  Nenhum chamado encontrado.
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
  const permissions = useDashboardPermissions()
  const {
    alertas,
    status,
    mensagem,
    carregando = false,
    salvando,
    adicionarAlerta,
    atualizarStatus,
    cancelarAlerta,
    recarregarAlertas,
  } = useAlertas()

  const [busca, setBusca] = React.useState("")
  const [sheetAberto, setSheetAberto] = React.useState(false)
  const [modoSheet, setModoSheet] = React.useState("criar")
  const [alertaSelecionado, setAlertaSelecionado] = React.useState(null)
  const [form, setForm] = React.useState(formVazio)
  const [dialogCancelar, setDialogCancelar] = React.useState(false)
  const [alertaCancelar, setAlertaCancelar] = React.useState(null)
  const canCancelAlertas = false
  const canStartAlertStatus = permissions.isTecnico
  const canResolveAlertStatus = permissions.isTecnico
  const loadingInicial = useDashboardMetricsLoading(carregando && alertas.length === 0)
  const errorSemDados = status === "error" && alertas.length === 0

  const alertasOrdenados = React.useMemo(() => [...alertas].sort(compareAlertaRecente), [alertas])
  const alertasAbertos = React.useMemo(() => alertasOrdenados.filter((alerta) => isStatusAberto(alerta.status)), [alertasOrdenados])
  const alertasRecentes = React.useMemo(() => alertasAbertos.filter((alerta) => alerta.recencia === "RECENTE"), [alertasAbertos])
  const alertasAntigos = React.useMemo(() => alertasAbertos.filter((alerta) => alerta.recencia !== "RECENTE"), [alertasAbertos])
  const alertasRepetidos = React.useMemo(
    () => alertasAbertos.filter((alerta) => alerta.duplicado || Number(alerta.ocorrencias) > 1),
    [alertasAbertos]
  )
  const alertaAbertoMaisAntigo = React.useMemo(
    () => alertasAbertos.reduce((oldest, alerta) => (!oldest || getAlertaTimestamp(alerta) < getAlertaTimestamp(oldest) ? alerta : oldest), null),
    [alertasAbertos]
  )
  const altaSeveridadeRecentes = alertasRecentes.filter((a) => a.severidade === "ALTA").length
  const totalOcorrenciasAgrupadas = alertasRepetidos.reduce((total, alerta) => total + Math.max(Number(alerta.ocorrencias) || 1, 1), 0)

  React.useEffect(() => {
    const maquinaParam = searchParams.get("maquina")

    if (maquinaParam) {
      setBusca(maquinaParam)
    }
  }, [searchParams])

  React.useEffect(() => {
    const alertaIdParam = searchParams.get("alertaId")

    if (!alertaIdParam || alertas.length === 0) {
      return
    }

    const alerta = alertas.find((item) => String(item.id) === String(alertaIdParam))

    if (alerta) {
      abrirVer(alerta)
    }
  }, [alertas, searchParams])

  function abrirCriar() {
    setModoSheet("criar")
    setForm(formVazio)
    setAlertaSelecionado(null)
    setSheetAberto(true)
  }

  function abrirVer(alerta) {
    setModoSheet("ver")
    setAlertaSelecionado(alerta)
    setSheetAberto(true)
  }

  function confirmarCancelar(alerta) {
    if (!canCancelAlertas || !isStatusCancelavel(alerta.status)) {
      return
    }

    setAlertaCancelar(alerta)
    setDialogCancelar(true)
  }

  async function cancelar() {
    if (!alertaCancelar) {
      return
    }

    try {
      await cancelarAlerta(alertaCancelar.id)
      toast.success("Chamado cancelado.")
      setDialogCancelar(false)
      setSheetAberto(false)
      setAlertaCancelar(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cancelar o chamado.")
    }
  }

  async function handleStatus(id, status) {
    try {
      await atualizarStatus(id, status)
      const labels = {
        EM_ANDAMENTO: "atendimento iniciado",
        RESOLVIDO: "resolvido",
      }

      toast.success(`Chamado ${labels[status] ?? "atualizado"}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o chamado.")
    }
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
      toast.success("Chamado registrado com sucesso!")
      setSheetAberto(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar o chamado.")
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

  const recentes = dadosFiltrados.filter((a) => isStatusAberto(a.status) && a.recencia === "RECENTE")
  const antigos = dadosFiltrados.filter((a) => isStatusAberto(a.status) && a.recencia !== "RECENTE")
  const repetidos = dadosFiltrados.filter((a) => isStatusAberto(a.status) && (a.duplicado || Number(a.ocorrencias) > 1))
  const resolvidos = dadosFiltrados.filter((a) => a.status === "RESOLVIDO")

  const tableProps = {
    onVer: abrirVer,
    onCancelar: confirmarCancelar,
    onStatus: handleStatus,
    canCancelAlertas,
    canStartAlertStatus,
    canResolveAlertStatus,
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
                <h1 className="text-lg font-medium text-[#3B2867] dark:text-white">Chamados</h1>
              </div>
            </div>
          </div>
          <Button variant="outline" className={"cursor-pointer"} onClick={() => recarregarAlertas()} disabled={carregando || salvando}>
            <RefreshCcwIcon className="mr-1 size-4" />
            Atualizar
          </Button>
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
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => recarregarAlertas()} disabled={carregando || salvando}>
                <RefreshCcwIcon className="mr-1 size-4" />
                Atualizar
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm hover:border-[#5E17EB]! sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Recentes</span>
              <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">30 min</span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867] dark:text-white">
              <MetricValue value={alertasRecentes.length} loading={loadingInicial} />
            </span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="flex items-center gap-1 text-red-600 dark:text-red-300">
                <ShieldAlertIcon className="size-3.5" />
                {altaSeveridadeRecentes} de alta severidade
              </span>
              <span className="text-xs text-muted-foreground">Alertas abertos atualizados nos últimos 30 minutos.</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm hover:border-[#5E17EB]!">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Aguardando há mais tempo</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${alertasAntigos.length > 0 ? "border border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300" : "border border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300"}`}>
                {alertasAntigos.length > 0 ? "Priorizar" : "Zerado"}
              </span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867] dark:text-white">
              <MetricValue value={alertasAntigos.length} loading={loadingInicial} />
            </span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="flex items-center gap-1 text-yellow-700 dark:text-yellow-300">
                <AlertTriangleIcon className="size-3.5" />
                {alertaAbertoMaisAntigo ? `Mais antigo: ${tempoRelativo(getUltimaOcorrencia(alertaAbertoMaisAntigo))}` : "Nenhum alerta antigo"}
              </span>
              <span className="text-xs text-muted-foreground">Alertas abertos sem atualização recente.</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm hover:border-[#5E17EB]!">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Ocorrências agrupadas</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Duplicados</span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867] dark:text-white">
              <MetricValue value={alertasRepetidos.length} loading={loadingInicial} />
            </span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="flex items-center gap-1 text-orange-700 dark:text-orange-300">
                <AlertTriangleIcon className="size-3.5" />
                {totalOcorrenciasAgrupadas} ocorrências no total
              </span>
              <span className="text-xs text-muted-foreground">Mesmo sensor e tipo permanecem em um único chamado aberto.</span>
            </div>
          </div>
        </div>

        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input placeholder="Buscar por máquina, sensor, tipo ou status..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-8 dark:border-gray-600" />
        </div>

        {loadingInicial ? (
          <StatePanel message="Sincronizando chamados gerados pelos sensores..." />
        ) : errorSemDados ? (
          <StatePanel message={mensagem || "Não foi possível carregar os chamados."} tone="error" />
        ) : (
          <Tabs defaultValue="recentes" className="min-w-0 w-full flex-col gap-4">
            <TabsList className="w-full max-w-full justify-start overflow-x-auto overflow-y-hidden px-0 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabsTrigger value="recentes" className="shrink-0 flex-none">
                Recentes{recentes.length > 0 && <Badge variant="secondary" className="ml-1.5 border-red-200! bg-red-100! text-red-700! dark:border-red-900/60! dark:bg-red-950/30! dark:text-red-300!">{recentes.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="antigos" className="shrink-0 flex-none">
                Antigos{antigos.length > 0 && <Badge variant="secondary" className="ml-1.5 border-yellow-200! bg-yellow-100! text-yellow-700! dark:border-yellow-900/60! dark:bg-yellow-950/30! dark:text-yellow-300!">{antigos.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="repetidos" className="shrink-0 flex-none">
                Repetidos{repetidos.length > 0 && <Badge variant="secondary" className="ml-1.5 border-orange-200! bg-orange-100! text-orange-700! dark:border-orange-900/60! dark:bg-orange-950/30! dark:text-orange-300!">{repetidos.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="resolvidos" className="shrink-0 flex-none">
                Resolvidos{resolvidos.length > 0 && <Badge variant="secondary" className="ml-1.5">{resolvidos.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="todos" className="shrink-0 flex-none">Todos ({dadosFiltrados.length})</TabsTrigger>
            </TabsList>
            {[
              { value: "recentes", data: recentes },
              { value: "antigos", data: antigos },
              { value: "repetidos", data: repetidos },
              { value: "resolvidos", data: resolvidos },
              { value: "todos", data: dadosFiltrados },
            ].map(({ value, data }) => (
              <TabsContent key={value} value={value} className="flex flex-col gap-4">
                <AlertasTable data={data} {...tableProps} />
              </TabsContent>
            ))}
          </Tabs>
        )}

        <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
          <SheetContent side="right" className="w-[420px]! max-w-none! sm:max-w-none!">
            <SheetHeader>
              <SheetTitle>{modoSheet === "criar" ? "Registrar chamado manual" : "Detalhes do chamado"}</SheetTitle>
              <SheetDescription>{modoSheet === "criar" ? "Registre um chamado manualmente para acompanhamento." : "Informações completas do chamado."}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
              {modoSheet === "ver" && alertaSelecionado ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Tipo</Label>
                      <TipoAlertaBadge value={alertaSelecionado.tipo} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Severidade</Label>
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
                  <div className="flex flex-col gap-2">
                    {canStartAlertStatus && alertaSelecionado.status === "ATIVO" ? (
                      <Button className="cursor-pointer w-full" onClick={() => { handleStatus(alertaSelecionado.id, "EM_ANDAMENTO"); setSheetAberto(false) }}>
                        <AlertTriangleIcon className="mr-1 size-4" /> Iniciar atendimento
                      </Button>
                    ) : null}
                    {canResolveAlertStatus && alertaSelecionado.status === "EM_ANDAMENTO" ? (
                      <Button className="cursor-pointer w-full" onClick={() => { handleStatus(alertaSelecionado.id, "RESOLVIDO"); setSheetAberto(false) }}>
                        <CircleCheckIcon className="mr-1 size-4" /> Resolver chamado
                      </Button>
                    ) : null}
                    {canCancelAlertas && isStatusCancelavel(alertaSelecionado.status) ? (
                      <Button variant="destructive" className="cursor-pointer w-full" onClick={() => confirmarCancelar(alertaSelecionado)}>
                        <CircleXIcon className="mr-1 size-4" /> Cancelar chamado
                      </Button>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tipo">Tipo de chamado</Label>
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
                <Button className="cursor-pointer" onClick={salvar}>Registrar chamado</Button>
              </SheetFooter>
            ) : null}
          </SheetContent>
        </Sheet>

        <Dialog open={dialogCancelar} onOpenChange={setDialogCancelar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar cancelamento</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja cancelar o chamado de <strong>{alertaCancelar?.maquinaNome}</strong>? O registro será mantido como cancelado.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" className="cursor-pointer" onClick={() => setDialogCancelar(false)}>Voltar</Button>
              <Button variant="destructive" className="cursor-pointer" onClick={cancelar}>Cancelar chamado</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
