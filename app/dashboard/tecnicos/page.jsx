"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { useTecnicos } from "@/components/context/tecnicos-context"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  UsersIcon, EllipsisVerticalIcon, PlusIcon,
  ArrowLeftIcon, PencilIcon, Trash2Icon, EyeIcon, SearchIcon,
  ChevronsLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon,
  CircleCheckIcon, CircleMinusIcon, ImageIcon,
} from "lucide-react"
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table"

const ESPECIALIDADES = [
  "Elétrica Industrial",
  "Mecânica de Precisão",
  "Hidráulica e Pneumática",
  "Automação Industrial",
  "Instrumentação",
  "Manutenção Preditiva",
]

const formVazio = {
  nome: "", email: "", telefone: "",
  especialidade: "Elétrica Industrial", status: "ATIVO", foto: "",
}

function getInitials(nome) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join("")
}

function TecnicoAvatar({ tecnico, size = "default" }) {
  const sizeClass = size === "lg"
    ? "h-16 w-16 text-xl"
    : size === "sm"
      ? "h-7 w-7 text-xs"
      : "h-8 w-8 text-xs"

  return (
    <Avatar className={sizeClass}>
      <AvatarImage src={tecnico.foto || undefined} alt={tecnico.nome} />
      <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
        {getInitials(tecnico.nome)}
      </AvatarFallback>
    </Avatar>
  )
}

function StatusTecnicoBadge({ value }) {
  const isAtivo = value === "ATIVO"
  return (
    <Badge variant="outline" className={`px-1.5 ${isAtivo ? "text-green-700 bg-green-50 border-green-200" : "text-gray-500 bg-gray-50 border-gray-200"}`}>
      {isAtivo ? <CircleCheckIcon className="fill-green-600!" /> : <CircleMinusIcon className="text-gray-400" />}
      {isAtivo ? "Ativo" : "Inativo"}
    </Badge>
  )
}



export default function TecnicosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { tecnicos, adicionarTecnico, editarTecnico, excluirTecnico } = useTecnicos()

  const [busca, setBusca] = React.useState("")
  const [sheetAberto, setSheetAberto] = React.useState(false)
  const [modoSheet, setModoSheet] = React.useState("criar")
  const [tecnicoSelecionado, setTecnicoSelecionado] = React.useState(null)
  const [form, setForm] = React.useState(formVazio)
  const [dialogExcluir, setDialogExcluir] = React.useState(false)
  const [tecnicoExcluir, setTecnicoExcluir] = React.useState(null)
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

  // Adicione essa função dentro do TecnicosPage, antes do return:

  const totalAlertas = tecnicos.reduce((acc, t) => acc + (t.alertasAtendidos || 0), 0)
  const topTecnico = [...tecnicos].sort((a, b) => b.alertasAtendidos - a.alertasAtendidos)[0]
  const tecnicosComAlertas = tecnicos.filter(t => t.status === "ATIVO" && t.alertasAtendidos > 0).length
  const especialidadesCobertas = new Set(
  tecnicos.filter(t => t.status === "ATIVO").map(t => t.especialidade)
).size

  React.useEffect(() => {
    if (searchParams.get("action") === "new") abrirCriar()
  }, [])

  function abrirCriar() {
    setModoSheet("criar")
    setForm(formVazio)
    setTecnicoSelecionado(null)
    setSheetAberto(true)
  }

  function abrirEditar(tecnico) {
    setModoSheet("editar")
    setForm({
      nome: tecnico.nome, email: tecnico.email,
      telefone: tecnico.telefone, especialidade: tecnico.especialidade,
      status: tecnico.status, foto: tecnico.foto || "",
    })
    setTecnicoSelecionado(tecnico)
    setSheetAberto(true)
  }

  function abrirVer(tecnico) {
    setModoSheet("ver")
    setTecnicoSelecionado(tecnico)
    setSheetAberto(true)
  }

  function salvar() {
    if (!form.nome.trim() || !form.email.trim() || !form.telefone.trim()) {
      toast.error("Preencha todos os campos obrigatórios.")
      return
    }
    const payload = { ...form, foto: form.foto.trim() || null }
    if (modoSheet === "criar") {
      adicionarTecnico(payload)
      toast.success("Técnico cadastrado com sucesso!")
    } else {
      editarTecnico(tecnicoSelecionado.id, payload)
      toast.success("Técnico atualizado com sucesso!")
    }
    setSheetAberto(false)
  }

  function confirmarExcluir(tecnico) {
    setTecnicoExcluir(tecnico)
    setDialogExcluir(true)
  }

  function excluir() {
    excluirTecnico(tecnicoExcluir.id)
    toast.success("Técnico removido.")
    setDialogExcluir(false)
    setSheetAberto(false)
  }

  const dadosFiltrados = React.useMemo(() =>
    tecnicos.filter(t =>
      t.nome.toLowerCase().includes(busca.toLowerCase()) ||
      t.especialidade.toLowerCase().includes(busca.toLowerCase()) ||
      t.email.toLowerCase().includes(busca.toLowerCase())
    ), [tecnicos, busca])

  const columns = [
    {
      accessorKey: "nome",
      header: "Técnico",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <TecnicoAvatar tecnico={row.original} size="sm" />
          <button
            onClick={() => abrirVer(row.original)}
            className="text-left font-medium text-sm hover:underline hover:text-primary transition-colors"
          >
            {row.original.nome}
          </button>
        </div>
      ),
    },
    {
      accessorKey: "especialidade",
      header: "Especialidade",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.especialidade}</span>,
    },
    {
      accessorKey: "email",
      header: "E-mail",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.email}</span>,
    },
    {
      accessorKey: "telefone",
      header: "Telefone",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.telefone}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusTecnicoBadge value={row.original.status} />,
    },
    {
      accessorKey: "alertasAtendidos",
      header: "Alertas atendidos",
      cell: ({ row }) => (
        <span className="font-medium tabular-nums text-sm text-[#3B2867]">{row.original.alertasAtendidos}</span>
      ),
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
                <UsersIcon size={22} className="text-[#3B2867]" />
                <h1 className="text-lg font-medium text-[#3B2867]">Técnicos</h1>
              </div>
            
            </div>
          </div>
          <Button onClick={abrirCriar} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <PlusIcon className="size-4 mr-1" />Novo técnico
          </Button>
        </div>

        <Separator />

        {/* Cards de resumo */}
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

  {/* Total de técnicos */}
  <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-[#5E17EB]! hover:ring-[#5E17EB]/50">
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground font-medium">Total de técnicos</span>
      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
        {tecnicos.filter(t => t.status === "ATIVO").length} ativos
      </span>
    </div>
    <span className="text-3xl font-bold text-[#3B2867]">{tecnicos.length}</span>
    <div className="flex flex-col gap-0.5 text-sm">
      <span className="text-green-700 flex items-center gap-1">
        <CircleCheckIcon className="size-3.5 fill-green-600" />
        {tecnicos.filter(t => t.status === "ATIVO").length} operando normalmente
      </span>
      <span className="text-muted-foreground flex items-center gap-1">
        <CircleMinusIcon className="size-3.5 text-gray-400" />
        {tecnicos.filter(t => t.status === "INATIVO").length} inativos
      </span>
    </div>
  </div>

  {/* Com alertas ativos */}
  <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-[#5E17EB]! hover:ring-[#5E17EB]/50">
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground font-medium">Com alertas ativos</span>
      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">hoje</span>
    </div>
    <span className="text-3xl font-bold text-[#3B2867]">{tecnicosComAlertas}</span>
    <div className="flex flex-col gap-0.5 text-sm">
      <span className="text-muted-foreground">
        {tecnicos.filter(t => t.status === "ATIVO").length - tecnicosComAlertas} disponíveis
      </span>
      <span className="text-muted-foreground text-xs">Técnicos ativos com atendimentos</span>
    </div>
  </div>

  {/* Alertas atendidos */}
  <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-[#5E17EB]! hover:ring-[#5E17EB]/50">
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground font-medium">Alertas atendidos</span>
      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">total</span>
    </div>
    <span className="text-3xl font-bold text-[#3B2867]">{totalAlertas}</span>
    <div className="flex flex-col gap-0.5 text-sm">
      <span className="text-muted-foreground">
        Média de {tecnicos.length ? (totalAlertas / tecnicos.length).toFixed(1) : 0} por técnico
      </span>
      <span className="text-muted-foreground text-xs">Todos os atendimentos registrados</span>
    </div>
  </div>

</div>

        {/* Busca */}
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, especialidade ou e-mail..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-8" />
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
                  <TableRow className="h-[100px]!" key={row.id}>
                    {row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">Nenhum técnico encontrado.</TableCell>
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
                {modoSheet === "criar" ? "Novo técnico" : modoSheet === "editar" ? "Editar técnico" : "Detalhes do técnico"}
              </SheetTitle>
              <SheetDescription>
                {modoSheet === "criar" ? "Preencha os dados para cadastrar um novo técnico." :
                  modoSheet === "editar" ? "Altere os dados e clique em salvar." :
                    "Informações completas do técnico."}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4  px-4 py-4 overflow-y-auto flex-1">

              {/* ── MODO VER ── */}
              {modoSheet === "ver" && tecnicoSelecionado ? (
                <>
                  {/* Avatar + nome em destaque */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100">
                    <TecnicoAvatar tecnico={tecnicoSelecionado} size="lg" />
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-base text-[#3B2867]">{tecnicoSelecionado.nome}</span>
                      <span className="text-sm text-muted-foreground">{tecnicoSelecionado.especialidade}</span>
                      <StatusTecnicoBadge value={tecnicoSelecionado.status} />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-3">
                    {[
                      ["E-mail", tecnicoSelecionado.email],
                      ["Telefone", tecnicoSelecionado.telefone],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <Label className="text-muted-foreground text-xs">{label}</Label>
                        <span className="text-sm font-medium break-all">{value}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs">Alertas atendidos</Label>
                    <span className="text-2xl font-bold text-[#3B2867]">{tecnicoSelecionado.alertasAtendidos}</span>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => { setSheetAberto(false); setTimeout(() => abrirEditar(tecnicoSelecionado), 100) }}>
                      <PencilIcon className="size-4 mr-1" /> Editar
                    </Button>
                    <Button variant="destructive" onClick={() => confirmarExcluir(tecnicoSelecionado)}>
                      <Trash2Icon className="size-4 mr-1" /> Excluir
                    </Button>
                  </div>
                </>

              ) : (

                /* ── MODO CRIAR / EDITAR ── */
                <>
                  {/* Preview do avatar no formulário */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={form.foto || undefined} />
                      <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold text-sm">
                        {form.nome ? getInitials(form.nome) : <ImageIcon className="size-4 text-muted-foreground" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{form.nome || "Nome do técnico"}</span>
                      <span className="text-xs text-muted-foreground">{form.especialidade}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="nome">Nome completo <span className="text-red-500">*</span></Label>
                    <Input id="nome" placeholder="Ex: Carlos Eduardo Silva" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">E-mail <span className="text-red-500">*</span></Label>
                    <Input id="email" type="email" placeholder="carlos@orbis.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="telefone">Telefone <span className="text-red-500">*</span></Label>
                    <Input id="telefone" placeholder="(11) 99900-0000" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="especialidade">Especialidade</Label>
                    <Select value={form.especialidade} onValueChange={v => setForm(p => ({ ...p, especialidade: v }))}>
                      <SelectTrigger id="especialidade" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {ESPECIALIDADES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                      <SelectTrigger id="status" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="ATIVO">Ativo</SelectItem>
                          <SelectItem value="INATIVO">Inativo</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="foto">URL da foto <span className="text-muted-foreground text-xs font-normal">(opcional)</span></Label>
                    <Input
                      id="foto"
                      placeholder="https://exemplo.com/foto.jpg"
                      value={form.foto}
                      onChange={e => setForm(p => ({ ...p, foto: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">Deixe em branco para usar as iniciais do nome.</p>
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
                Tem certeza que deseja excluir <strong>{tecnicoExcluir?.nome}</strong>? Esta ação não pode ser desfeita.
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