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
  WashingMachineIcon, ShieldAlertIcon,
} from "lucide-react"
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn, tempoRelativo } from "@/lib/utils"

const formVazio = { nome: "", setor: "", tipo: "", criticidade: "MEDIA" }

function CriticidadeBadge({ value }) {
  const styles = { ALTA: "bg-red-100 text-red-700 border-red-200", MEDIA: "bg-yellow-100 text-yellow-700 border-yellow-200", BAIXA: "bg-green-100 text-green-700 border-green-200" }
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
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-sm font-medium w-9 text-right tabular-nums ${textCor}`}>{value}%</span>
    </div>
  )
}

export default function MaquinasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { maquinas, adicionarMaquina, editarMaquina, excluirMaquina } = useMaquinas()

  const [busca, setBusca] = React.useState("")
  const [sheetAberto, setSheetAberto] = React.useState(false)
  const [modoSheet, setModoSheet] = React.useState("criar")
  const [maquinaSelecionada, setMaquinaSelecionada] = React.useState(null)
  const [form, setForm] = React.useState(formVazio)
  const [dialogExcluir, setDialogExcluir] = React.useState(false)
  const [maquinaExcluir, setMaquinaExcluir] = React.useState(null)
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

  // --- Cards computed values ---
  const totalOk = maquinas.filter(m => m.status === "OK").length
  const totalAlerta = maquinas.filter(m => m.status !== "OK").length
  const criticasAlta = maquinas.filter(m => m.criticidade === "ALTA").length
  const criticasAltaAlerta = maquinas.filter(m => m.criticidade === "ALTA" && m.status !== "OK").length
  const integridadeMedia = maquinas.length
    ? Math.round(maquinas.reduce((acc, m) => acc + (m.integridade ?? 0), 0) / maquinas.length)
    : 0

  React.useEffect(() => {
    if (searchParams.get("action") === "new") abrirCriar()
  }, [])

  function abrirCriar() {
    setModoSheet("criar"); setForm(formVazio); setMaquinaSelecionada(null); setSheetAberto(true)
  }
  function abrirEditar(maquina) {
    setModoSheet("editar")
    setForm({ nome: maquina.nome, setor: maquina.setor, tipo: maquina.tipo, criticidade: maquina.criticidade })
    setMaquinaSelecionada(maquina); setSheetAberto(true)
  }
  function abrirVer(maquina) {
    setModoSheet("ver"); setMaquinaSelecionada(maquina); setSheetAberto(true)
  }
  function salvar() {
    if (!form.nome.trim() || !form.setor.trim() || !form.tipo.trim()) {
      toast.error("Preencha todos os campos obrigatórios."); return
    }
    if (modoSheet === "criar") { adicionarMaquina(form); toast.success("Máquina cadastrada com sucesso!") }
    else { editarMaquina(maquinaSelecionada.id, form); toast.success("Máquina atualizada com sucesso!") }
    setSheetAberto(false)
  }
  function confirmarExcluir(maquina) { setMaquinaExcluir(maquina); setDialogExcluir(true) }
  function excluir() {
    excluirMaquina(maquinaExcluir.id); toast.success("Máquina removida.")
    setDialogExcluir(false); setSheetAberto(false)
  }

  const dadosFiltrados = React.useMemo(() =>
    maquinas.filter(m =>
      m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      m.setor.toLowerCase().includes(busca.toLowerCase()) ||
      m.tipo.toLowerCase().includes(busca.toLowerCase())
    ), [maquinas, busca])

  const columns = [
    {
      accessorKey: "nome", header: "Máquina",
      cell: ({ row }) => (
        <button onClick={() => abrirVer(row.original)} className="text-left font-medium text-sm hover:underline hover:text-primary transition-colors">
          {row.original.nome}
        </button>
      ),
    },
    { accessorKey: "setor", header: "Setor", cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.setor}</span> },
    { accessorKey: "criticidade", header: "Criticidade", cell: ({ row }) => <CriticidadeBadge value={row.original.criticidade} /> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    { accessorKey: "integridade", header: "Integridade", cell: ({ row }) => <IntegridadeBar value={row.original.integridade} /> },
    { accessorKey: "ultimaLeituraEm", header: "Último sinal", cell: ({ row }) => <span className="text-muted-foreground text-sm">{tempoRelativo(row.original.ultimaLeituraEm)}</span> },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon"><EllipsisVerticalIcon /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => abrirVer(row.original)}><EyeIcon className="size-4 mr-1" /> Ver detalhes</DropdownMenuItem>
            <DropdownMenuItem onClick={() => abrirEditar(row.original)}><PencilIcon className="size-4 mr-1" /> Editar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => confirmarExcluir(row.original)}><Trash2Icon className="size-4 mr-1" /> Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data: dadosFiltrados, columns,
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

        {/* Header */}
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
                <h1 className="text-[18pt]! mb-0! font-medium text-[#3B2867]">Máquinas</h1>
              </div>
              <p className="text-sm text-muted-foreground mb-0!">{maquinas.length} máquinas cadastradas</p>
            </div>
          </div>
          <Button onClick={abrirCriar} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <PlusIcon className="size-4 mr-1" />Nova máquina
          </Button>
        </div>

        <Separator />

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* Total de máquinas */}
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-[#5E17EB]!">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Total de máquinas</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{maquinas.length} cadastradas</span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867]">{maquinas.length}</span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="text-green-700 flex items-center gap-1">
                <CircleCheckIcon className="size-3.5 fill-green-600" />
                {totalOk} operando normalmente
              </span>
              <span className="text-red-600 flex items-center gap-1">
                <AlertTriangleIcon className="size-3.5" />
                {totalAlerta} requerem atenção
              </span>
            </div>
          </div>

          {/* Criticidade alta */}
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-[#5E17EB]!">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Criticidade alta</span>
              <span className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                ⚠ atenção
              </span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867]">{criticasAlta}</span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="text-red-600 flex items-center gap-1">
                <ShieldAlertIcon className="size-3.5" />
                {criticasAltaAlerta} em alerta agora
              </span>
              <span className="text-muted-foreground text-xs">
                {criticasAlta - criticasAltaAlerta} operando normalmente
              </span>
            </div>
          </div>

          {/* Integridade média */}
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-[#5E17EB]! sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Integridade média</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                integridadeMedia >= 75 ? "text-green-700 bg-green-50 border border-green-200" :
                integridadeMedia >= 50 ? "text-yellow-700 bg-yellow-50 border border-yellow-200" :
                "text-red-700 bg-red-50 border border-red-200"
              }`}>
                {integridadeMedia >= 75 ? "Estável" : integridadeMedia >= 50 ? "Atenção" : "Crítico"}
              </span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867]">{integridadeMedia}%</span>
            <div className="flex flex-col gap-1.5">
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    integridadeMedia >= 75 ? "bg-green-500" : integridadeMedia >= 50 ? "bg-yellow-400" : "bg-red-500"
                  }`}
                  style={{ width: `${integridadeMedia}%` }}
                />
              </div>
              <span className="text-muted-foreground text-xs">Média de integridade da frota</span>
            </div>
          </div>

        </div>

        {/* Busca */}
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, setor ou tipo..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-8" />
        </div>

        {/* Tabela */}
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id}>
                  {hg.headers.map(h => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">Nenhuma máquina encontrada.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{dadosFiltrados.length} resultado(s)</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="size-8" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><ChevronsLeftIcon className="size-4" /></Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeftIcon className="size-4" /></Button>
            <span className="text-sm">Pág. {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}</span>
            <Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRightIcon className="size-4" /></Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><ChevronsRightIcon className="size-4" /></Button>
          </div>
        </div>

        {/* Sheet */}
        <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
          <SheetContent side="right" className="w-[420px]! max-w-none! sm:max-w-none!">
            <SheetHeader>
              <SheetTitle>
                {modoSheet === "criar" ? "Nova máquina" : modoSheet === "editar" ? "Editar máquina" : "Detalhes da máquina"}
              </SheetTitle>
              <SheetDescription>
                {modoSheet === "criar" ? "Preencha os dados para cadastrar uma nova máquina." :
                 modoSheet === "editar" ? "Altere os dados e clique em salvar." :
                 "Informações completas da máquina."}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto flex-1">
              {modoSheet === "ver" && maquinaSelecionada ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {[["Nome", maquinaSelecionada.nome], ["Setor", maquinaSelecionada.setor], ["Tipo", maquinaSelecionada.tipo], ["Sensores", maquinaSelecionada.sensores]].map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <Label className="text-muted-foreground text-xs">{label}</Label>
                        <span className="text-sm font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1"><Label className="text-muted-foreground text-xs">Criticidade</Label><CriticidadeBadge value={maquinaSelecionada.criticidade} /></div>
                    <div className="flex flex-col gap-1"><Label className="text-muted-foreground text-xs">Status</Label><StatusBadge value={maquinaSelecionada.status} /></div>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2"><Label className="text-muted-foreground text-xs">Integridade</Label><IntegridadeBar value={maquinaSelecionada.integridade} /></div>
                  <div className="flex flex-col gap-2"><Label className="text-muted-foreground text-xs">Score de estabilidade</Label><IntegridadeBar value={maquinaSelecionada.scoreEstabilidade} /></div>
                  <div className="flex flex-col gap-1"><Label className="text-muted-foreground text-xs">Último sinal</Label><span className="text-sm">{tempoRelativo(maquinaSelecionada.ultimaLeituraEm)}</span></div>
                  <Separator />
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => { setSheetAberto(false); setTimeout(() => abrirEditar(maquinaSelecionada), 100) }}>
                      <PencilIcon className="size-4 mr-1" /> Editar
                    </Button>
                    <Button variant="destructive" onClick={() => confirmarExcluir(maquinaSelecionada)}>
                      <Trash2Icon className="size-4 mr-1" /> Excluir
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="nome">Nome <span className="text-red-500">*</span></Label>
                    <Input id="nome" placeholder="Ex: Motor Esteira A1" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="setor">Setor <span className="text-red-500">*</span></Label>
                    <Input id="setor" placeholder="Ex: Linha de Produção A" value={form.setor} onChange={e => setForm(p => ({ ...p, setor: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tipo">Tipo de máquina <span className="text-red-500">*</span></Label>
                    <Input id="tipo" placeholder="Ex: Motor Elétrico, Compressor..." value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="criticidade">Criticidade</Label>
                    <Select value={form.criticidade} onValueChange={v => setForm(p => ({ ...p, criticidade: v }))}>
                      <SelectTrigger id="criticidade" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="BAIXA">Baixa</SelectItem>
                          <SelectItem value="MEDIA">Média</SelectItem>
                          <SelectItem value="ALTA">Alta</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            {modoSheet !== "ver" && (
              <SheetFooter className="px-4 pb-4">
                <Button variant="outline" onClick={() => setSheetAberto(false)}>Cancelar</Button>
                <Button onClick={salvar}>{modoSheet === "criar" ? "Cadastrar" : "Salvar alterações"}</Button>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>

        {/* Dialog exclusão */}
        <Dialog open={dialogExcluir} onOpenChange={setDialogExcluir}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir <strong>{maquinaExcluir?.nome}</strong>? Esta ação não pode ser desfeita e removerá todos os sensores e alertas vinculados.
                <DialogDescription className="mt-2 text-sm text-muted-foreground">Digite o nome da máquina para confirmar:</DialogDescription>
                <Input placeholder={maquinaExcluir?.nome} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogExcluir(false)}>Cancelar</Button>
              <Button variant="destructive" disabled={form.nome !== maquinaExcluir?.nome} onClick={excluir}>Excluir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </>
  )
}