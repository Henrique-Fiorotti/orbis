"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeftIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
  CircleCheckIcon,
  CircleMinusIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  ImageIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { useAuthSession } from "@/hooks/use-auth-session"
import { useTecnicos } from "@/components/context/tecnicos-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SiteHeader } from "@/components/site-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatRoleLabel, getUserInitials } from "@/lib/user-models"

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrador" },
  { value: "TECNICO", label: "Tecnico" },
]

const STATUS_OPTIONS = [
  { value: "ATIVO", label: "Ativo" },
  { value: "INATIVO", label: "Inativo" },
]

const formVazio = {
  nome: "",
  email: "",
  telefone: "",
  especialidade: "",
  setor: "",
  status: "ATIVO",
  role: "TECNICO",
  foto: "",
}

function TecnicoAvatar({ tecnico, size = "default" }) {
  const sizeClass =
    size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-7 w-7 text-xs" : "h-8 w-8 text-xs"

  return (
    <Avatar className={sizeClass}>
      <AvatarImage src={tecnico.foto || undefined} alt={tecnico.nome} />
      <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
        {getUserInitials(tecnico.nome)}
      </AvatarFallback>
    </Avatar>
  )
}

function StatusTecnicoBadge({ value }) {
  const isAtivo = value === "ATIVO"

  return (
    <Badge
      variant="outline"
      className={`px-1.5 ${
        isAtivo ? "text-green-700 bg-green-50 border-green-200" : "text-gray-500 bg-gray-50 border-gray-200"
      }`}
    >
      {isAtivo ? <CircleCheckIcon className="fill-green-600!" /> : <CircleMinusIcon className="text-gray-400" />}
      {isAtivo ? "Ativo" : "Inativo"}
    </Badge>
  )
}

function RoleBadge({ value }) {
  return (
    <Badge variant="outline" className="px-1.5 bg-purple-100 text-purple-700 border-purple-200">
      {formatRoleLabel(value)}
    </Badge>
  )
}

export default function TecnicosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const session = useAuthSession()
  const isAdmin = session?.role === "ADMIN"
  const {
    tecnicos,
    status,
    mensagem,
    carregando,
    salvando,
    adicionarTecnico,
    editarTecnico,
    excluirTecnico,
  } = useTecnicos()

  const [busca, setBusca] = React.useState("")
  const [sheetAberto, setSheetAberto] = React.useState(false)
  const [modoSheet, setModoSheet] = React.useState("criar")
  const [tecnicoSelecionado, setTecnicoSelecionado] = React.useState(null)
  const [form, setForm] = React.useState(formVazio)
  const [dialogExcluir, setDialogExcluir] = React.useState(false)
  const [tecnicoExcluir, setTecnicoExcluir] = React.useState(null)
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

  React.useEffect(() => {
    if (session && !isAdmin) {
      router.replace("/dashboard/perfil")
    }
  }, [session, isAdmin, router])

  React.useEffect(() => {
    if (searchParams.get("action") === "new") {
      abrirCriar()
    }
  }, [searchParams])

  function abrirCriar() {
    setModoSheet("criar")
    setForm(formVazio)
    setTecnicoSelecionado(null)
    setSheetAberto(true)
  }

  function abrirEditar(tecnico) {
    setModoSheet("editar")
    setForm({
      nome: tecnico.nome,
      email: tecnico.email,
      telefone: tecnico.telefone,
      especialidade: tecnico.especialidade,
      setor: tecnico.setor || "",
      status: tecnico.status,
      role: tecnico.role || "TECNICO",
      foto: tecnico.foto || "",
    })
    setTecnicoSelecionado(tecnico)
    setSheetAberto(true)
  }

  function abrirPerfil(tecnico) {
    router.push(`/dashboard/tecnicos/perfil/${tecnico.id}`)
  }

  async function salvar() {
    if (!form.nome.trim() || !form.email.trim()) {
      toast.error("Preencha os campos obrigatorios.")
      return
    }

    const payload = {
      ...form,
      foto: form.foto.trim() || null,
    }

    try {
      if (modoSheet === "criar") {
        await adicionarTecnico(payload)
        toast.success("Tecnico cadastrado com sucesso.")
      } else if (tecnicoSelecionado) {
        await editarTecnico(tecnicoSelecionado.id, payload)
        toast.success("Tecnico atualizado com sucesso.")
      }

      setSheetAberto(false)
      setForm(formVazio)
      setTecnicoSelecionado(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar o tecnico.")
    }
  }

  function confirmarExcluir(tecnico) {
    setTecnicoExcluir(tecnico)
    setDialogExcluir(true)
  }

  async function removerTecnico() {
    if (!tecnicoExcluir) {
      return
    }

    try {
      await excluirTecnico(tecnicoExcluir.id)
      toast.success("Tecnico removido.")
      setDialogExcluir(false)
      setTecnicoExcluir(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel remover o tecnico.")
    }
  }

  const dadosFiltrados = React.useMemo(
    () =>
      tecnicos.filter((tecnico) => {
        const termo = busca.toLowerCase()

        return (
          tecnico.nome.toLowerCase().includes(termo) ||
          tecnico.especialidade.toLowerCase().includes(termo) ||
          tecnico.email.toLowerCase().includes(termo) ||
          (tecnico.setor || "").toLowerCase().includes(termo) ||
          formatRoleLabel(tecnico.role).toLowerCase().includes(termo)
        )
      }),
    [tecnicos, busca]
  )

  const totalAlertas = tecnicos.reduce((acc, tecnico) => acc + (tecnico.alertasAtendidos || 0), 0)
  const tecnicosComAlertas = tecnicos.filter(
    (tecnico) => tecnico.status === "ATIVO" && tecnico.alertasAtendidos > 0
  ).length

  const columns = React.useMemo(
    () => [
      {
        accessorKey: "nome",
        header: "Tecnico",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <TecnicoAvatar tecnico={row.original} size="sm" />
            <button
              onClick={() => abrirPerfil(row.original)}
              className="text-left font-medium text-sm hover:underline hover:text-primary transition-colors"
            >
              {row.original.nome}
            </button>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Cargo / Perfil",
        cell: ({ row }) => <RoleBadge value={row.original.role} />,
      },
      {
        accessorKey: "especialidade",
        header: "Especialidade",
        cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.especialidade || "—"}</span>,
      },
      {
        accessorKey: "email",
        header: "E-mail",
        cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.email}</span>,
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
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => abrirPerfil(row.original)}>
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
    ],
    []
  )

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

  if (session && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-sm text-muted-foreground">
        Redirecionando para o seu perfil...
      </div>
    )
  }

  return (
    <>
      <SiteHeader />

      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeftIcon className="size-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <UsersIcon size={22} className="text-[#3B2867]" />
                <h1 className="text-lg font-medium text-[#3B2867]">Tecnicos</h1>
              </div>
              <p className="text-sm text-muted-foreground">Gerencie tecnicos e abra perfis completos por rota.</p>
            </div>
          </div>
          <Button onClick={abrirCriar} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <PlusIcon className="size-4 mr-1" />
            Novo tecnico
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
            {mensagem}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Total de tecnicos</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {tecnicos.filter((tecnico) => tecnico.status === "ATIVO").length} ativos
              </span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867]">{carregando ? "--" : tecnicos.length}</span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="text-green-700 flex items-center gap-1">
                <CircleCheckIcon className="size-3.5 fill-green-600" />
                {tecnicos.filter((tecnico) => tecnico.status === "ATIVO").length} operando normalmente
              </span>
              <span className="text-muted-foreground flex items-center gap-1">
                <CircleMinusIcon className="size-3.5 text-gray-400" />
                {tecnicos.filter((tecnico) => tecnico.status === "INATIVO").length} inativos
              </span>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Com alertas ativos</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">agora</span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867]">{carregando ? "--" : tecnicosComAlertas}</span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="text-muted-foreground">
                {tecnicos.filter((tecnico) => tecnico.status === "ATIVO").length - tecnicosComAlertas} disponiveis
              </span>
              <span className="text-muted-foreground text-xs">Tecnicos ativos com atendimentos registrados</span>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Alertas atendidos</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">total</span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867]">{carregando ? "--" : totalAlertas}</span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="text-muted-foreground">
                Media de {tecnicos.length ? (totalAlertas / tecnicos.length).toFixed(1) : 0} por tecnico
              </span>
              <span className="text-muted-foreground text-xs">Todos os atendimentos sincronizados da API</span>
            </div>
          </div>
        </div>

        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, especialidade, e-mail ou role..."
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            className="pl-8"
          />
        </div>

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
                  <TableRow className="h-[88px]" key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    {carregando ? "Carregando tecnicos..." : "Nenhum tecnico encontrado."}
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
            <span className="text-sm">
              Pag. {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}
            </span>
            <Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRightIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRightIcon className="size-4" />
            </Button>
          </div>
        </div>

        <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
          <SheetContent side="right" className="w-[420px]! max-w-none! sm:max-w-none!">
            <SheetHeader>
              <SheetTitle>{modoSheet === "criar" ? "Novo tecnico" : "Editar tecnico"}</SheetTitle>
              <SheetDescription>
                {modoSheet === "criar"
                  ? "Preencha os dados para cadastrar um novo tecnico."
                  : "Altere os dados do tecnico e salve as mudancas."}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto flex-1">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={form.foto || undefined} />
                  <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold text-sm">
                    {form.nome ? getUserInitials(form.nome) : <ImageIcon className="size-4 text-muted-foreground" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{form.nome || "Nome do tecnico"}</span>
                  <span className="text-xs text-muted-foreground">{form.especialidade || "Especialidade"}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input id="nome" value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" value={form.telefone} onChange={(event) => setForm((current) => ({ ...current, telefone: event.target.value }))} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="especialidade">Especialidade</Label>
                <Input id="especialidade" value={form.especialidade} onChange={(event) => setForm((current) => ({ ...current, especialidade: event.target.value }))} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="setor">Setor</Label>
                <Input id="setor" value={form.setor} onChange={(event) => setForm((current) => ({ ...current, setor: event.target.value }))} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="role">Cargo / Perfil</Label>
                <Select value={form.role} onValueChange={(value) => setForm((current) => ({ ...current, role: value }))}>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="foto">URL da foto</Label>
                <Input id="foto" value={form.foto} onChange={(event) => setForm((current) => ({ ...current, foto: event.target.value }))} />
              </div>
            </div>

            <SheetFooter className="px-4 pb-4">
              <Button variant="outline" onClick={() => setSheetAberto(false)} disabled={salvando}>
                Cancelar
              </Button>
              <Button onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando..." : modoSheet === "criar" ? "Cadastrar" : "Salvar alteracoes"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Dialog open={dialogExcluir} onOpenChange={setDialogExcluir}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusao</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir <strong>{tecnicoExcluir?.nome}</strong>? Esta acao nao pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogExcluir(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={removerTecnico} disabled={salvando}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
