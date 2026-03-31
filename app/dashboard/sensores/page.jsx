"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { useSensores } from "@/components/context/sensores-context"
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
  CircleCheckIcon, WifiOffIcon, EllipsisVerticalIcon, PlusIcon,
  ArrowLeftIcon, PencilIcon, Trash2Icon, EyeIcon, SearchIcon,
  ChevronsLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon,
  NfcIcon,
} from "lucide-react"
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table"

const TIPOS_SENSOR = ["Temperatura", "Vibração", "Pressão", "Corrente", "Umidade", "Velocidade"]
const UNIDADES_POR_TIPO = {
  Temperatura: "°C",
  Vibração: "mm/s",
  Pressão: "bar",
  Corrente: "A",
  Umidade: "%",
  Velocidade: "rpm",
}

const formVazio = {
  nome: "", tipo: "Temperatura", maquinaId: "", maquinaNome: "",
  unidade: "°C", limiteMin: "", limiteMax: "",
}

function tempoRelativo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diff < 60) return `${diff}s atrás`
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  return `${Math.floor(diff / 3600)}h atrás`
}

function StatusBadge({ value }) {
  const isOnline = value === "ONLINE"
  return (
    <Badge variant="outline" className={`px-1.5 ${isOnline ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"}`}>
      {isOnline
        ? <CircleCheckIcon className="fill-green-600!" />
        : <WifiOffIcon className="text-red-500" />}
      {value}
    </Badge>
  )
}

function TipoBadge({ value }) {
  const colors = {
    Temperatura: "bg-orange-50 text-orange-700 border-orange-200",
    Vibração: "bg-blue-50 text-blue-700 border-blue-200",
    Pressão: "bg-purple-50 text-purple-700 border-purple-200",
    Corrente: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Umidade: "bg-cyan-50 text-cyan-700 border-cyan-200",
    Velocidade: "bg-green-50 text-green-700 border-green-200",
  }
  return (
    <Badge variant="outline" className={`px-1.5 ${colors[value] ?? "bg-gray-50 text-gray-700 border-gray-200"}`}>
      {value}
    </Badge>
  )
}

export default function SensoresPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { sensores, adicionarSensor, editarSensor, excluirSensor } = useSensores()
  const { maquinas } = useMaquinas()

  const [busca, setBusca] = React.useState("")
  const [sheetAberto, setSheetAberto] = React.useState(false)
  const [modoSheet, setModoSheet] = React.useState("criar")
  const [sensorSelecionado, setSensorSelecionado] = React.useState(null)
  const [form, setForm] = React.useState(formVazio)
  const [dialogExcluir, setDialogExcluir] = React.useState(false)
  const [sensorExcluir, setSensorExcluir] = React.useState(null)
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

  React.useEffect(() => {
    if (searchParams.get("action") === "new") abrirCriar()
  }, [])

  function abrirCriar() {
    setModoSheet("criar")
    setForm(formVazio)
    setSensorSelecionado(null)
    setSheetAberto(true)
  }

  function abrirEditar(sensor) {
    setModoSheet("editar")
    setForm({
      nome: sensor.nome, tipo: sensor.tipo,
      maquinaId: String(sensor.maquinaId), maquinaNome: sensor.maquinaNome,
      unidade: sensor.unidade, limiteMin: String(sensor.limiteMin), limiteMax: String(sensor.limiteMax),
    })
    setSensorSelecionado(sensor)
    setSheetAberto(true)
  }

  function abrirVer(sensor) {
    setModoSheet("ver")
    setSensorSelecionado(sensor)
    setSheetAberto(true)
  }

  function handleMaquinaChange(maquinaId) {
    const maquina = maquinas.find(m => String(m.id) === maquinaId)
    setForm(p => ({ ...p, maquinaId, maquinaNome: maquina?.nome ?? "" }))
  }

  function handleTipoChange(tipo) {
    setForm(p => ({ ...p, tipo, unidade: UNIDADES_POR_TIPO[tipo] ?? "" }))
  }

  function salvar() {
    if (!form.nome.trim() || !form.maquinaId || !form.limiteMin || !form.limiteMax) {
      toast.error("Preencha todos os campos obrigatórios.")
      return
    }
    const payload = {
      ...form,
      maquinaId: Number(form.maquinaId),
      limiteMin: Number(form.limiteMin),
      limiteMax: Number(form.limiteMax),
    }
    if (modoSheet === "criar") {
      adicionarSensor(payload)
      toast.success("Sensor cadastrado com sucesso!")
    } else {
      editarSensor(sensorSelecionado.id, payload)
      toast.success("Sensor atualizado com sucesso!")
    }
    setSheetAberto(false)
  }

  function confirmarExcluir(sensor) {
    setSensorExcluir(sensor)
    setDialogExcluir(true)
  }

  function excluir() {
    excluirSensor(sensorExcluir.id)
    toast.success("Sensor removido.")
    setDialogExcluir(false)
    setSheetAberto(false)
  }

  const dadosFiltrados = React.useMemo(() =>
    sensores.filter(s =>
      s.nome.toLowerCase().includes(busca.toLowerCase()) ||
      s.tipo.toLowerCase().includes(busca.toLowerCase()) ||
      s.maquinaNome.toLowerCase().includes(busca.toLowerCase())
    ), [sensores, busca])

  const columns = [
    {
      accessorKey: "nome",
      header: "Sensor",
      cell: ({ row }) => (
        <button onClick={() => abrirVer(row.original)} className="text-left font-medium text-sm hover:underline hover:text-primary transition-colors">
          {row.original.nome}
        </button>
      ),
    },
    { accessorKey: "tipo", header: "Tipo", cell: ({ row }) => <TipoBadge value={row.original.tipo} /> },
    { accessorKey: "maquinaNome", header: "Máquina", cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.maquinaNome}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    {
      accessorKey: "valorAtual",
      header: "Leitura Atual",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">
          {row.original.valorAtual} <span className="text-muted-foreground font-normal">{row.original.unidade}</span>
        </span>
      ),
    },
    {
      id: "limites",
      header: "Limites",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.limiteMin} – {row.original.limiteMax} {row.original.unidade}
        </span>
      ),
    },
    { accessorKey: "ultimaLeituraEm", header: "Último sinal", cell: ({ row }) => <span className="text-muted-foreground text-sm">{tempoRelativo(row.original.ultimaLeituraEm)}</span> },
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
            <Button variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeftIcon className="size-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <NfcIcon size={22} className="text-[#3B2867]" />
                <h1 className="text-lg font-medium text-[#3B2867]">Sensores</h1>
              </div>
              <p className="text-sm text-muted-foreground">{sensores.length} sensores cadastrados</p>
            </div>
          </div>
          <Button onClick={abrirCriar} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <PlusIcon className="size-4 mr-1" />Novo sensor
          </Button>
        </div>

        <Separator />

        {/* Busca */}
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, tipo ou máquina..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-8" />
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
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">Nenhum sensor encontrado.</TableCell>
                </TableRow>
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

        {/* Sheet criar / editar / ver */}
        <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
          <SheetContent side="right" className="w-[420px]! max-w-none! sm:max-w-none!">
            <SheetHeader>
              <SheetTitle>
                {modoSheet === "criar" ? "Novo sensor" : modoSheet === "editar" ? "Editar sensor" : "Detalhes do sensor"}
              </SheetTitle>
              <SheetDescription>
                {modoSheet === "criar" ? "Preencha os dados para cadastrar um novo sensor." :
                 modoSheet === "editar" ? "Altere os dados e clique em salvar." :
                 "Informações completas do sensor."}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto flex-1">
              {modoSheet === "ver" && sensorSelecionado ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      ["Nome", sensorSelecionado.nome],
                      ["Máquina", sensorSelecionado.maquinaNome],
                      ["Unidade", sensorSelecionado.unidade],
                      ["Leitura Atual", `${sensorSelecionado.valorAtual} ${sensorSelecionado.unidade}`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <Label className="text-muted-foreground text-xs">{label}</Label>
                        <span className="text-sm font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1"><Label className="text-muted-foreground text-xs">Tipo</Label><TipoBadge value={sensorSelecionado.tipo} /></div>
                    <div className="flex flex-col gap-1"><Label className="text-muted-foreground text-xs">Status</Label><StatusBadge value={sensorSelecionado.status} /></div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <Label className="text-muted-foreground text-xs">Limite Mínimo</Label>
                      <span className="text-sm font-medium">{sensorSelecionado.limiteMin} {sensorSelecionado.unidade}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-muted-foreground text-xs">Limite Máximo</Label>
                      <span className="text-sm font-medium">{sensorSelecionado.limiteMax} {sensorSelecionado.unidade}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs">Último sinal</Label>
                    <span className="text-sm">{tempoRelativo(sensorSelecionado.ultimaLeituraEm)}</span>
                  </div>
                  <Separator />
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => { setSheetAberto(false); setTimeout(() => abrirEditar(sensorSelecionado), 100) }}>
                      <PencilIcon className="size-4 mr-1" /> Editar
                    </Button>
                    <Button variant="destructive" onClick={() => confirmarExcluir(sensorSelecionado)}>
                      <Trash2Icon className="size-4 mr-1" /> Excluir
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="nome">Nome <span className="text-red-500">*</span></Label>
                    <Input id="nome" placeholder="Ex: Sensor Temp A1-01" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tipo">Tipo de sensor <span className="text-red-500">*</span></Label>
                    <Select value={form.tipo} onValueChange={handleTipoChange}>
                      <SelectTrigger id="tipo" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {TIPOS_SENSOR.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="maquina">Máquina vinculada <span className="text-red-500">*</span></Label>
                    <Select value={form.maquinaId} onValueChange={handleMaquinaChange}>
                      <SelectTrigger id="maquina" className="w-full"><SelectValue placeholder="Selecione uma máquina" /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {maquinas.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>)}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="unidade">Unidade</Label>
                    <Input id="unidade" placeholder="Ex: °C, bar, mm/s" value={form.unidade} onChange={e => setForm(p => ({ ...p, unidade: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="limiteMin">Limite mín. <span className="text-red-500">*</span></Label>
                      <Input id="limiteMin" type="number" placeholder="0" value={form.limiteMin} onChange={e => setForm(p => ({ ...p, limiteMin: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="limiteMax">Limite máx. <span className="text-red-500">*</span></Label>
                      <Input id="limiteMax" type="number" placeholder="100" value={form.limiteMax} onChange={e => setForm(p => ({ ...p, limiteMax: e.target.value }))} />
                    </div>
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

        {/* Dialog confirmar exclusão */}
        <Dialog open={dialogExcluir} onOpenChange={setDialogExcluir}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir <strong>{sensorExcluir?.nome}</strong>? Esta ação não pode ser desfeita e removerá todos os alertas vinculados a este sensor.
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