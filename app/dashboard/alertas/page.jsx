"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { useAlertas } from "@/components/context/alertas-context"

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
  AlertTriangleIcon, EllipsisVerticalIcon, PlusIcon,
  ArrowLeftIcon, Trash2Icon, EyeIcon, SearchIcon,
  ChevronsLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon,
  CircleCheckIcon, CircleXIcon, ShieldAlertIcon,
} from "lucide-react"
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table"
import { cn, tempoRelativo } from "@/lib/utils"

const TIPOS_ALERTA = ["LIMITE_ULTRAPASSADO", "TENDENCIA_CURTA", "TENDENCIA_LONGA", "DEGRADACAO_ACELERADA", "INSTABILIDADE"]
const TIPOS_ALERTA_LABEL = {
  LIMITE_ULTRAPASSADO: "Limite Ultrapassado", TENDENCIA_CURTA: "Tendência Curta",
  TENDENCIA_LONGA: "Tendência Longa", DEGRADACAO_ACELERADA: "Degradação Acelerada", INSTABILIDADE: "Instabilidade",
}

const formVazio = { tipo: "LIMITE_ULTRAPASSADO", maquinaId: "", maquinaNome: "", sensorId: "", sensorNome: "", severidade: "MEDIA", descricao: "" }

function SeveridadeBadge({ value }) {
  const styles = { ALTA: "bg-red-100 text-red-700 border-red-200", MEDIA: "bg-yellow-100 text-yellow-700 border-yellow-200", BAIXA: "bg-green-100 text-green-700 border-green-200" }
  return <Badge variant="outline" className={`px-1.5 ${styles[value]}`}>{value.charAt(0) + value.slice(1).toLowerCase()}</Badge>
}

function StatusAlertaBadge({ value }) {
  const cfg = {
    ABERTO: { cls: "bg-red-50 text-red-700 border-red-200", Icon: ShieldAlertIcon },
    ATENDIDO: { cls: "bg-green-50 text-green-700 border-green-200", Icon: CircleCheckIcon },
    IGNORADO: { cls: "bg-gray-100 text-gray-500 border-gray-200", Icon: CircleXIcon },
  }
  const { cls, Icon } = cfg[value] ?? cfg.ABERTO
  return <Badge variant="outline" className={`px-1.5 ${cls}`}><Icon className="size-3 mr-1" />{value.charAt(0) + value.slice(1).toLowerCase()}</Badge>
}

function TipoAlertaBadge({ value }) {
  return <Badge variant="outline" className="px-1.5 text-[#3B2867] border-purple-200 bg-purple-50 text-xs font-normal">{TIPOS_ALERTA_LABEL[value] ?? value}</Badge>
}

function AlertasTable({ data, onVer, onExcluir, onStatus }) {
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const columns = React.useMemo(() => [
    {
      accessorKey: "maquinaNome", header: "Máquina",
      cell: ({ row }) => <button onClick={() => onVer(row.original)} className="text-left font-medium text-sm hover:underline hover:text-primary transition-colors">{row.original.maquinaNome}</button>,
    },
    { accessorKey: "tipo", header: "Tipo", cell: ({ row }) => <TipoAlertaBadge value={row.original.tipo} /> },
    { accessorKey: "severidade", header: "Severidade", cell: ({ row }) => <SeveridadeBadge value={row.original.severidade} /> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusAlertaBadge value={row.original.status} /> },
    { accessorKey: "sensorNome", header: "Sensor", cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.sensorNome}</span> },
    { accessorKey: "criadoEm", header: "Criado", cell: ({ row }) => <span className="text-muted-foreground text-sm">{tempoRelativo(row.original.criadoEm)}</span> },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" className="flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon"><EllipsisVerticalIcon /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onVer(row.original)}><EyeIcon className="size-4 mr-1" /> Ver detalhes</DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.original.status !== "ATENDIDO" && <DropdownMenuItem onClick={() => onStatus(row.original.id, "ATENDIDO")}><CircleCheckIcon className="size-4 mr-1 text-green-600" /> Marcar atendido</DropdownMenuItem>}
            {row.original.status !== "IGNORADO" && <DropdownMenuItem onClick={() => onStatus(row.original.id, "IGNORADO")}><CircleXIcon className="size-4 mr-1 text-gray-400" /> Ignorar alerta</DropdownMenuItem>}
            {row.original.status !== "ABERTO" && <DropdownMenuItem onClick={() => onStatus(row.original.id, "ABERTO")}><ShieldAlertIcon className="size-4 mr-1 text-red-500" /> Reabrir</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onExcluir(row.original)}><Trash2Icon className="size-4 mr-1" /> Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [onVer, onExcluir, onStatus])

  const table = useReactTable({
    data, columns, state: { pagination }, onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(), getSortedRowModel: getSortedRowModel(),
  })

  return (
    <>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length
              ? table.getRowModel().rows.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)
              : <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">Nenhum alerta encontrado.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{data.length} resultado(s)</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="size-8" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><ChevronsLeftIcon className="size-4" /></Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeftIcon className="size-4" /></Button>
          <span className="text-sm">Pág. {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}</span>
          <Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRightIcon className="size-4" /></Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><ChevronsRightIcon className="size-4" /></Button>
        </div>
      </div>
    </>
  )
}

export default function AlertasPage() {
  const router = useRouter()
  const { alertas, adicionarAlerta, atualizarStatus, excluirAlerta } = useAlertas()

  const [busca, setBusca] = React.useState("")
  const [sheetAberto, setSheetAberto] = React.useState(false)
  const [modoSheet, setModoSheet] = React.useState("criar")
  const [alertaSelecionado, setAlertaSelecionado] = React.useState(null)
  const [form, setForm] = React.useState(formVazio)
  const [dialogExcluir, setDialogExcluir] = React.useState(false)
  const [alertaExcluir, setAlertaExcluir] = React.useState(null)

  // --- Cards computed values ---
  const totalAbertos = alertas.filter(a => a.status === "ABERTO").length
  const totalAtendidos = alertas.filter(a => a.status === "ATENDIDO").length
  const altaSeveridadeAbertos = alertas.filter(a => a.status === "ABERTO" && a.severidade === "ALTA").length
  const taxaResolucao = alertas.length ? Math.round((totalAtendidos / alertas.length) * 100) : 0

  function abrirCriar() { setModoSheet("criar"); setForm(formVazio); setAlertaSelecionado(null); setSheetAberto(true) }
  function abrirVer(alerta) { setModoSheet("ver"); setAlertaSelecionado(alerta); setSheetAberto(true) }
  function confirmarExcluir(alerta) { setAlertaExcluir(alerta); setDialogExcluir(true) }
  function excluir() { excluirAlerta(alertaExcluir.id); toast.success("Alerta removido."); setDialogExcluir(false); setSheetAberto(false) }
  function handleStatus(id, status) {
    atualizarStatus(id, status)
    const labels = { ATENDIDO: "marcado como atendido", IGNORADO: "ignorado", ABERTO: "reaberto" }
    toast.success(`Alerta ${labels[status] ?? "atualizado"}.`)
  }
  function salvar() {
    if (!form.maquinaNome.trim() || !form.sensorNome.trim() || !form.descricao.trim()) { toast.error("Preencha todos os campos obrigatórios."); return }
    adicionarAlerta(form); toast.success("Alerta registrado com sucesso!"); setSheetAberto(false)
  }

  const dadosFiltrados = React.useMemo(() =>
    alertas.filter(a =>
      a.maquinaNome.toLowerCase().includes(busca.toLowerCase()) ||
      a.sensorNome.toLowerCase().includes(busca.toLowerCase()) ||
      TIPOS_ALERTA_LABEL[a.tipo]?.toLowerCase().includes(busca.toLowerCase())
    ), [alertas, busca])

  const abertos = dadosFiltrados.filter(a => a.status === "ABERTO")
  const atendidos = dadosFiltrados.filter(a => a.status === "ATENDIDO")
  const ignorados = dadosFiltrados.filter(a => a.status === "IGNORADO")

  return (
    <>
      <SiteHeader />
      <div className="flex flex-col gap-6 p-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}><ArrowLeftIcon className="size-4 dark:text-white!" /></Button>
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangleIcon size={22} className="text-[#3B2867] dark:text-white!" />
                <h1 className="text-lg font-medium text-[#3B2867] dark:text-white">Alertas</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {alertas.length} alertas · <span className="text-red-600 font-medium">{alertas.filter(a => a.status === "ABERTO").length} em aberto</span>
              </p>
            </div>
          </div>
          <Button onClick={abrirCriar} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <PlusIcon className="size-4 mr-1" />Novo alerta
          </Button>
        </div>

        <Separator />

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-[#5E17EB]! sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Taxa de resolução</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${taxaResolucao >= 75 ? "text-green-700 bg-green-50 border border-green-200" :
                  taxaResolucao >= 40 ? "text-yellow-700 bg-yellow-50 border border-yellow-200" :
                    "text-red-700 bg-red-50 border border-red-200"
                }`}>
                {taxaResolucao >= 75 ? "Boa" : taxaResolucao >= 40 ? "Regular" : "Baixa"}
              </span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867]">{totalAtendidos} / {alertas.length}</span>
            <div className="flex flex-col gap-1.5">
              <div className="h-2 w-50 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${taxaResolucao >= 75 ? "bg-green-500" : taxaResolucao >= 40 ? "bg-yellow-400" : "bg-red-500"}`}
                  style={{ width: `${taxaResolucao}%` }}
                />
              </div>
              <span className="text-muted-foreground text-xs">Alertas atendidos sobre o total gerado</span>
            </div>
          </div> */}
          <div className="rounded-xl  border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-[#5E17EB]! sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Total</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Todos os sensores</span>

            </div>
            <span className="text-3xl font-bold text-[#3B2867]">{alertas.length}</span>
            <div className="flex flex-col gap-0.5 text-sm ">
              <div className="flex ">
                <span className={` flex items-center gap-1 ${taxaResolucao >= 75 ? "text-green-700" : taxaResolucao >= 40 ? "text-yellow-700" : "text-red-700"}`}>
                  {totalAtendidos} / {alertas.length} atendidos.

                </span>

              </div>

              <div>
                <span className={`text-md   font-medium ${taxaResolucao >= 75 ? "text-green-700" :
                  taxaResolucao >= 40 ? "text-yellow-700" :
                    "text-red-700"
                  }`}>
                  Taxa de resolução
                </span>
                <span className={`text-xs ms-1 px-2 py-0.5 rounded-full font-medium ${taxaResolucao >= 75 ? "text-green-700 bg-green-50 border border-green-200" :
                  taxaResolucao >= 40 ? "text-yellow-700 bg-yellow-50 border border-yellow-200" :
                    "text-red-700 bg-red-50 border border-red-200"
                  }`}>
                  {taxaResolucao >= 75 ? "Boa" : taxaResolucao >= 40 ? "Regular" : "Baixa"}
                </span>
              </div>

            </div>
          </div>

          {/* Em aberto */}
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-[#5E17EB]!">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Alertas em aberto</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${totalAbertos > 0 ? "text-red-700 bg-red-50 border border-red-200" : "text-green-700 bg-green-50 border border-green-200"}`}>
                {totalAbertos > 0 ? "⚠ Pendente" : "✓ Zerado"}
              </span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867]">{totalAbertos}</span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="text-red-600 flex items-center gap-1">
                <ShieldAlertIcon className="size-3.5" />
                {altaSeveridadeAbertos} de alta severidade
              </span>
              <span className="text-muted-foreground flex items-center gap-1">
                <CircleXIcon className="size-3.5 text-gray-400" />
                {alertas.filter(a => a.status === "IGNORADO").length} ignorados
              </span>
            </div>
          </div>

          {/* Atendidos */}
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-[#5E17EB]!">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Alertas atendidos</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Total</span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867]">{totalAtendidos}</span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className={` flex items-center gap-1 ${taxaResolucao >= 10 ? "text-green-700" : "text-gray-400"}`}>
                  <CircleCheckIcon className={`size-3.5  ${taxaResolucao >= 10 ? "fill-green-600" : "fill-gray-200"}`} />
                {totalAtendidos} resolvidos
              </span>
              <span className="text-muted-foreground text-xs">De um total de {alertas.length} alertas</span>
            </div>
          </div>

          {/* Taxa de resolução */}


        </div>

        {/* Busca */}
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input placeholder="Buscar por máquina, sensor ou tipo..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-8" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="abertos" className="w-full flex-col gap-4">
          <TabsList>
            <TabsTrigger value="abertos">
              Em aberto{abertos.length > 0 && <Badge variant="secondary" className="ml-1.5 bg-red-100! text-red-700! border-red-200!">{abertos.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="atendidos">
              Atendidos{atendidos.length > 0 && <Badge variant="secondary" className="ml-1.5">{atendidos.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="ignorados">
              Ignorados{ignorados.length > 0 && <Badge variant="secondary" className="ml-1.5">{ignorados.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="todos">Todos ({dadosFiltrados.length})</TabsTrigger>
          </TabsList>
          {[
            { value: "abertos", data: abertos },
            { value: "atendidos", data: atendidos },
            { value: "ignorados", data: ignorados },
            { value: "todos", data: dadosFiltrados },
          ].map(({ value, data }) => (
            <TabsContent key={value} value={value} className="flex flex-col gap-4">
              <AlertasTable data={data} onVer={abrirVer} onExcluir={confirmarExcluir} onStatus={handleStatus} />
            </TabsContent>
          ))}
        </Tabs>

        {/* Sheet */}
        <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
          <SheetContent side="right" className="w-[420px]! max-w-none! sm:max-w-none!">
            <SheetHeader>
              <SheetTitle>{modoSheet === "criar" ? "Registrar alerta manual" : "Detalhes do alerta"}</SheetTitle>
              <SheetDescription>{modoSheet === "criar" ? "Registre um alerta manualmente para acompanhamento." : "Informações completas do alerta."}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto flex-1">
              {modoSheet === "ver" && alertaSelecionado ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1"><Label className="text-muted-foreground text-xs">Tipo</Label><TipoAlertaBadge value={alertaSelecionado.tipo} /></div>
                    <div className="flex flex-col gap-1"><Label className="text-muted-foreground text-xs">Severidade</Label><SeveridadeBadge value={alertaSelecionado.severidade} /></div>
                    <div className="flex flex-col gap-1 col-span-2"><Label className="text-muted-foreground text-xs">Status</Label><StatusAlertaBadge value={alertaSelecionado.status} /></div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1"><Label className="text-muted-foreground text-xs">Máquina</Label><span className="text-sm font-medium">{alertaSelecionado.maquinaNome}</span></div>
                    <div className="flex flex-col gap-1"><Label className="text-muted-foreground text-xs">Sensor</Label><span className="text-sm font-medium">{alertaSelecionado.sensorNome}</span></div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs">Descrição</Label>
                    <p className="text-sm leading-relaxed text-foreground rounded-md border bg-muted/40 px-3 py-2">{alertaSelecionado.descricao}</p>
                  </div>
                  <div className="flex flex-col gap-1"><Label className="text-muted-foreground text-xs">Criado em</Label><span className="text-sm">{tempoRelativo(alertaSelecionado.criadoEm)}</span></div>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    {alertaSelecionado.status !== "ATENDIDO" && <Button className="w-full" onClick={() => { handleStatus(alertaSelecionado.id, "ATENDIDO"); setSheetAberto(false) }}><CircleCheckIcon className="size-4 mr-1" /> Marcar como atendido</Button>}
                    {alertaSelecionado.status !== "IGNORADO" && <Button variant="outline" className="w-full" onClick={() => { handleStatus(alertaSelecionado.id, "IGNORADO"); setSheetAberto(false) }}><CircleXIcon className="size-4 mr-1" /> Ignorar alerta</Button>}
                    {alertaSelecionado.status !== "ABERTO" && <Button variant="outline" className="w-full" onClick={() => { handleStatus(alertaSelecionado.id, "ABERTO"); setSheetAberto(false) }}><ShieldAlertIcon className="size-4 mr-1" /> Reabrir alerta</Button>}
                    <Button variant="destructive" className="w-full" onClick={() => confirmarExcluir(alertaSelecionado)}><Trash2Icon className="size-4 mr-1" /> Excluir</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tipo">Tipo de alerta</Label>
                    <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                      <SelectTrigger id="tipo" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectGroup>{TIPOS_ALERTA.map(t => <SelectItem key={t} value={t}>{TIPOS_ALERTA_LABEL[t]}</SelectItem>)}</SelectGroup></SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="severidade">Severidade</Label>
                    <Select value={form.severidade} onValueChange={v => setForm(p => ({ ...p, severidade: v }))}>
                      <SelectTrigger id="severidade" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectGroup><SelectItem value="BAIXA">Baixa</SelectItem><SelectItem value="MEDIA">Média</SelectItem><SelectItem value="ALTA">Alta</SelectItem></SelectGroup></SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="maquinaNome">Nome da máquina <span className="text-red-500">*</span></Label>
                    <Input id="maquinaNome" placeholder="Ex: Motor Esteira A1" value={form.maquinaNome} onChange={e => setForm(p => ({ ...p, maquinaNome: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sensorNome">Nome do sensor <span className="text-red-500">*</span></Label>
                    <Input id="sensorNome" placeholder="Ex: Sensor Temp A1-01" value={form.sensorNome} onChange={e => setForm(p => ({ ...p, sensorNome: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="descricao">Descrição <span className="text-red-500">*</span></Label>
                    <Input id="descricao" placeholder="Descreva o problema detectado..." value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
                  </div>
                </>
              )}
            </div>
            {modoSheet !== "ver" && (
              <SheetFooter className="px-4 pb-4">
                <Button variant="outline" onClick={() => setSheetAberto(false)}>Cancelar</Button>
                <Button onClick={salvar}>Registrar alerta</Button>
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
                Tem certeza que deseja excluir o alerta de <strong>{alertaExcluir?.maquinaNome}</strong>? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogExcluir(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={excluir}>Excluir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </>
  )
}