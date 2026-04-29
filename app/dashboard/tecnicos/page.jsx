"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { useTecnicos } from "@/components/context/tecnicos-context"
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions"

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
  CircleCheckIcon, CircleMinusIcon, ImageIcon, RefreshCcwIcon,
} from "lucide-react"
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getSortedRowModel, useReactTable,
} from "@tanstack/react-table"
import { tempoRelativo } from "@/lib/utils"

const ESPECIALIDADES = [
  "Elétrica Industrial",
  "Mecânica de Precisão",
  "Hidráulica e Pneumática",
  "Automação Industrial",
  "Instrumentação",
  "Manutenção Preditiva",
]

const formVazio = {
  nome: "", email: "", senha: "", telefone: "",
  especialidade: "Elétrica Industrial", ativo: true, foto: "",
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
      <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold dark:bg-primary/20 dark:text-primary-foreground">
        {getInitials(tecnico.nome)}
      </AvatarFallback>
    </Avatar>
  )
}

function StatusTecnicoBadge({ value }) {
  const isAtivo = value === "ATIVO"
  return (
    <Badge variant="outline" className={`px-1.5 ${isAtivo ? "text-green-700 bg-green-50 border-green-200 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300" : "text-gray-500 bg-gray-50 border-gray-200 dark:border-border dark:bg-muted/30 dark:text-muted-foreground"}`}>
      {isAtivo ? <CircleCheckIcon className="fill-green-600!" /> : <CircleMinusIcon className="text-gray-400 dark:text-muted-foreground" />}
      {isAtivo ? "Ativo" : "Inativo"}
    </Badge>
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

export default function TecnicosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const permissions = useDashboardPermissions()
  const {
    tecnicos,
    status,
    mensagem,
    carregando,
    salvando,
    totalPaginas,
    paginaAtual,
    adicionarTecnico,
    editarTecnico,
    excluirTecnico,
    recarregarTecnicos,
  } = useTecnicos()

  const [busca, setBusca] = React.useState("")
  const [sheetAberto, setSheetAberto] = React.useState(false)
  const [modoSheet, setModoSheet] = React.useState("criar")
  const [tecnicoSelecionado, setTecnicoSelecionado] = React.useState(null)
  const [form, setForm] = React.useState(formVazio)
  const [dialogExcluir, setDialogExcluir] = React.useState(false)
  const [tecnicoExcluir, setTecnicoExcluir] = React.useState(null)
  const [limiteItems] = React.useState(10)

  React.useEffect(() => {
    if (!permissions.canViewTecnicos) {
      router.replace("/dashboard")
    }
  }, [permissions.canViewTecnicos, router])

  const loadingInicial = carregando && tecnicos.length === 0
  const errorSemDados = status === "error" && tecnicos.length === 0
  const canManageTecnicos = permissions.canManageTecnicos
  const totalAtivos = React.useMemo(() => tecnicos.filter((tecnico) => tecnico.status === "ATIVO").length, [tecnicos])
  const totalInativos = React.useMemo(() => tecnicos.filter((tecnico) => tecnico.status === "INATIVO").length, [tecnicos])
  const totalAlertas = React.useMemo(
    () => tecnicos.reduce((acc, tecnico) => acc + (tecnico.alertasAtendidos || 0), 0),
    [tecnicos]
  )
  const tecnicosComAlertas = React.useMemo(
    () => tecnicos.filter((tecnico) => tecnico.status === "ATIVO" && tecnico.alertasAtendidos > 0).length,
    [tecnicos]
  )

  React.useEffect(() => {
    if (!permissions.canViewTecnicos) {
      return
    }

    if (searchParams.get("action") === "new") {
      if (!canManageTecnicos) {
        router.replace("/dashboard/tecnicos")
        return
      }

      abrirCriar()
    }
  }, [canManageTecnicos, permissions.canViewTecnicos, router, searchParams])

  React.useEffect(() => {
    if (!permissions.canViewTecnicos) {
      return
    }

    recarregarTecnicos(1, limiteItems)
  }, [limiteItems, permissions.canViewTecnicos, recarregarTecnicos])

  if (!permissions.canViewTecnicos) {
    return null
  }

  function abrirCriar() {
    if (!canManageTecnicos) {
      return
    }

    setModoSheet("criar")
    setForm(formVazio)
    setTecnicoSelecionado(null)
    setSheetAberto(true)
  }

  function abrirEditar(tecnico) {
    if (!canManageTecnicos) {
      return
    }

    setModoSheet("editar")
    setForm({
      nome: tecnico.nome, email: tecnico.email,
      senha: "",
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

  async function salvar() {
    if (!form.nome.trim() || !form.email.trim()) {
      toast.error("Preencha todos os campos obrigatórios.")
      return
    }
    if (modoSheet === "criar" && !form.senha.trim()) {
      toast.error("Informe a senha inicial do tecnico.")
      return
    }

    try {
      if (modoSheet === "criar") {
        await adicionarTecnico({
          nome: form.nome.trim(),
          email: form.email.trim(),
          senha: form.senha,
          role: "TECNICO",
        })
        toast.success("Técnico cadastrado com sucesso!")
      } else {
        await editarTecnico(tecnicoSelecionado.id, {
          nome: form.nome.trim(),
          //email: form.email.trim(),
          telefone: form.telefone.trim(),
          especialidade: form.especialidade,
          ativo: form.status,
          ...(form.foto && { foto: form.foto.trim() || null }),
        })
        toast.success("Técnico atualizado com sucesso!")
      }

      setSheetAberto(false)
      setForm(formVazio)
      setTecnicoSelecionado(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar o tecnico.")
    }
  }

  function confirmarExcluir(tecnico) {
    if (!canManageTecnicos) {
      return
    }

    setTecnicoExcluir(tecnico)
    setDialogExcluir(true)
  }

  function alternarDialogExcluir(open) {
    setDialogExcluir(open)

    if (!open) {
      setTecnicoExcluir(null)
    }
  }

  async function excluir() {
    if (!tecnicoExcluir) {
      return
    }

    try {
      await excluirTecnico(tecnicoExcluir.id)
      toast.success("Técnico removido.")
      setDialogExcluir(false)
      setSheetAberto(false)
      setTecnicoExcluir(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel remover o tecnico.")
    }
  }

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
        <span className="font-medium tabular-nums text-sm text-[#3B2867] dark:text-white">{row.original.alertasAtendidos}</span>
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
            {canManageTecnicos ? (
              <>
                <DropdownMenuItem onClick={() => abrirEditar(row.original)}><PencilIcon className="size-4 mr-1" /> Editar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => confirmarExcluir(row.original)}><Trash2Icon className="size-4 mr-1" /> Excluir</DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data: tecnicos, columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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
                <UsersIcon size={22} className="text-[#3B2867] dark:text-white" />
                <h1 className="text-lg font-medium text-[#3B2867] dark:text-white">Técnicos</h1>
              </div>
            
            </div>
          </div>
          {canManageTecnicos ? (
            <Button onClick={abrirCriar} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={salvando}>
              <PlusIcon className="size-4 mr-1" />Novo técnico
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
              <Button variant="outline" size="sm" onClick={() => recarregarTecnicos()} disabled={carregando || salvando}>
                <RefreshCcwIcon className="mr-1 size-4" />
                Atualizar
              </Button>
            </div>
          </div>
        ) : null}

        {/* Cards de resumo */}
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

  {/* Total de técnicos */}
  <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-[#5E17EB]! hover:ring-[#5E17EB]/50">
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground font-medium">Total de técnicos</span>
      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
        {loadingInicial ? "Sincronizando" : `${totalAtivos} ativos`}
      </span>
    </div>
    <span className="text-3xl font-bold text-[#3B2867] dark:text-white">{formatMetric(tecnicos.length, loadingInicial)}</span>
    <div className="flex flex-col gap-0.5 text-sm">
      <span className="text-green-700 dark:text-green-300 flex items-center gap-1">
        <CircleCheckIcon className="size-3.5 fill-green-600" />
        {loadingInicial ? "Atualizando equipe..." : `${totalAtivos} operando normalmente`}
      </span>
      <span className="text-muted-foreground flex items-center gap-1">
        <CircleMinusIcon className="size-3.5 text-gray-400 dark:text-muted-foreground" />
        {loadingInicial ? "Conferindo status..." : `${totalInativos} inativos`}
      </span>
    </div>
  </div>

  {/* Com alertas ativos */}
  <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-[#5E17EB]! hover:ring-[#5E17EB]/50">
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground font-medium">Com alertas ativos</span>
      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">hoje</span>
    </div>
    <span className="text-3xl font-bold text-[#3B2867] dark:text-white">{formatMetric(tecnicosComAlertas, loadingInicial)}</span>
    <div className="flex flex-col gap-0.5 text-sm">
      <span className="text-muted-foreground">
        {loadingInicial ? "Sincronizando disponibilidade" : `${Math.max(totalAtivos - tecnicosComAlertas, 0)} disponiveis`}
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
    <span className="text-3xl font-bold text-[#3B2867] dark:text-white">{formatMetric(totalAlertas, loadingInicial)}</span>
    <div className="flex flex-col gap-0.5 text-sm">
      <span className="text-muted-foreground">
        {loadingInicial ? "Calculando media..." : `Media de ${tecnicos.length ? (totalAlertas / tecnicos.length).toFixed(1) : 0} por tecnico`}
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

        {loadingInicial ? (
          <StatePanel message="Sincronizando tecnicos da pagina com a API..." />
        ) : errorSemDados ? (
          <StatePanel message={mensagem || "Nao foi possivel carregar os tecnicos."} tone="error" />
        ) : (
          <>
        {/* Tabela */}
        <div className="min-h-[500px] overflow-auto rounded-lg border bg-card dark:border-gray-700! dark:bg-[#0F172A]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id}>
                  {hg.headers.map(h => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow className="relative z-0" key={row.id}>
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
          <span className="text-sm text-muted-foreground">{tecnicos.length} resultado(s) nesta página</span>
          <div className="flex w-full items-center justify-end gap-8 lg:w-fit">
            <Button 
              variant="outline" 
              size="icon" 
              className="hidden size-8 lg:flex" 
              onClick={() => recarregarTecnicos(1, limiteItems)} 
              disabled={paginaAtual <= 1 || carregando}
            >
              <ChevronsLeftIcon className="size-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="size-8" 
              onClick={() => recarregarTecnicos(paginaAtual - 1, limiteItems)} 
              disabled={paginaAtual <= 1 || carregando}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="text-sm">Pág. {paginaAtual} de {Math.max(totalPaginas, 1)}</span>
            <Button 
              variant="outline" 
              size="icon" 
              className="size-8" 
              onClick={() => recarregarTecnicos(paginaAtual + 1, limiteItems)} 
              disabled={paginaAtual >= totalPaginas || carregando}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="hidden size-8 lg:flex" 
              onClick={() => recarregarTecnicos(totalPaginas, limiteItems)} 
              disabled={paginaAtual >= totalPaginas || carregando}
            >
              <ChevronsRightIcon className="size-4" />
            </Button>
          </div>
        </div>
          </>
        )}

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
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-linear-to-r from-purple-50 to-violet-50 border border-purple-100 dark:from-primary/10 dark:to-muted/30 dark:border-primary/30">
                    <TecnicoAvatar tecnico={tecnicoSelecionado} size="lg" />
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-base text-[#3B2867] dark:text-white">{tecnicoSelecionado.nome}</span>
                      <span className="text-sm text-muted-foreground">{tecnicoSelecionado.especialidade}</span>
                      <StatusTecnicoBadge value={tecnicoSelecionado.status} />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-3">
                    {[
                      ["E-mail", tecnicoSelecionado.email],
                      ["Telefone", tecnicoSelecionado.telefone],
                      ["Cadastrado", tempoRelativo(tecnicoSelecionado.criadoEm)],
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
                    <span className="text-2xl font-bold text-[#3B2867] dark:text-white">{tecnicoSelecionado.alertasAtendidos}</span>
                  </div>

                  <Separator />

                  {canManageTecnicos ? (
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => { setSheetAberto(false); setTimeout(() => abrirEditar(tecnicoSelecionado), 100) }} disabled={salvando}>
                        <PencilIcon className="size-4 mr-1" /> Editar
                      </Button>
                      <Button variant="destructive" onClick={() => confirmarExcluir(tecnicoSelecionado)} disabled={salvando}>
                        <Trash2Icon className="size-4 mr-1" /> Excluir
                      </Button>
                    </div>
                  ) : null}
                </>

              ) : (

                /* ── MODO CRIAR / EDITAR ── */
                <>
                  {/* Preview do avatar no formulário */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={form.foto || undefined} />
                      <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold text-sm dark:bg-primary/20 dark:text-primary-foreground">
                        {form.nome ? getInitials(form.nome) : <ImageIcon className="size-4 text-muted-foreground" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{form.nome || "Nome do técnico"}</span>
                      <span className="text-xs text-muted-foreground">{modoSheet === "criar" ? "Perfil tecnico" : form.especialidade}</span>
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

                  {modoSheet === "criar" ? (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="senha">Senha inicial <span className="text-red-500">*</span></Label>
                      <Input
                        id="senha"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Senha do acesso"
                        value={form.senha}
                        onChange={e => setForm(p => ({ ...p, senha: e.target.value }))}
                      />
                    </div>
                  ) : null}

                  {modoSheet === "editar" ? (
                    <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="telefone">Telefone</Label>
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
                  ) : null}
                </>
              )}
            </div>

            {modoSheet !== "ver" && (
              <SheetFooter className="px-4 pb-4">
                <Button variant="outline" onClick={() => setSheetAberto(false)} disabled={salvando}>Cancelar</Button>
                <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : modoSheet === "criar" ? "Cadastrar" : "Salvar alteracoes"}</Button>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>

        {/* Dialog confirmar exclusão */}
        <Dialog open={dialogExcluir} onOpenChange={alternarDialogExcluir}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir <strong>{tecnicoExcluir?.nome}</strong>? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => alternarDialogExcluir(false)} disabled={salvando}>Cancelar</Button>
              <Button variant="destructive" onClick={excluir} disabled={salvando}>{salvando ? "Excluindo..." : "Excluir"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </>
  )
}
