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
import { Checkbox } from "@/components/ui/checkbox"
import { SiteHeader } from "@/components/site-header"
import {
  CircleCheckIcon, WifiOffIcon, EllipsisVerticalIcon, PlusIcon,
  ArrowLeftIcon, PencilIcon, Trash2Icon, EyeIcon, SearchIcon,
  ChevronsLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon,
  NfcIcon, ThermometerIcon, ActivityIcon, AlertTriangleIcon,
} from "lucide-react"
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table"

const formVazio = {
  nome: "",
  maquinaId: "",
  maquinaNome: "",
  temperatura: { habilitado: true, limiteMin: "", limiteMax: "" },
  vibracao: { habilitado: true, limiteMin: "", limiteMax: "" },
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
      {isOnline ? <CircleCheckIcon className="fill-green-600!" /> : <WifiOffIcon className="text-red-500" />}
      {value}
    </Badge>
  )
}

function LeituraCell({ label, valor, unidade, limiteMin, limiteMax, icon: Icon }) {
  if (valor === undefined || valor === null) {
    return <span className="text-muted-foreground text-sm">—</span>
  }
  const overLimit = valor > limiteMax || valor < limiteMin
  const pct = limiteMax > limiteMin ? Math.min(100, Math.max(0, ((valor - limiteMin) / (limiteMax - limiteMin)) * 100)) : 0
  const barColor = overLimit ? "bg-red-500" : pct > 80 ? "bg-yellow-400" : "bg-green-500"

  return (
    <div className="flex flex-col gap-1 min-w-[110px]">
      <div className="flex items-center gap-1">
        <span className={`font-mono text-sm font-medium ${overLimit ? "text-red-600" : "text-foreground"}`}>
          {valor}
          <span className="text-muted-foreground font-normal ml-0.5 text-xs">{unidade}</span>
        </span>
        {overLimit && <AlertTriangleIcon className="size-3 text-red-500" />}
      </div>
      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function LimitesInfo({ sensor, unidade }) {
  if (!sensor) return <span className="text-muted-foreground text-sm">—</span>
  return (
    <span className="text-muted-foreground text-sm">
      {sensor.limiteMin} – {sensor.limiteMax} <span className="text-xs">{unidade}</span>
    </span>
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
      nome: sensor.nome,
      maquinaId: String(sensor.maquinaId),
      maquinaNome: sensor.maquinaNome,
      temperatura: sensor.temperatura
        ? { habilitado: true, limiteMin: String(sensor.temperatura.limiteMin), limiteMax: String(sensor.temperatura.limiteMax) }
        : { habilitado: false, limiteMin: "", limiteMax: "" },
      vibracao: sensor.vibracao
        ? { habilitado: true, limiteMin: String(sensor.vibracao.limiteMin), limiteMax: String(sensor.vibracao.limiteMax) }
        : { habilitado: false, limiteMin: "", limiteMax: "" },
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

  function setTempField(field, value) {
    setForm(p => ({ ...p, temperatura: { ...p.temperatura, [field]: value } }))
  }
  function setVibField(field, value) {
    setForm(p => ({ ...p, vibracao: { ...p.vibracao, [field]: value } }))
  }

  function salvar() {
    if (!form.nome.trim() || !form.maquinaId) {
      toast.error("Preencha o nome e a máquina vinculada.")
      return
    }
    if (!form.temperatura.habilitado && !form.vibracao.habilitado) {
      toast.error("Habilite ao menos um sensor (temperatura ou vibração).")
      return
    }
    if (form.temperatura.habilitado && (!form.temperatura.limiteMin || !form.temperatura.limiteMax)) {
      toast.error("Informe os limites do sensor de temperatura.")
      return
    }
    if (form.vibracao.habilitado && (!form.vibracao.limiteMin || !form.vibracao.limiteMax)) {
      toast.error("Informe os limites do sensor de vibração.")
      return
    }

    const payload = {
      nome: form.nome,
      maquinaId: Number(form.maquinaId),
      maquinaNome: form.maquinaNome,
      temperatura: form.temperatura.habilitado
        ? { valorAtual: 0, limiteMin: Number(form.temperatura.limiteMin), limiteMax: Number(form.temperatura.limiteMax) }
        : null,
      vibracao: form.vibracao.habilitado
        ? { valorAtual: 0, limiteMin: Number(form.vibracao.limiteMin), limiteMax: Number(form.vibracao.limiteMax) }
        : null,
    }

    if (modoSheet === "criar") {
      adicionarSensor(payload)
      toast.success("Equipamento Orbis cadastrado com sucesso!")
    } else {
      editarSensor(sensorSelecionado.id, payload)
      toast.success("Equipamento atualizado com sucesso!")
    }
    setSheetAberto(false)
  }

  function confirmarExcluir(sensor) {
    setSensorExcluir(sensor)
    setDialogExcluir(true)
  }

  function excluir() {
    excluirSensor(sensorExcluir.id)
    toast.success("Equipamento removido.")
    setDialogExcluir(false)
    setSheetAberto(false)
  }

  const dadosFiltrados = React.useMemo(() =>
    sensores.filter(s =>
      s.nome.toLowerCase().includes(busca.toLowerCase()) ||
      s.maquinaNome.toLowerCase().includes(busca.toLowerCase())
    ), [sensores, busca])

  const columns = [
    {
      accessorKey: "nome",
      header: "Equipamento",
      cell: ({ row }) => (
        <button onClick={() => abrirVer(row.original)} className="text-left font-medium text-sm hover:underline hover:text-primary transition-colors">
          {row.original.nome}
        </button>
      ),
    },
    {
      accessorKey: "maquinaNome",
      header: "Máquina",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.maquinaNome}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge value={row.original.status} />,
    },
    {
      id: "temperatura",
      header: () => (
        <div className="flex items-center gap-1">
          <ThermometerIcon className="size-3.5 text-orange-500" />
          Temperatura
        </div>
      ),
      cell: ({ row }) => {
        const t = row.original.temperatura
        if (!t) return <span className="text-muted-foreground text-sm">—</span>
        return (
          <LeituraCell
            valor={t.valorAtual}
            unidade="°C"
            limiteMin={t.limiteMin}
            limiteMax={t.limiteMax}
          />
        )
      },
    },
    {
      id: "vibracao",
      header: () => (
        <div className="flex items-center gap-1">
          <ActivityIcon className="size-3.5 text-blue-500" />
          Vibração
        </div>
      ),
      cell: ({ row }) => {
        const v = row.original.vibracao
        if (!v) return <span className="text-muted-foreground text-sm">—</span>
        return (
          <LeituraCell
            valor={v.valorAtual}
            unidade="mm/s"
            limiteMin={v.limiteMin}
            limiteMax={v.limiteMax}
          />
        )
      },
    },
    {
      accessorKey: "ultimaLeituraEm",
      header: "Último sinal",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{tempoRelativo(row.original.ultimaLeituraEm)}</span>,
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
                <h1 className="text-lg font-medium text-[#3B2867]">Equipamentos Orbis</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {sensores.length} equipamentos · cada um com sensores de temperatura e vibração embutidos
              </p>
            </div>
          </div>
          <Button onClick={abrirCriar} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <PlusIcon className="size-4 mr-1" />Novo equipamento
          </Button>
        </div>

        <Separator />

        {/* Busca */}
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou máquina..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-8" />
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
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">Nenhum equipamento encontrado.</TableCell>
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
                {modoSheet === "criar" ? "Novo equipamento Orbis" : modoSheet === "editar" ? "Editar equipamento" : "Detalhes do equipamento"}
              </SheetTitle>
              <SheetDescription>
                {modoSheet === "criar" ? "Cadastre um novo equipamento com os sensores embutidos." :
                 modoSheet === "editar" ? "Altere as configurações e clique em salvar." :
                 "Leituras e configurações do equipamento Orbis."}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto flex-1">

              {/* ── MODO VER ── */}
              {modoSheet === "ver" && sensorSelecionado ? (
                <>
                  {/* Info geral */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <Label className="text-muted-foreground text-xs">Equipamento</Label>
                      <span className="text-sm font-semibold">{sensorSelecionado.nome}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-muted-foreground text-xs">Máquina vinculada</Label>
                      <span className="text-sm font-medium">{sensorSelecionado.maquinaNome}</span>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <Label className="text-muted-foreground text-xs">Status</Label>
                      <StatusBadge value={sensorSelecionado.status} />
                    </div>
                  </div>

                  <Separator />

                  {/* Sensor Temperatura */}
                  <div className="rounded-lg border border-orange-100 bg-orange-50/40 p-3 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <ThermometerIcon className="size-4 text-orange-500" />
                      <span className="text-sm font-medium">Sensor de Temperatura</span>
                    </div>
                    {sensorSelecionado.temperatura ? (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1">
                          <Label className="text-muted-foreground text-xs">Leitura atual</Label>
                          <span className={`text-sm font-semibold ${sensorSelecionado.temperatura.valorAtual > sensorSelecionado.temperatura.limiteMax ? "text-red-600" : "text-foreground"}`}>
                            {sensorSelecionado.temperatura.valorAtual} °C
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label className="text-muted-foreground text-xs">Limite mín.</Label>
                          <span className="text-sm">{sensorSelecionado.temperatura.limiteMin} °C</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label className="text-muted-foreground text-xs">Limite máx.</Label>
                          <span className="text-sm">{sensorSelecionado.temperatura.limiteMax} °C</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Não habilitado</span>
                    )}
                  </div>

                  {/* Sensor Vibração */}
                  <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <ActivityIcon className="size-4 text-blue-500" />
                      <span className="text-sm font-medium">Sensor de Vibração</span>
                    </div>
                    {sensorSelecionado.vibracao ? (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1">
                          <Label className="text-muted-foreground text-xs">Leitura atual</Label>
                          <span className={`text-sm font-semibold ${sensorSelecionado.vibracao.valorAtual > sensorSelecionado.vibracao.limiteMax ? "text-red-600" : "text-foreground"}`}>
                            {sensorSelecionado.vibracao.valorAtual} mm/s
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label className="text-muted-foreground text-xs">Limite mín.</Label>
                          <span className="text-sm">{sensorSelecionado.vibracao.limiteMin} mm/s</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label className="text-muted-foreground text-xs">Limite máx.</Label>
                          <span className="text-sm">{sensorSelecionado.vibracao.limiteMax} mm/s</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Não habilitado</span>
                    )}
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

              /* ── MODO CRIAR / EDITAR ── */
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="nome">Nome do equipamento <span className="text-red-500">*</span></Label>
                    <Input id="nome" placeholder="Ex: Orbis A1" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
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

                  <Separator />

                  {/* Sensor Temperatura */}
                  <div className="rounded-lg border border-orange-100 bg-orange-50/30 p-3 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="temp-habilitado"
                        checked={form.temperatura.habilitado}
                        onCheckedChange={v => setTempField("habilitado", v)}
                      />
                      <Label htmlFor="temp-habilitado" className="flex items-center gap-1.5 cursor-pointer">
                        <ThermometerIcon className="size-4 text-orange-500" />
                        Sensor de Temperatura
                      </Label>
                    </div>
                    {form.temperatura.habilitado && (
                      <div className="grid grid-cols-2 gap-2 pl-6">
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="temp-min" className="text-xs text-muted-foreground">Limite mín. (°C) <span className="text-red-500">*</span></Label>
                          <Input id="temp-min" type="number" placeholder="0" value={form.temperatura.limiteMin} onChange={e => setTempField("limiteMin", e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="temp-max" className="text-xs text-muted-foreground">Limite máx. (°C) <span className="text-red-500">*</span></Label>
                          <Input id="temp-max" type="number" placeholder="100" value={form.temperatura.limiteMax} onChange={e => setTempField("limiteMax", e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sensor Vibração */}
                  <div className="rounded-lg border border-blue-100 bg-blue-50/30 p-3 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="vib-habilitado"
                        checked={form.vibracao.habilitado}
                        onCheckedChange={v => setVibField("habilitado", v)}
                      />
                      <Label htmlFor="vib-habilitado" className="flex items-center gap-1.5 cursor-pointer">
                        <ActivityIcon className="size-4 text-blue-500" />
                        Sensor de Vibração
                      </Label>
                    </div>
                    {form.vibracao.habilitado && (
                      <div className="grid grid-cols-2 gap-2 pl-6">
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="vib-min" className="text-xs text-muted-foreground">Limite mín. (mm/s) <span className="text-red-500">*</span></Label>
                          <Input id="vib-min" type="number" placeholder="0" step="0.01" value={form.vibracao.limiteMin} onChange={e => setVibField("limiteMin", e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="vib-max" className="text-xs text-muted-foreground">Limite máx. (mm/s) <span className="text-red-500">*</span></Label>
                          <Input id="vib-max" type="number" placeholder="0.8" step="0.01" value={form.vibracao.limiteMax} onChange={e => setVibField("limiteMax", e.target.value)} />
                        </div>
                      </div>
                    )}
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
                Tem certeza que deseja excluir o equipamento <strong>{sensorExcluir?.nome}</strong>? Esta ação não pode ser desfeita e removerá todos os alertas vinculados.
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