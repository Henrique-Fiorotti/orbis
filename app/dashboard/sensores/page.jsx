"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { useMaquinas } from "@/components/context/maquinas-context"
import { useSensores } from "@/components/context/sensores-context"
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SiteHeader } from "@/components/site-header"
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  CircleCheckIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  NfcIcon,
  PencilIcon,
  PlusIcon,
  RefreshCcwIcon,
  SearchIcon,
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

import { tempoRelativo } from "@/lib/utils"

const SEM_MAQUINA_VALUE = "__sem_maquina__"

const formVazio = {
  tipo: "",
  maquinaId: "",
  limiteTemperatura: "",
  idealTemperatura: "",
  limiteVibracao: "",
  idealVibracao: "",
}

function StatusBadge({ value }) {
  const isOnline = value === "ONLINE"

  return (
    <Badge
      variant="outline"
      className={`px-1.5 ${
        isOnline
          ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
      }`}
    >
      {isOnline ? <CircleCheckIcon className="fill-green-600!" /> : <WifiOffIcon className="text-red-500 dark:text-red-300" />}
      {value}
    </Badge>
  )
}

function LeituraCell({ valor, unidade, limiteMin, limiteMax }) {
  if (valor === undefined || valor === null) {
    return <span className="text-sm text-muted-foreground">--</span>
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
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
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

function isFilledNumber(value) {
  return Number.isFinite(parseFormNumber(value))
}

function parseFormNumber(value) {
  const normalized = String(value).trim().replace(",", ".")

  if (!normalized) {
    return NaN
  }

  return Number(normalized)
}

function formatValue(value, suffix) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return "--"
  }

  return `${parsed}${suffix}`
}

function getSelectedMaquinaId(value) {
  if (!value || value === SEM_MAQUINA_VALUE) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
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
  const [dialogExcluir, setDialogExcluir] = React.useState(false)
  const [sensorExcluir, setSensorExcluir] = React.useState(null)
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

  const loadingInicial = carregando && sensores.length === 0
  const errorSemDados = status === "error" && sensores.length === 0
  const canManageSensores = permissions.canManageSensores

  const totalOnline = React.useMemo(() => sensores.filter((sensor) => sensor.status === "ONLINE").length, [sensores])
  const totalOffline = React.useMemo(() => sensores.filter((sensor) => sensor.status !== "ONLINE").length, [sensores])
  const semMaquina = React.useMemo(() => sensores.filter((sensor) => !sensor.maquinaId).length, [sensores])
  const foraDoLimite = React.useMemo(() => sensores.filter((sensor) => {
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

  function abrirCriar() {
    if (!canManageSensores) {
      return
    }

    setModoSheet("criar")
    setForm(formVazio)
    setSensorSelecionado(null)
    setSheetAberto(true)
  }

  function abrirEditar(sensor) {
    if (!canManageSensores) {
      return
    }

    setModoSheet("editar")
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
    setSensorSelecionado(sensor)
    setSheetAberto(true)
  }

  function handleMaquinaChange(value) {
    const maquinaId = getSelectedMaquinaId(value)

    setForm((current) => ({
      ...current,
      maquinaId: maquinaId === null ? "" : String(maquinaId),
    }))
  }

  function setFormField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function validarFormulario() {
    if (!form.tipo.trim()) {
      toast.error("Informe o tipo do sensor.")
      return false
    }

    const requiredFields = [
      ["limiteTemperatura", "Informe o limite de temperatura."],
      ["idealTemperatura", "Informe a temperatura ideal."],
      ["limiteVibracao", "Informe o limite de vibracao."],
      ["idealVibracao", "Informe a vibracao ideal."],
    ]

    for (const [field, message] of requiredFields) {
      if (!isFilledNumber(form[field])) {
        toast.error(message)
        return false
      }
    }

    return true
  }

  function criarPayloadSensor() {
    const maquinaId = getSelectedMaquinaId(form.maquinaId)
    const vinculado = maquinaId !== null

    return {
      maquinaId,
      tipo: form.tipo.trim(),
      status: vinculado ? "ONLINE" : "OFFLINE",
      active: vinculado,
      limiteTemperatura: parseFormNumber(form.limiteTemperatura),
      idealTemperatura: parseFormNumber(form.idealTemperatura),
      limiteVibracao: parseFormNumber(form.limiteVibracao),
      idealVibracao: parseFormNumber(form.idealVibracao),
    }
  }

  async function salvar() {
    if (!validarFormulario()) {
      return
    }

    const payload = criarPayloadSensor()

    try {
      if (modoSheet === "criar") {
        await adicionarSensor(payload)
        toast.success(payload.maquinaId ? "Sensor cadastrado com sucesso!" : "Sensor cadastrado inativo, sem maquina vinculada.")
      } else {
        await editarSensor(sensorSelecionado.id, payload)
        toast.success("Sensor atualizado com sucesso!")
      }

      setSheetAberto(false)
      setForm(formVazio)
      setSensorSelecionado(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar o sensor.")
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
      toast.error(error instanceof Error ? error.message : "Nao foi possivel remover o sensor.")
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
          className="text-left text-sm font-medium transition-colors hover:text-primary hover:underline"
        >
          {row.original.tipo}
        </button>
      ),
    },
    {
      accessorKey: "maquinaNome",
      header: "Maquina",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.maquinaId ? row.original.maquinaNome : "Sem maquina vinculada"}
        </span>
      ),
    },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    {
      id: "temperatura",
      header: () => (
        <div className="flex items-center gap-1">
          <ThermometerIcon color="#5E17EB" className="size-3.5" />
          Temperatura
        </div>
      ),
      cell: ({ row }) => {
        const sensorAtivo = row.original.active && row.original.maquinaId !== null
        const temperatura = row.original.temperatura

        if (!temperatura) {
          return <span className="text-sm text-muted-foreground">--</span>
        }

        if (!sensorAtivo) {
          return <span className="text-sm text-muted-foreground">N/A - Sensor Inativo</span>
        }

        return <LeituraCell valor={temperatura.valorAtual} unidade="C" limiteMin={temperatura.limiteMin} limiteMax={temperatura.limiteMax} />
      },
    },
    {
      id: "vibracao",
      header: () => (
        <div className="flex items-center gap-1">
          <ActivityIcon color="#5E17EB" className="size-3.5" />
          Vibracao
        </div>
      ),
      cell: ({ row }) => {
        const sensorAtivo = row.original.active && row.original.maquinaId !== null
        const vibracao = row.original.vibracao

        if (!vibracao) {
          return <span className="text-sm text-muted-foreground">--</span>
        }

        if (!sensorAtivo) {
          return <span className="text-sm text-muted-foreground">N/A - Sensor Inativo</span>
        }

        return <LeituraCell valor={vibracao.valorAtual} unidade="mm/s" limiteMin={vibracao.limiteMin} limiteMax={vibracao.limiteMax} />
      },
    },
    {
      accessorKey: "ultimaLeituraEm",
      header: "Ultimo sinal",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{tempoRelativo(row.original.ultimaLeituraEm)}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon">
              <EllipsisVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => abrirVer(row.original)}>
              <EyeIcon className="mr-1 size-4" /> Ver detalhes
            </DropdownMenuItem>
            {canManageSensores ? (
              <>
                <DropdownMenuItem onClick={() => abrirEditar(row.original)}>
                  <PencilIcon className="mr-1 size-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => confirmarExcluir(row.original)}>
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
    state: { pagination },
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
            <Button variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeftIcon className="size-4" />
            </Button>
            <div className="flex items-center gap-2">
              <NfcIcon size={22} className="text-[#3B2867] dark:text-white" />
              <h1 className="text-lg font-medium text-[#3B2867] dark:text-white">Sensores</h1>
            </div>
          </div>
          {canManageSensores ? (
            <Button onClick={abrirCriar} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={salvando}>
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
              <Button variant="outline" size="sm" onClick={() => recarregarSensores()} disabled={carregando || salvando}>
                <RefreshCcwIcon className="mr-1 size-4" />
                Atualizar
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm hover:border-[#5E17EB]!">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Sensores online</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {loadingInicial ? "Sincronizando" : `${sensores.length} total`}
              </span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867] dark:text-white">{loadingInicial ? "--" : totalOnline}</span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="flex items-center gap-1 text-green-700 dark:text-green-300">
                <CircleCheckIcon className="size-3.5 fill-green-600" />
                {loadingInicial ? "Atualizando sensores..." : `${totalOnline} transmitindo normalmente`}
              </span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-300">
                <WifiOffIcon className="size-3.5" />
                {loadingInicial ? "Lendo inativos..." : `${totalOffline} offline ou inativos`}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm hover:border-[#5E17EB]!">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Leituras fora do limite</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${foraDoLimite > 0 ? "border border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300" : "border border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300"}`}>
                {loadingInicial ? "..." : foraDoLimite > 0 ? "alerta" : "normal"}
              </span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867] dark:text-white">{loadingInicial ? "--" : foraDoLimite}</span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="text-muted-foreground">
                {loadingInicial ? "Verificando limites..." : `${Math.max(sensores.length - foraDoLimite, 0)} dentro dos limites`}
              </span>
              <span className="text-xs text-muted-foreground">Temperatura ou vibracao acima do limite.</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm hover:border-[#5E17EB]! sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Sem maquina vinculada</span>
              <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                inativos
              </span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867] dark:text-white">{loadingInicial ? "--" : semMaquina}</span>
            <span className="text-sm text-muted-foreground">
              {loadingInicial ? "Conferindo vinculos..." : "Sensores sem maquina sao cadastrados como OFFLINE."}
            </span>
          </div>
        </div>

        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por tipo ou maquina..."
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            className="pl-8"
          />
        </div>

        {loadingInicial ? (
          <StatePanel message="Sincronizando sensores da pagina com a API..." />
        ) : errorSemDados ? (
          <StatePanel message={mensagem || "Nao foi possivel carregar os sensores."} tone="error" />
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
                        Nenhum sensor encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between px-4">
              <span className="text-sm text-muted-foreground">{dadosFiltrados.length} resultado(s)</span>
              <div className="flex w-full items-center justify-end gap-8 lg:w-fit">
                <Button variant="outline" size="icon" className="hidden size-8 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                  <ChevronsLeftIcon className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <span className="flex w-fit items-center justify-center text-sm font-medium">Pag. {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}</span>
                <Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  <ChevronRightIcon className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="hidden size-8 lg:flex" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                  <ChevronsRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
          <SheetContent side="right" className="w-[420px]! max-w-none! sm:max-w-none!">
            <SheetHeader>
              <SheetTitle>
                {modoSheet === "criar" ? "Novo sensor" : modoSheet === "editar" ? "Editar sensor" : "Detalhes do sensor"}
              </SheetTitle>
              <SheetDescription>
                {modoSheet === "criar"
                  ? "Cadastre os limites e ideais que serao enviados para a API."
                  : modoSheet === "editar"
                    ? "Altere as configuracoes e clique em salvar."
                    : "Leituras e configuracoes do sensor."}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
              {modoSheet === "ver" && sensorSelecionado ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Tipo</Label>
                      <span className="text-sm font-semibold">{sensorSelecionado.tipo}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Maquina vinculada</Label>
                      <span className="text-sm font-medium">{sensorSelecionado.maquinaId ? sensorSelecionado.maquinaNome : "Sem maquina vinculada"}</span>
                    </div>
                    <div className="col-span-2 flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <StatusBadge value={sensorSelecionado.status} />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-3 rounded-lg border border-orange-100 bg-orange-50/40 p-3 dark:border-orange-900/40 dark:bg-orange-950/20">
                    <div className="flex items-center gap-2">
                      <ThermometerIcon className="size-4 text-orange-500 dark:text-orange-300" />
                      <span className="text-sm font-medium">Temperatura</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Leitura</Label>
                        <span className="text-sm font-semibold">{formatValue(sensorSelecionado.temperatura?.valorAtual, " C")}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Ideal</Label>
                        <span className="text-sm">{formatValue(sensorSelecionado.idealTemperatura, " C")}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Limite</Label>
                        <span className="text-sm">{formatValue(sensorSelecionado.limiteTemperatura, " C")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50/40 p-3 dark:border-blue-900/40 dark:bg-blue-950/20">
                    <div className="flex items-center gap-2">
                      <ActivityIcon className="size-4 text-blue-500 dark:text-blue-300" />
                      <span className="text-sm font-medium">Vibracao</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Leitura</Label>
                        <span className="text-sm font-semibold">{formatValue(sensorSelecionado.vibracao?.valorAtual, " mm/s")}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Ideal</Label>
                        <span className="text-sm">{formatValue(sensorSelecionado.idealVibracao, " mm/s")}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Limite</Label>
                        <span className="text-sm">{formatValue(sensorSelecionado.limiteVibracao, " mm/s")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">Ultimo sinal</Label>
                    <span className="text-sm">{tempoRelativo(sensorSelecionado.ultimaLeituraEm)}</span>
                  </div>
                  <Separator />
                  {canManageSensores ? (
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => { setSheetAberto(false); setTimeout(() => abrirEditar(sensorSelecionado), 100) }} disabled={salvando}>
                        <PencilIcon className="mr-1 size-4" />
                        Editar
                      </Button>
                      <Button variant="destructive" onClick={() => confirmarExcluir(sensorSelecionado)} disabled={salvando}>
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
                    <Label htmlFor="maquina">Maquina vinculada</Label>
                    <Select value={form.maquinaId || SEM_MAQUINA_VALUE} onValueChange={handleMaquinaChange}>
                      <SelectTrigger id="maquina" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={SEM_MAQUINA_VALUE}>Sem maquina vinculada</SelectItem>
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
                        ? "Sensor sera vinculado a maquina selecionada."
                        : "Sem maquina vinculada: selecione uma maquina antes de salvar se quiser atribuir este sensor."}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="ideal-temperatura" className="text-xs text-muted-foreground">
                        Temperatura ideal <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="ideal-temperatura"
                        type="text"
                        inputMode="decimal"
                        placeholder="60"
                        value={form.idealTemperatura}
                        onChange={(event) => setFormField("idealTemperatura", event.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="limite-temperatura" className="text-xs text-muted-foreground">
                        Limite temperatura <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="limite-temperatura"
                        type="text"
                        inputMode="decimal"
                        placeholder="80"
                        value={form.limiteTemperatura}
                        onChange={(event) => setFormField("limiteTemperatura", event.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="ideal-vibracao" className="text-xs text-muted-foreground">
                        Vibracao ideal <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="ideal-vibracao"
                        type="text"
                        inputMode="decimal"
                        placeholder="0.4"
                        value={form.idealVibracao}
                        onChange={(event) => setFormField("idealVibracao", event.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="limite-vibracao" className="text-xs text-muted-foreground">
                        Limite vibracao <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="limite-vibracao"
                        type="text"
                        inputMode="decimal"
                        placeholder="0.8"
                        value={form.limiteVibracao}
                        onChange={(event) => setFormField("limiteVibracao", event.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            {modoSheet !== "ver" ? (
              <SheetFooter className="px-4 pb-4">
                <Button variant="outline" onClick={() => setSheetAberto(false)} disabled={salvando}>
                  Cancelar
                </Button>
                <Button onClick={salvar} disabled={salvando}>
                  {salvando ? "Salvando..." : modoSheet === "criar" ? "Cadastrar" : "Salvar alteracoes"}
                </Button>
              </SheetFooter>
            ) : null}
          </SheetContent>
        </Sheet>

        <Dialog open={dialogExcluir} onOpenChange={alternarDialogExcluir}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusao</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o sensor <strong>{sensorExcluir?.tipo}</strong>? Esta acao sera enviada para a API e nao usa mais dados locais do navegador.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => alternarDialogExcluir(false)} disabled={salvando}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={excluir} disabled={salvando}>
                {salvando ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
