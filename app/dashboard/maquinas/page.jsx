"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { useMaquinas } from "@/components/context/maquinas-context"

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
import { SiteHeader } from "@/components/site-header"
import {
  CircleCheckIcon, AlertTriangleIcon, EllipsisVerticalIcon, PlusIcon,
  ArrowLeftIcon, PencilIcon, Trash2Icon, EyeIcon, SearchIcon,
  ChevronsLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon,
  WashingMachineIcon, ShieldAlertIcon, RefreshCcwIcon,
} from "lucide-react"
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { tempoRelativo } from "@/lib/utils"

const formVazio = { nome: "", setor: "", tipo: "", criticidade: "MEDIA" }

function CriticidadeBadge({ value }) {
  const styles = { ALTA: "bg-white text-gray-700  border-gray-200", MEDIA: "bg-white text-gray-700 border-gray-200", BAIXA: "bg-white text-gray-700 border-gray-200" }
  return <Badge variant="outline" className={`px-1.5 ${styles[value]}`}>{value.charAt(0) + value.slice(1).toLowerCase()}</Badge>
}

function StatusBadge({ value }) {
  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      {value === "OK" ? <CircleCheckIcon className="fill-[#5E17EB]!" /> : <AlertTriangleIcon className="text-red-500" />}
      {value}
    </Badge>
  )
}

function IntegridadeBar({ value }) {
  const cor = value < 50 ? "bg-red-500" : value < 75 ? "bg-yellow-400" : "bg-green-500"
  const textCor = value < 50 ? "text-red-500" : value < 75 ? "text-yellow-500" : "text-green-600"

  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <span className={`text-sm font-medium w-9 text-start  tabular-nums ${textCor}`}>{value}%</span>
      <div className="flex-1 h-1.5 w-4 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${value}%` }} />
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
  const {
    maquinas,
    status,
    mensagem,
    carregando,
    salvando,
    adicionarMaquina,
    editarMaquina,
    excluirMaquina,
    recarregarMaquinas,
  } = useMaquinas()

  const [busca, setBusca] = React.useState("")
  const [sheetAberto, setSheetAberto] = React.useState(false)
  const [modoSheet, setModoSheet] = React.useState("criar")
  const [maquinaSelecionada, setMaquinaSelecionada] = React.useState(null)
  const [form, setForm] = React.useState(formVazio)
  const [dialogExcluir, setDialogExcluir] = React.useState(false)
  const [maquinaExcluir, setMaquinaExcluir] = React.useState(null)
  const [confirmacaoExclusao, setConfirmacaoExclusao] = React.useState("")
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

  const loadingInicial = carregando && maquinas.length === 0
  const errorSemDados = status === "error" && maquinas.length === 0

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
    if (searchParams.get("action") === "new") {
      abrirCriar()
    }
  }, [searchParams])

  function abrirCriar() {
    setModoSheet("criar")
    setForm(formVazio)
    setMaquinaSelecionada(null)
    setSheetAberto(true)
  }

  function abrirEditar(maquina) {
    setModoSheet("editar")
    setForm({
      nome: maquina.nome,
      setor: maquina.setor,
      tipo: maquina.tipo,
      criticidade: maquina.criticidade,
    })
    setMaquinaSelecionada(maquina)
    setSheetAberto(true)
  }

  function abrirVer(maquina) {
    setModoSheet("ver")
    setMaquinaSelecionada(maquina)
    setSheetAberto(true)
  }

  async function salvar() {
    if (!form.nome.trim() || !form.setor.trim() || !form.tipo.trim()) {
      toast.error("Preencha todos os campos obrigatorios.")
      return
    }

    try {
      if (modoSheet === "criar") {
        await adicionarMaquina(form)
        toast.success("Maquina cadastrada com sucesso!")
      } else {
        await editarMaquina(maquinaSelecionada.id, form)
        toast.success("Maquina atualizada com sucesso!")
      }

      setSheetAberto(false)
      setForm(formVazio)
      setMaquinaSelecionada(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar a maquina.")
    }
  }

  function confirmarExcluir(maquina) {
    setMaquinaExcluir(maquina)
    setConfirmacaoExclusao("")
    setDialogExcluir(true)
  }

  async function excluir() {
    if (!maquinaExcluir) {
      return
    }

    try {
      await excluirMaquina(maquinaExcluir.id)
      toast.success("Maquina removida.")
      setDialogExcluir(false)
      setSheetAberto(false)
      setMaquinaExcluir(null)
      setConfirmacaoExclusao("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel remover a maquina.")
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
      header: "Maquina",
      cell: ({ row }) => (
        <button
          onClick={() => abrirVer(row.original)}
          className="text-left text-sm font-medium transition-colors hover:text-primary hover:underline"
        >
          {row.original.nome}
        </button>
      ),
    },
    { accessorKey: "setor", header: "Setor", cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.setor}</span> },
    { accessorKey: "criticidade", header: "Importância", cell: ({ row }) => <CriticidadeBadge value={row.original.criticidade} /> }, //troquei o header pra importancia ass:Gui
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    { accessorKey: "integridade", header: "Integridade", cell: ({ row }) => <IntegridadeBar value={row.original.integridade} /> },
    { accessorKey: "ultimaLeituraEm", header: "Ultimo sinal", cell: ({ row }) => <span className="text-muted-foreground text-sm">{tempoRelativo(row.original.ultimaLeituraEm)}</span> },
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
            <DropdownMenuItem onClick={() => abrirEditar(row.original)}>
              <PencilIcon className="mr-1 size-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => confirmarExcluir(row.original)}>
              <Trash2Icon className="mr-1 size-4" /> Excluir
            </DropdownMenuItem>
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
            <Tooltip>
              <TooltipContent><p className="mb-0!">Voltar ao dashboard</p></TooltipContent>
              <TooltipTrigger>
                <Button variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}>
                  <ArrowLeftIcon className="size-4" />
                </Button>
              </TooltipTrigger>
            </Tooltip>
            <div>
              <div className="flex items-center gap-2">
                <WashingMachineIcon size={22} />
                <h1 className="text-[18pt]! mb-0! font-medium text-[#3B2867]">Maquinas</h1>
              </div>

            </div>
          </div>
          <Button onClick={abrirCriar} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={salvando}>
            <PlusIcon className="mr-1 size-4" />
            Nova maquina
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
              <Button variant="outline" size="sm" onClick={() => recarregarMaquinas()} disabled={carregando || salvando}>
                <RefreshCcwIcon className="mr-1 size-4" />
                Atualizar
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-[#5E17EB]!">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Total de maquinas</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {loadingInicial ? "Sincronizando" : `${maquinas.length} cadastradas`}
              </span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867]">{formatMetric(maquinas.length, loadingInicial)}</span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="text-green-700 flex items-center gap-1">
                <CircleCheckIcon className="size-3.5 fill-green-600" />
                {loadingInicial ? "Atualizando operacao..." : `${totalOk} operando normalmente`}
              </span>
              <span className="text-red-600 flex items-center gap-1">
                <AlertTriangleIcon className="size-3.5" />
                {loadingInicial ? "Lendo alertas..." : `${totalAlerta} requerem atencao`}
              </span>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-[#5E17EB]!">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Alta Importância</span>
              <span className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                atencao
              </span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867]">{formatMetric(criticasAlta, loadingInicial)}</span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="text-red-600 flex items-center gap-1">
                <ShieldAlertIcon className="size-3.5" />
                {loadingInicial ? "Verificando status..." : `${criticasAltaAlerta} em alerta agora`}
              </span>
              <span className="text-muted-foreground text-xs">
                {loadingInicial ? "Classificando criticidade" : `${Math.max(criticasAlta - criticasAltaAlerta, 0)} operando normalmente`}
              </span>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-[#5E17EB]! sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Integridade média</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${integridadeMedia >= 75 ? "text-green-700 bg-green-50 border border-green-200" :
                  integridadeMedia >= 50 ? "text-yellow-700 bg-yellow-50 border border-yellow-200" :
                    "text-red-700 bg-red-50 border border-red-200"
                }`}>
                {integridadeMedia >= 75 ? "Estável" : integridadeMedia >= 50 ? "Atenção" : "Crítico"}
              </span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867]">{formatMetric(integridadeMedia, loadingInicial, "%")}</span>
            <div className="flex flex-col gap-1.5">
              <div className="h-2 w-50 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${integridadeMedia >= 75 ? "bg-green-500" : integridadeMedia >= 50 ? "bg-yellow-400" : "bg-red-500"
                    }`}
                  style={{ width: `${integridadeMedia}%` }}
                />
              </div>
              <span className="text-muted-foreground text-xs">Media de integridade da frota</span>
            </div>
          </div>
        </div>

        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, setor ou tipo..."
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            className="pl-8"
          />
        </div>

        {loadingInicial ? (
          <StatePanel message="Sincronizando maquinas da pagina com a API..." />
        ) : errorSemDados ? (
          <StatePanel message={mensagem || "Nao foi possivel carregar as maquinas."} tone="error" />
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted">
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
                        Nenhuma maquina encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{dadosFiltrados.length} resultado(s)</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="size-8" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                  <ChevronsLeftIcon className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <span className="text-sm">Pag. {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}</span>
                <Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  <ChevronRightIcon className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="size-8" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
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
                {modoSheet === "criar" ? "Nova maquina" : modoSheet === "editar" ? "Editar maquina" : "Detalhes da maquina"}
              </SheetTitle>
              <SheetDescription>
                {modoSheet === "criar"
                  ? "Preencha os dados para cadastrar uma nova maquina."
                  : modoSheet === "editar"
                    ? "Altere os dados e clique em salvar."
                    : "Informacoes completas da maquina."}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
              {modoSheet === "ver" && maquinaSelecionada ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      ["Nome", maquinaSelecionada.nome],
                      ["Setor", maquinaSelecionada.setor],
                      ["Tipo", maquinaSelecionada.tipo],
                      ["Sensores", maquinaSelecionada.sensores],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <Label className="text-muted-foreground text-xs">{label}</Label>
                        <span className="text-sm font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <Label className="text-muted-foreground text-xs">Criticidade</Label>
                      <CriticidadeBadge value={maquinaSelecionada.criticidade} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-muted-foreground text-xs">Status</Label>
                      <StatusBadge value={maquinaSelecionada.status} />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2"><Label className="text-muted-foreground text-xs">Integridade</Label><IntegridadeBar value={maquinaSelecionada.integridade} /></div>
                  <div className="flex flex-col gap-2"><Label className="text-muted-foreground text-xs">Score de estabilidade</Label><IntegridadeBar value={maquinaSelecionada.scoreEstabilidade} /></div>
                  <div className="flex flex-col gap-1"><Label className="text-muted-foreground text-xs  text-right!">Último sinal</Label><span className="text-sm ">{tempoRelativo(maquinaSelecionada.ultimaLeituraEm)}</span></div>
                  <Separator />
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => { setSheetAberto(false); setTimeout(() => abrirEditar(maquinaSelecionada), 100) }} disabled={salvando}>
                      <PencilIcon className="mr-1 size-4" /> Editar
                    </Button>
                    <Button variant="destructive" onClick={() => confirmarExcluir(maquinaSelecionada)} disabled={salvando}>
                      <Trash2Icon className="mr-1 size-4" /> Excluir
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="nome">Nome <span className="text-red-500">*</span></Label>
                    <Input id="nome" placeholder="Ex: Motor Esteira A1" value={form.nome} onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="setor">Setor <span className="text-red-500">*</span></Label>
                    <Input id="setor" placeholder="Ex: Linha de Producao A" value={form.setor} onChange={(event) => setForm((prev) => ({ ...prev, setor: event.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tipo">Tipo de maquina <span className="text-red-500">*</span></Label>
                    <Input id="tipo" placeholder="Ex: Motor Eletrico, Compressor..." value={form.tipo} onChange={(event) => setForm((prev) => ({ ...prev, tipo: event.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="criticidade">Criticidade</Label>
                    <Select value={form.criticidade} onValueChange={(value) => setForm((prev) => ({ ...prev, criticidade: value }))}>
                      <SelectTrigger id="criticidade" className="w-full">
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
                </>
              )}
            </div>
            {modoSheet !== "ver" ? (
              <SheetFooter className="px-4 pb-4">
                <Button variant="outline" onClick={() => setSheetAberto(false)} disabled={salvando}>Cancelar</Button>
                <Button onClick={salvar} disabled={salvando}>
                  {salvando ? "Salvando..." : modoSheet === "criar" ? "Cadastrar" : "Salvar alteracoes"}
                </Button>
              </SheetFooter>
            ) : null}
          </SheetContent>
        </Sheet>

        <Dialog open={dialogExcluir} onOpenChange={setDialogExcluir}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusao</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir <strong>{maquinaExcluir?.nome}</strong>? Esta acao nao pode ser desfeita e removera todos os sensores e alertas vinculados.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmacao-exclusao" className="text-sm text-muted-foreground">
                Digite o nome da maquina para confirmar:
              </Label>
              <Input
                id="confirmacao-exclusao"
                placeholder={maquinaExcluir?.nome}
                value={confirmacaoExclusao}
                onChange={(event) => setConfirmacaoExclusao(event.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogExcluir(false)} disabled={salvando}>Cancelar</Button>
              <Button
                variant="destructive"
                disabled={confirmacaoExclusao !== maquinaExcluir?.nome || salvando}
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
