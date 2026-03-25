"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { z } from "zod"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CircleCheckIcon,
  AlertTriangleIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  ArrowLeftIcon,
  PencilIcon,
  Trash2Icon,
  EyeIcon,
  SearchIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
} from "lucide-react"

// =============================================================
// INTEGRAÇÃO COM A API — quando a API estiver pronta:
//
// GET    /maquinas          → listar
// POST   /maquinas          → criar
// PUT    /maquinas/:id      → atualizar
// DELETE /maquinas/:id      → deletar
//
// Todas as rotas exigem: Authorization: Bearer <token>
// =============================================================

const mockMaquinas = [
  { id: 1, nome: "Motor Esteira A1", setor: "Linha de Produção A", tipo: "Motor Elétrico", criticidade: "ALTA", integridade: 42, scoreEstabilidade: 31, status: "ALERTA", ultimaLeituraEm: "2026-03-24T10:12:00Z", sensores: 2 },
  { id: 2, nome: "Compressor B2", setor: "Linha de Produção B", tipo: "Compressor", criticidade: "ALTA", integridade: 88, scoreEstabilidade: 75, status: "OK", ultimaLeituraEm: "2026-03-24T10:14:00Z", sensores: 1 },
  { id: 3, nome: "Rolamento C3", setor: "Esteira Principal", tipo: "Rolamento", criticidade: "MEDIA", integridade: 67, scoreEstabilidade: 58, status: "OK", ultimaLeituraEm: "2026-03-24T10:13:00Z", sensores: 1 },
  { id: 4, nome: "Motor Esteira B3", setor: "Linha de Produção B", tipo: "Motor Elétrico", criticidade: "MEDIA", integridade: 95, scoreEstabilidade: 91, status: "OK", ultimaLeituraEm: "2026-03-24T10:11:00Z", sensores: 2 },
  { id: 5, nome: "Bomba Hidráulica D1", setor: "Setor Hidráulico", tipo: "Bomba", criticidade: "ALTA", integridade: 0, scoreEstabilidade: 12, status: "ALERTA", ultimaLeituraEm: "2026-03-24T09:58:00Z", sensores: 1 },
  { id: 6, nome: "Ventilador E2", setor: "Resfriamento", tipo: "Ventilador", criticidade: "BAIXA", integridade: 100, scoreEstabilidade: 98, status: "OK", ultimaLeituraEm: "2026-03-24T10:14:00Z", sensores: 1 },
  { id: 7, nome: "Torno CNC F1", setor: "Usinagem", tipo: "Torno CNC", criticidade: "ALTA", integridade: 73, scoreEstabilidade: 64, status: "OK", ultimaLeituraEm: "2026-03-24T10:10:00Z", sensores: 2 },
  { id: 8, nome: "Prensa G4", setor: "Conformação", tipo: "Prensa", criticidade: "MEDIA", integridade: 55, scoreEstabilidade: 48, status: "OK", ultimaLeituraEm: "2026-03-24T10:09:00Z", sensores: 1 },
]

const formVazio = { nome: "", setor: "", tipo: "", criticidade: "MEDIA" }

function tempoRelativo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diff < 60) return `${diff}s atrás`
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  return `${Math.floor(diff / 3600)}h atrás`
}

function CriticidadeBadge({ value }) {
  const styles = { ALTA: "bg-red-100 text-red-700 border-red-200", MEDIA: "bg-yellow-100 text-yellow-700 border-yellow-200", BAIXA: "bg-green-100 text-green-700 border-green-200" }
  return <Badge variant="outline" className={`px-1.5 ${styles[value]}`}>{value.charAt(0) + value.slice(1).toLowerCase()}</Badge>
}

function StatusBadge({ value }) {
  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      {value === "OK" ? <CircleCheckIcon className="fill-[#5E17EB]! dark:fill-[#5E17EB]!" /> : <AlertTriangleIcon className="text-red-500" />}
      {value}
    </Badge>
  )
}

function IntegridadeBar({ value }) {
  const cor = value < 50 ? "bg-red-500" : value < 75 ? "bg-yellow-400" : "bg-green-500"
  const textCor = value < 50 ? "text-red-500" : value < 75 ? "text-yellow-500" : "text-green-600"
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${cor} transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-sm font-medium w-9 text-right ${textCor}`}>{value}%</span>
    </div>
  )
}

export default function MaquinasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [maquinas, setMaquinas] = React.useState(mockMaquinas)
  const [busca, setBusca] = React.useState("")
  const [sheetAberto, setSheetAberto] = React.useState(false)
  const [modoSheet, setModoSheet] = React.useState("criar") // "criar" | "editar" | "ver"
  const [maquinaSelecionada, setMaquinaSelecionada] = React.useState(null)
  const [form, setForm] = React.useState(formVazio)
  const [dialogExcluir, setDialogExcluir] = React.useState(false)
  const [maquinaExcluir, setMaquinaExcluir] = React.useState(null)
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

  React.useEffect(() => {
    if (searchParams.get("action") === "new") {
      abrirCriar()
    }
  }, [])

  function abrirCriar() {
    setModoSheet("criar")
    setForm(formVazio)
    setMaquinaSelecionada(null)
    setSheetAberto(true)
  }

  function abrirEditar(maquina) {
    setModoSheet("editar")
    setForm({ nome: maquina.nome, setor: maquina.setor, tipo: maquina.tipo, criticidade: maquina.criticidade })
    setMaquinaSelecionada(maquina)
    setSheetAberto(true)
  }

  function abrirVer(maquina) {
    setModoSheet("ver")
    setMaquinaSelecionada(maquina)
    setSheetAberto(true)
  }

  function salvar() {
    if (!form.nome || !form.setor || !form.tipo) {
      toast.error("Preencha todos os campos obrigatórios.")
      return
    }

    if (modoSheet === "criar") {
      const nova = {
        ...form,
        id: Math.max(...maquinas.map(m => m.id)) + 1,
        integridade: 100,
        scoreEstabilidade: 100,
        status: "OK",
        ultimaLeituraEm: new Date().toISOString(),
        sensores: 0,
      }
      setMaquinas(prev => [nova, ...prev])
      // TODO: POST /maquinas
      toast.success("Máquina cadastrada com sucesso!")
    } else {
      setMaquinas(prev => prev.map(m => m.id === maquinaSelecionada.id ? { ...m, ...form } : m))
      // TODO: PUT /maquinas/:id
      toast.success("Máquina atualizada com sucesso!")
    }
    setSheetAberto(false)
  }

  function confirmarExcluir(maquina) {
    setMaquinaExcluir(maquina)
    setDialogExcluir(true)
  }

  function excluir() {
    setMaquinas(prev => prev.filter(m => m.id !== maquinaExcluir.id))
    // TODO: DELETE /maquinas/:id
    toast.success("Máquina removida.")
    setDialogExcluir(false)
  }

  const dadosFiltrados = React.useMemo(() =>
    maquinas.filter(m =>
      m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      m.setor.toLowerCase().includes(busca.toLowerCase()) ||
      m.tipo.toLowerCase().includes(busca.toLowerCase())
    ), [maquinas, busca])

  const columns = [
    {
      accessorKey: "nome",
      header: "Máquina",
      cell: ({ row }) => (
        <button onClick={() => abrirVer(row.original)} className="text-left font-medium text-sm hover:underline hover:text-primary transition-colors">
          {row.original.nome}
        </button>
      ),
    },
    {
      accessorKey: "setor",
      header: "Setor",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.setor}</span>,
    },
    {
      accessorKey: "criticidade",
      header: "Criticidade",
      cell: ({ row }) => <CriticidadeBadge value={row.original.criticidade} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge value={row.original.status} />,
    },
    {
      accessorKey: "integridade",
      header: "Integridade",
      cell: ({ row }) => <IntegridadeBar value={row.original.integridade} />,
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
            <DropdownMenuItem onClick={() => abrirVer(row.original)}>
              <EyeIcon className="size-4 mr-1" /> Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => abrirEditar(row.original)}>
              <PencilIcon className="size-4 mr-1" /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => confirmarExcluir(row.original)}>
              <Trash2Icon className="size-4 mr-1" /> Excluir
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
    <div className="flex flex-col gap-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-medium text-[#3B2867]">Máquinas</h1>
            <p className="text-sm text-muted-foreground">{maquinas.length} máquinas cadastradas</p>
          </div>
        </div>
        <Button onClick={abrirCriar} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <PlusIcon className="size-4 mr-1" />
          Nova máquina
        </Button>
      </div>

      <Separator />

      {/* Busca */}
      <div className="relative w-full max-w-sm">
        <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, setor ou tipo..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(h => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
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

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {dadosFiltrados.length} resultado(s)
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="size-8" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
            <ChevronsLeftIcon className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="text-sm">Pág. {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}</span>
          <Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
            <ChevronsRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Sheet criar / editar / ver */}
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
                  {[
                    ["Nome", maquinaSelecionada.nome],
                    ["Setor", maquinaSelecionada.setor],
                    ["Tipo", maquinaSelecionada.tipo],
                    ["Sensores vinculados", maquinaSelecionada.sensores],
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
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground text-xs">Integridade</Label>
                  <IntegridadeBar value={maquinaSelecionada.integridade} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground text-xs">Score de estabilidade</Label>
                  <IntegridadeBar value={maquinaSelecionada.scoreEstabilidade} />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs">Último sinal</Label>
                  <span className="text-sm">{tempoRelativo(maquinaSelecionada.ultimaLeituraEm)}</span>
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => { setSheetAberto(false); setTimeout(() => abrirEditar(maquinaSelecionada), 100) }}>
                    <PencilIcon className="size-4 mr-1" /> Editar
                  </Button>
                  <Button variant="destructive" onClick={() => { setSheetAberto(false); setTimeout(() => confirmarExcluir(maquinaSelecionada), 100) }}>
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
                    <SelectTrigger id="criticidade" className="w-full">
                      <SelectValue placeholder="Selecionar criticidade" />
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
              </>
            )}
          </div>

          {modoSheet !== "ver" && (
            <SheetFooter className="px-4 pb-4">
              <Button variant="outline" onClick={() => setSheetAberto(false)}>Cancelar</Button>
              <Button onClick={salvar}>
                {modoSheet === "criar" ? "Cadastrar" : "Salvar alterações"}
              </Button>
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
              Tem certeza que deseja excluir <strong>{maquinaExcluir?.nome}</strong>? Esta ação não pode ser desfeita e removerá todos os sensores e alertas vinculados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogExcluir(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={excluir}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}