"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import { SiteHeader } from "@/components/site-header"
import {
  AlertTriangleIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  ArrowLeftIcon,
  EyeIcon,
  SearchIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
  CircleCheckIcon,
  CircleXIcon,
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
  TENDENCIA_CURTA: "Tendencia Curta",
  TENDENCIA_LONGA: "Tendencia Longa",
  DEGRADACAO_ACELERADA: "Degradacao Acelerada",
  INSTABILIDADE: "Instabilidade",
}

const STATUS_ALERTA_LABEL = {
  ATIVO: "Disponivel",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDO: "Resolvido",
  CANCELADO: "Cancelado",
}

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

function AlertasTable({ data, onVer, onCancelar, onStatus, canCancelAlertas, canUpdateAlertStatus }) {
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const columns = React.useMemo(() => [
    {
      accessorKey: "maquinaNome",
      header: "Maquina",
      cell: ({ row }) => (
        <button
          onClick={() => onVer(row.original)}
          className="text-left text-sm font-medium transition-colors hover:text-primary hover:underline"
        >
          {row.original.maquinaNome}
        </button>
      ),
    },
    { accessorKey: "tipo", header: "Tipo", cell: ({ row }) => <TipoAlertaBadge value={row.original.tipo} /> },
    { accessorKey: "severidade", header: "Severidade", cell: ({ row }) => <SeveridadeBadge value={row.original.severidade} /> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusAlertaBadge value={row.original.status} /> },
    { accessorKey: "sensorNome", header: "Sensor", cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.sensorNome}</span> },
    { accessorKey: "criadoEm", header: "Criado", cell: ({ row }) => <span className="text-sm text-muted-foreground">{tempoRelativo(row.original.criadoEm)}</span> },
    {
      id: "actions",
      cell: ({ row }) => {
        const chamado = row.original
        const canIniciar = canUpdateAlertStatus && chamado.status === "ATIVO"
        const canResolver = canUpdateAlertStatus && chamado.status === "EM_ANDAMENTO"
        const canCancelar = canCancelAlertas && isStatusCancelavel(chamado.status)

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon">
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onVer(chamado)}>
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
  ], [canCancelAlertas, canUpdateAlertStatus, onVer, onCancelar, onStatus])

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
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
        <span className="text-sm text-muted-foreground">{data.length} resultado(s)</span>
        <div className="flex w-full items-center justify-end gap-8 lg:w-fit">
          <Button variant="outline" size="icon" className="hidden size-8 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
            <ChevronsLeftIcon className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="text-sm">Pag. {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}</span>
          <Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="hidden size-8 lg:flex" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
            <ChevronsRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </>
  )
}

export default function AlertasPage() {
  const router = useRouter()
  const permissions = useDashboardPermissions()
  const { alertas, adicionarAlerta, atualizarStatus, cancelarAlerta } = useAlertas()

  const [busca, setBusca] = React.useState("")
  const [sheetAberto, setSheetAberto] = React.useState(false)
  const [modoSheet, setModoSheet] = React.useState("criar")
  const [alertaSelecionado, setAlertaSelecionado] = React.useState(null)
  const [form, setForm] = React.useState(formVazio)
  const [dialogCancelar, setDialogCancelar] = React.useState(false)
  const [alertaCancelar, setAlertaCancelar] = React.useState(null)
  const canCreateAlertas = permissions.canCreateAlertas
  const canCancelAlertas = permissions.canDeleteAlertas
  const canUpdateAlertStatus = permissions.canUpdateAlertStatus

  const totalAtivos = alertas.filter((a) => a.status === "ATIVO").length
  const totalEmAndamento = alertas.filter((a) => a.status === "EM_ANDAMENTO").length
  const totalResolvidos = alertas.filter((a) => a.status === "RESOLVIDO").length
  const totalCancelados = alertas.filter((a) => a.status === "CANCELADO").length
  const altaSeveridadeAtivos = alertas.filter((a) => a.status === "ATIVO" && a.severidade === "ALTA").length
  const taxaResolucao = alertas.length ? Math.round((totalResolvidos / alertas.length) * 100) : 0

  function abrirCriar() {
    if (!canCreateAlertas) {
      return
    }

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

  function cancelar() {
    if (!alertaCancelar) {
      return
    }

    try {
      cancelarAlerta(alertaCancelar.id)
      toast.success("Chamado cancelado.")
      setDialogCancelar(false)
      setSheetAberto(false)
      setAlertaCancelar(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel cancelar o chamado.")
    }
  }

  function handleStatus(id, status) {
    try {
      atualizarStatus(id, status)
      const labels = {
        EM_ANDAMENTO: "atendimento iniciado",
        RESOLVIDO: "resolvido",
      }

      toast.success(`Chamado ${labels[status] ?? "atualizado"}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar o chamado.")
    }
  }

  function salvar() {
    if (!form.maquinaNome.trim() || !form.sensorNome.trim() || !form.mensagem.trim()) {
      toast.error("Preencha todos os campos obrigatorios.")
      return
    }

    try {
      adicionarAlerta({
        ...form,
        maquinaId: form.maquinaId ? Number(form.maquinaId) : null,
        sensorId: form.sensorId ? Number(form.sensorId) : null,
      })
      toast.success("Chamado registrado com sucesso!")
      setSheetAberto(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel registrar o chamado.")
    }
  }

  const dadosFiltrados = React.useMemo(() =>
    alertas.filter((alerta) => {
      const termo = busca.toLowerCase()

      return (
        alerta.maquinaNome.toLowerCase().includes(termo) ||
        alerta.sensorNome.toLowerCase().includes(termo) ||
        alerta.mensagem.toLowerCase().includes(termo) ||
        STATUS_ALERTA_LABEL[alerta.status]?.toLowerCase().includes(termo) ||
        TIPOS_ALERTA_LABEL[alerta.tipo]?.toLowerCase().includes(termo)
      )
    }),
  [alertas, busca])

  const ativos = dadosFiltrados.filter((a) => a.status === "ATIVO")
  const emAndamento = dadosFiltrados.filter((a) => a.status === "EM_ANDAMENTO")
  const resolvidos = dadosFiltrados.filter((a) => a.status === "RESOLVIDO")
  const cancelados = dadosFiltrados.filter((a) => a.status === "CANCELADO")

  const tableProps = {
    onVer: abrirVer,
    onCancelar: confirmarCancelar,
    onStatus: handleStatus,
    canCancelAlertas,
    canUpdateAlertStatus,
  }

  return (
    <>
      <SiteHeader />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeftIcon className="size-4 dark:text-white!" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangleIcon size={22} className="text-[#3B2867] dark:text-white!" />
                <h1 className="text-lg font-medium text-[#3B2867] dark:text-white">Chamados</h1>
              </div>
            </div>
          </div>
          {canCreateAlertas ? (
            <Button onClick={abrirCriar} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusIcon className="mr-1 size-4" />
              Novo chamado
            </Button>
          ) : null}
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm hover:border-[#5E17EB]! sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Todos os chamados</span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867] dark:text-white">{alertas.length}</span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className={`flex items-center gap-1 ${taxaResolucao >= 75 ? "text-green-700 dark:text-green-300" : taxaResolucao >= 40 ? "text-yellow-700 dark:text-yellow-300" : "text-red-700 dark:text-red-300"}`}>
                {totalResolvidos} / {alertas.length} resolvidos.
              </span>
              <div>
                <span className={`text-md font-medium ${taxaResolucao >= 75 ? "text-green-700 dark:text-green-300" : taxaResolucao >= 40 ? "text-yellow-700 dark:text-yellow-300" : "text-red-700 dark:text-red-300"}`}>
                  Taxa de resolucao
                </span>
                <span className={`ms-1 rounded-full px-2 py-0.5 text-xs font-medium ${taxaResolucao >= 75 ? "border border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300" : taxaResolucao >= 40 ? "border border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300" : "border border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"}`}>
                  {taxaResolucao >= 75 ? "Boa" : taxaResolucao >= 40 ? "Regular" : "Baixa"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm hover:border-[#5E17EB]!">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Chamados disponiveis</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${totalAtivos > 0 ? "border border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300" : "border border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300"}`}>
                {totalAtivos > 0 ? "Pendente" : "Zerado"}
              </span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867] dark:text-white">{totalAtivos}</span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="flex items-center gap-1 text-red-600 dark:text-red-300">
                <ShieldAlertIcon className="size-3.5" />
                {altaSeveridadeAtivos} de alta severidade
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <AlertTriangleIcon className="size-3.5 text-yellow-500" />
                {totalEmAndamento} em atendimento
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm hover:border-[#5E17EB]!">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Chamados resolvidos</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Total</span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867] dark:text-white">{totalResolvidos}</span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className={`flex items-center gap-1 ${totalResolvidos > 0 ? "text-green-700 dark:text-green-300" : "text-gray-400 dark:text-muted-foreground"}`}>
                <CircleCheckIcon className={`size-3.5 ${totalResolvidos > 0 ? "fill-green-600" : "fill-gray-200 dark:fill-muted"}`} />
                {totalResolvidos} encerrados
              </span>
              <span className="text-xs text-muted-foreground">{totalCancelados} cancelados pelo administrador</span>
            </div>
          </div>
        </div>

        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input placeholder="Buscar por maquina, sensor, tipo ou status..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-8" />
        </div>

        <Tabs defaultValue="ativos" className="w-full flex-col gap-4">
          <TabsList>
            <TabsTrigger value="ativos">
              Disponiveis{ativos.length > 0 && <Badge variant="secondary" className="ml-1.5 border-red-200! bg-red-100! text-red-700! dark:border-red-900/60! dark:bg-red-950/30! dark:text-red-300!">{ativos.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="em-andamento">
              Em andamento{emAndamento.length > 0 && <Badge variant="secondary" className="ml-1.5 border-yellow-200! bg-yellow-100! text-yellow-700! dark:border-yellow-900/60! dark:bg-yellow-950/30! dark:text-yellow-300!">{emAndamento.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="resolvidos">
              Resolvidos{resolvidos.length > 0 && <Badge variant="secondary" className="ml-1.5">{resolvidos.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="cancelados">
              Cancelados{cancelados.length > 0 && <Badge variant="secondary" className="ml-1.5">{cancelados.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="todos">Todos ({dadosFiltrados.length})</TabsTrigger>
          </TabsList>
          {[
            { value: "ativos", data: ativos },
            { value: "em-andamento", data: emAndamento },
            { value: "resolvidos", data: resolvidos },
            { value: "cancelados", data: cancelados },
            { value: "todos", data: dadosFiltrados },
          ].map(({ value, data }) => (
            <TabsContent key={value} value={value} className="flex flex-col gap-4">
              <AlertasTable data={data} {...tableProps} />
            </TabsContent>
          ))}
        </Tabs>

        <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
          <SheetContent side="right" className="w-[420px]! max-w-none! sm:max-w-none!">
            <SheetHeader>
              <SheetTitle>{modoSheet === "criar" ? "Registrar chamado manual" : "Detalhes do chamado"}</SheetTitle>
              <SheetDescription>{modoSheet === "criar" ? "Registre um chamado manualmente para acompanhamento." : "Informacoes completas do chamado."}</SheetDescription>
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
                      <Label className="text-xs text-muted-foreground">Maquina</Label>
                      <span className="text-sm font-medium">{alertaSelecionado.maquinaNome}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Sensor</Label>
                      <span className="text-sm font-medium">{alertaSelecionado.sensorNome}</span>
                    </div>
                  </div>
                  {alertaSelecionado.tecnicoNome ? (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Tecnico responsavel</Label>
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
                  <Separator />
                  <div className="flex flex-col gap-2">
                    {canUpdateAlertStatus && alertaSelecionado.status === "ATIVO" ? (
                      <Button className="w-full" onClick={() => { handleStatus(alertaSelecionado.id, "EM_ANDAMENTO"); setSheetAberto(false) }}>
                        <AlertTriangleIcon className="mr-1 size-4" /> Iniciar atendimento
                      </Button>
                    ) : null}
                    {canUpdateAlertStatus && alertaSelecionado.status === "EM_ANDAMENTO" ? (
                      <Button className="w-full" onClick={() => { handleStatus(alertaSelecionado.id, "RESOLVIDO"); setSheetAberto(false) }}>
                        <CircleCheckIcon className="mr-1 size-4" /> Resolver chamado
                      </Button>
                    ) : null}
                    {canCancelAlertas && isStatusCancelavel(alertaSelecionado.status) ? (
                      <Button variant="destructive" className="w-full" onClick={() => confirmarCancelar(alertaSelecionado)}>
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
                          <SelectItem value="MEDIA">Media</SelectItem>
                          <SelectItem value="ALTA">Alta</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="maquinaNome">Nome da maquina <span className="text-red-500">*</span></Label>
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
                <Button variant="outline" onClick={() => setSheetAberto(false)}>Cancelar</Button>
                <Button onClick={salvar}>Registrar chamado</Button>
              </SheetFooter>
            ) : null}
          </SheetContent>
        </Sheet>

        <Dialog open={dialogCancelar} onOpenChange={setDialogCancelar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar cancelamento</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja cancelar o chamado de <strong>{alertaCancelar?.maquinaNome}</strong>? O registro sera mantido como cancelado.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogCancelar(false)}>Voltar</Button>
              <Button variant="destructive" onClick={cancelar}>Cancelar chamado</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
